use axum::{
    extract::{Path, State},
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::CorsLayer;
use tower::ServiceBuilder;
use async_graphql::{EmptySubscription};
use axum::response::Html;
use async_graphql::http::playground_source;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::collections::HashMap;

// Import schema module
mod schema;

// Service registry and circuit breaker imports
use common::{
    service_discovery::{ServiceRegistry, ServiceInstance},
    circuit_breaker::{CircuitBreaker, CircuitBreakerError},
};

// Trello integration module
mod trello_integration;

// Request/response models
#[derive(Deserialize)]
struct ProxyRequest {
    service: String,
    path: String,
    method: String,
    body: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ProxyResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: serde_json::Value,
}

use schema::{QueryRoot, MutationRoot, Schema as ApiSchema};

// Handler for GraphQL requests
async fn graphql_handler(
    State(_state): State<GatewayState>,
    req: async_graphql_axum::GraphQLRequest,
) -> async_graphql_axum::GraphQLResponse {
    let schema = async_graphql::Schema::build(schema::QueryRoot, schema::MutationRoot, async_graphql::EmptySubscription)
        .finish();

    schema.execute(req.into_inner()).await.into()
}

// Handler for GraphQL playground
async fn graphql_playground() -> Html<String> {
    Html(playground_source(async_graphql::http::GraphQLPlaygroundConfig::new("/graphql")))
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

// Gateway state
#[derive(Clone)]
struct GatewayState {
    service_registry: Arc<ServiceRegistry>,
    circuit_breakers: Arc<tokio::sync::Mutex<HashMap<String, CircuitBreaker>>>,
}

// Middleware for logging requests
async fn logging_middleware(req: Request<axum::body::Body>, next: Next) -> Result<Response, StatusCode> {
    println!(
        " incoming request: {} {}",
        req.method(),
        req.uri()
    );

    let response = next.run(req).await;

    println!(
        " outgoing response: {}",
        response.status()
    );

    Ok(response)
}

// Health check for the gateway
async fn gateway_health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "api-gateway",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// Service registration endpoint
async fn register_service(
    State(state): State<GatewayState>,
    Json(service_instance): Json<ServiceInstance>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    state.service_registry.register_service(service_instance)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Service registered successfully"
    })))
}

// Service discovery endpoint
async fn discover_service(
    State(state): State<GatewayState>,
    Path(service_name): Path<String>,
) -> Result<Json<Vec<ServiceInstance>>, StatusCode> {
    let instances = state.service_registry.get_service_instances(&service_name).await;
    Ok(Json(instances))
}

// Proxy request to appropriate service
async fn proxy_request(
    State(state): State<GatewayState>,
    Json(request): Json<ProxyRequest>,
) -> Result<Json<ProxyResponse>, StatusCode> {
    // Find service instance
    let service_instance = state.service_registry.get_random_instance(&request.service)
        .await
        .ok_or(StatusCode::SERVICE_UNAVAILABLE)?;

    // Construct the URL for the target service
    let target_url = format!("http://{}:{}{}",
        service_instance.host,
        service_instance.port,
        request.path
    );

    // Simple proxy without circuit breaker for now
    let client = reqwest::Client::new();
    let response = match request.method.as_str() {
        "GET" => client.get(&target_url).send().await.map_err(|_| StatusCode::BAD_GATEWAY)?,
        "POST" => client.post(&target_url).json(&request.body).send().await.map_err(|_| StatusCode::BAD_GATEWAY)?,
        "PUT" => client.put(&target_url).json(&request.body).send().await.map_err(|_| StatusCode::BAD_GATEWAY)?,
        "DELETE" => client.delete(&target_url).send().await.map_err(|_| StatusCode::BAD_GATEWAY)?,
        _ => return Err(StatusCode::METHOD_NOT_ALLOWED),
    };

    let status = response.status().as_u16();
    let headers = response
        .headers()
        .iter()
        .map(|(name, value)| (name.to_string(), value.to_str().unwrap_or("").to_string()))
        .collect();
    let body = response.json::<serde_json::Value>().await
        .unwrap_or_else(|_| serde_json::json!({"error": "Invalid response"}));

    Ok(Json(ProxyResponse {
        status,
        headers,
        body,
    }))
}

// Main function
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Create gateway state
    let gateway_state = GatewayState {
        service_registry: Arc::new(ServiceRegistry::new()),
        circuit_breakers: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
    };

    // Build our application without state first
    let app = Router::new()
        // Health check
        .route("/health", get(gateway_health))

        // Service registration/discovery endpoints
        .route("/register", post(register_service))
        .route("/discover/{service_name}", get(discover_service))

        // Main proxy endpoint
        .route("/proxy", post(proxy_request))

        // GraphQL endpoint
        .route("/graphql", post(graphql_handler).get(graphql_playground))

        // Trello integration endpoints (commented out for now)
        // .route("/api/v1/trello/board", post(create_trello_board))
        // .route("/api/v1/trello/board/:board_id/setup", post(setup_trello_board))
        // .route("/api/v1/trello/board/:board_id/import-tasks", post(import_trello_tasks))

        // Apply middleware
        .layer(middleware::from_fn(logging_middleware));

    // Apply CORS layer first, then state to avoid compatibility issues
    let app = app
        .layer(
            CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any)
        )
        .with_state(gateway_state);

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidInput, e))?;
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    println!("🚀 API Gateway listening on port {}", port);

    // Run the server
    let server = axum::serve(listener, app);
    server.await.map_err(|err| {
        eprintln!("Server error: {}", err);
        std::io::Error::new(std::io::ErrorKind::Other, err)
    })?;

    Ok(())
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to install CTRL+C signal handler");
}

// Trello integration handlers
#[derive(serde::Deserialize)]
struct CreateBoardRequest {
    name: String,
}

async fn create_trello_board(
    Json(request): Json<CreateBoardRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get Trello credentials from environment
    let api_key = match std::env::var("TRELLO_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            return Ok(Json(serde_json::json!({
                "success": false,
                "message": "Trello API key not configured",
                "errors": ["TRELLO_API_KEY environment variable not set"]
            })));
        }
    };

    let token = match std::env::var("TRELLO_TOKEN") {
        Ok(token) => token,
        Err(_) => {
            return Ok(Json(serde_json::json!({
                "success": false,
                "message": "Trello token not configured",
                "errors": ["TRELLO_TOKEN environment variable not set"]
            })));
        }
    };

    let trello_service = crate::trello_integration::TrelloIntegrationService::new(&api_key, &token);

    match trello_service.setup_project_board(&request.name).await {
        Ok(board_id) => {
            Ok(Json(serde_json::json!({
                "success": true,
                "data": {
                    "board_id": board_id,
                    "board_name": request.name
                },
                "message": "Board created successfully",
                "errors": null
            })))
        }
        Err(e) => {
            Ok(Json(serde_json::json!({
                "success": false,
                "message": "Failed to create Trello board",
                "errors": [e.to_string()]
            })))
        }
    }
}

async fn setup_trello_board(
    axum::extract::Path(board_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get Trello credentials from environment
    let api_key = match std::env::var("TRELLO_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            return Ok(Json(serde_json::json!({
                "success": false,
                "message": "Trello API key not configured",
                "errors": ["TRELLO_API_KEY environment variable not set"]
            })));
        }
    };

    let token = match std::env::var("TRELLO_TOKEN") {
        Ok(token) => token,
        Err(_) => {
            return Ok(Json(serde_json::json!({
                "success": false,
                "message": "Trello token not configured",
                "errors": ["TRELLO_TOKEN environment variable not set"]
            })));
        }
    };

    let trello_service = crate::trello_integration::TrelloIntegrationService::new(&api_key, &token);

    match trello_service.setup_board_lists(&board_id).await {
        Ok(lists) => {
            Ok(Json(serde_json::json!({
                "success": true,
                "data": {
                    "board_id": board_id,
                    "lists_created": lists.len()
                },
                "message": "Board structure setup successfully",
                "errors": null
            })))
        }
        Err(e) => {
            Ok(Json(serde_json::json!({
                "success": false,
                "message": "Failed to setup board structure",
                "errors": [e.to_string()]
            })))
        }
    }
}

async fn import_trello_tasks(
    axum::extract::Path(board_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get Trello credentials from environment
    let api_key = match std::env::var("TRELLO_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            return Ok(Json(serde_json::json!({
                "success": false,
                "message": "Trello API key not configured",
                "errors": ["TRELLO_API_KEY environment variable not set"]
            })));
        }
    };

    let token = match std::env::var("TRELLO_TOKEN") {
        Ok(token) => token,
        Err(_) => {
            return Ok(Json(serde_json::json!({
                "success": false,
                "message": "Trello token not configured",
                "errors": ["TRELLO_TOKEN environment variable not set"]
            })));
        }
    };

    let trello_service = crate::trello_integration::TrelloIntegrationService::new(&api_key, &token);
    let tasks = trello_service.get_default_tasks();

    match trello_service.import_project_tasks(&board_id, tasks).await {
        Ok(_) => {
            Ok(Json(serde_json::json!({
                "success": true,
                "data": {
                    "board_id": board_id,
                    "tasks_imported": true
                },
                "message": "Project tasks imported successfully",
                "errors": null
            })))
        }
        Err(e) => {
            Ok(Json(serde_json::json!({
                "success": false,
                "message": "Failed to import project tasks",
                "errors": [e.to_string()]
            })))
        }
    }
}

// Options handler for CORS preflight requests
async fn options_passthrough() -> Result<Response, StatusCode> {
    Ok(Response::builder()
        .status(axum::http::StatusCode::NO_CONTENT)
        .body(axum::body::Body::empty())
        .unwrap())
}

// Passthrough proxy for direct path-based routing
async fn proxy_passthrough(
    State(state): State<GatewayState>,
    req: Request<axum::body::Body>,
) -> Result<Response, StatusCode> {
    let path = req.uri().path();
    let method = req.method().clone();

    // Extract service name from path (e.g., /api/champions/... -> service "champions")
    let service_name = if path.starts_with("/api/champions") {
        "champion-service"
    } else if path.starts_with("/api/traits") {
        "trait-service"
    } else if path.starts_with("/api/compositions") {
        "composition-service"
    } else if path.starts_with("/api/trait-tracker") {
        "trait-tracker-service"
    } else {
        // Default service if no specific service detected
        "unknown-service"
    };

    // Find service instance
    let service_instance = state.service_registry.get_random_instance(service_name)
        .await
        .ok_or(StatusCode::SERVICE_UNAVAILABLE)?;

    // Construct the URL for the target service
    let target_path = if path.starts_with("/api/champions") ||
                      path.starts_with("/api/traits") ||
                      path.starts_with("/api/compositions") ||
                      path.starts_with("/api/trait-tracker") {
        // Strip the API prefix to get the actual service-specific path
        let stripped_path = path.strip_prefix("/api/champions")
            .or_else(|| path.strip_prefix("/api/traits"))
            .or_else(|| path.strip_prefix("/api/compositions"))
            .or_else(|| path.strip_prefix("/api/trait-tracker"))
            .unwrap_or(path);
        format!("{}", stripped_path)
    } else {
        path.to_string()
    };

    let target_url = format!("http://{}:{}{}",
        service_instance.host,
        service_instance.port,
        target_path
    );

    // Get or create circuit breaker for this service
    let mut cb_map = state.circuit_breakers.lock().await;
    let circuit_breaker = cb_map.entry(service_name.to_string())
        .or_insert_with(|| {
            CircuitBreaker::new(5, std::time::Duration::from_secs(30))
        });
    
    // Clone circuit breaker to use in async block
    let cb = circuit_breaker.clone();
    drop(cb_map);

    // Convert the request body to a string/json value outside the async block
    let body_bytes = axum::body::to_bytes(req.into_body(), usize::MAX).await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let body_str = String::from_utf8_lossy(&body_bytes);
    let body_json = if !body_str.is_empty() {
        serde_json::from_str::<serde_json::Value>(&body_str)
            .unwrap_or(serde_json::Value::String(body_str.to_string()))
    } else {
        serde_json::Value::Null
    };

    // Check if method is supported
    let is_supported_method = matches!(method, axum::http::Method::GET | axum::http::Method::POST | axum::http::Method::PUT | axum::http::Method::DELETE);

    if !is_supported_method {
        return Ok(Response::builder()
            .status(axum::http::StatusCode::METHOD_NOT_ALLOWED)
            .body(axum::body::Body::empty())
            .unwrap());
    }

    // Make the request with circuit breaker protection
    let result: Result<axum::http::Response<axum::body::Body>, common::circuit_breaker::CircuitBreakerError<reqwest::Error>> = cb.call(|| async {
        let client = reqwest::Client::new();

        let response = match method {
            axum::http::Method::GET => client.get(&target_url).send().await?,
            axum::http::Method::POST => client.post(&target_url).json(&body_json).send().await?,
            axum::http::Method::PUT => client.put(&target_url).json(&body_json).send().await?,
            axum::http::Method::DELETE => client.delete(&target_url).send().await?,
            _ => unreachable!(), // We checked above
        };

        let status = response.status();
        let headers = response.headers().clone();
        let body = response.bytes().await?;

        let mut response_builder = Response::builder()
            .status(axum::http::StatusCode::from_u16(status.as_u16()).unwrap_or(axum::http::StatusCode::INTERNAL_SERVER_ERROR));

        // Add headers from the upstream service
        for (name, value) in headers.iter() {
            if let Some(header_name) = name.to_string().parse::<axum::http::HeaderName>().ok() {
                if let Ok(axum_value) = axum::http::HeaderValue::from_bytes(value.as_bytes()) {
                    response_builder = response_builder.header(header_name, axum_value);
                }
            }
        }

        Ok(response_builder
            .body(axum::body::Body::from(body))
            .unwrap())
    }).await;

    match result {
        Ok(response) => Ok(response),
        Err(CircuitBreakerError::Open) => {
            Err(StatusCode::SERVICE_UNAVAILABLE)
        }
        Err(CircuitBreakerError::Inner(_)) => {
            // Try fallback service
            let fallback_name = format!("{}-fallback", service_name);
            if let Some(fallback_instance) = state.service_registry.get_random_instance(&fallback_name).await {
                let fallback_url = format!("http://{}:{}{}", 
                    fallback_instance.host, 
                    fallback_instance.port, 
                    target_path
                );
                
                let fallback_client = reqwest::Client::new();
                let fallback_response = match method {
                    axum::http::Method::GET => fallback_client.get(&fallback_url).send().await.map_err(|_| StatusCode::BAD_GATEWAY)?,
                    axum::http::Method::POST => {
                        fallback_client.post(&fallback_url).json(&body_json).send().await
                    }.map_err(|_| StatusCode::BAD_GATEWAY)?,
                    axum::http::Method::PUT => fallback_client.put(&fallback_url).json(&body_json).send().await.map_err(|_| StatusCode::BAD_GATEWAY)?,
                    axum::http::Method::DELETE => fallback_client.delete(&fallback_url).send().await.map_err(|_| StatusCode::BAD_GATEWAY)?,
                    _ => return Err(StatusCode::METHOD_NOT_ALLOWED),
                };

                let status = fallback_response.status();
                let headers = fallback_response.headers().clone();
                let body = fallback_response.bytes().await.unwrap_or_else(|_| axum::body::Bytes::from("Fallback response unavailable"));

                let mut response_builder = Response::builder()
                    .status(axum::http::StatusCode::from_u16(status.as_u16()).unwrap_or(axum::http::StatusCode::INTERNAL_SERVER_ERROR));
                
                // Add headers from the upstream service
                for (name, value) in headers.iter() {
                    if let Some(header_name) = name.to_string().parse::<axum::http::HeaderName>().ok() {
                        if let Ok(axum_value) = axum::http::HeaderValue::from_bytes(value.as_bytes()) {
                            response_builder = response_builder.header(header_name, axum_value);
                        }
                    }
                }

                Ok(response_builder
                    .body(axum::body::Body::from(body))
                    .unwrap())
            } else {
                Err(StatusCode::BAD_GATEWAY)
            }
        }
    }
}