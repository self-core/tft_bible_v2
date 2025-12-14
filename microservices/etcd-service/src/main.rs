use axum::{
    extract::{Path, State},
    http::{Method, StatusCode},
    middleware,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use etcd_client::{Client, PutOptions, GetOptions, DeleteOptions};
use common::service_discovery::{ServiceInstance, ServiceRegistry};

// Service state
#[derive(Clone)]
struct AppState {
    etcd_client: Arc<RwLock<Option<etcd_client::Client>>>,
    service_registry: Arc<ServiceRegistry>,
}

#[derive(Deserialize, Serialize, Debug)]
struct RegisterRequest {
    service: ServiceInstance,
}

#[derive(Deserialize, Serialize, Debug)]
struct DiscoverRequest {
    service_name: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct DiscoverResponse {
    instances: Vec<ServiceInstance>,
}

// Health check for the service
async fn health_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "etcd-service",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// Register a service with etcd
async fn register_service(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = state.etcd_client.read().await.clone();
    if let Some(client) = client {
        let mut client = client.clone();
        
        // Serialize the service instance to JSON
        let service_data = serde_json::to_string(&request.service)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // Create a key for the service
        let key = format!("/services/{}/{}", request.service.name, request.service.id);
        
        // Store the service in etcd with TTL
        let options = PutOptions::new().with_lease(30); // 30 second lease
        
        let mut kv_client = client.kv_client().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        kv_client.put(key, service_data, Some(options)).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // Also register with our service registry
        state.service_registry.register_service(request.service).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        Ok(Json(serde_json::json!({
            "success": true,
            "message": "Service registered successfully"
        })))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

// Discover services by name
async fn discover_service(
    State(state): State<AppState>,
    Path(service_name): Path<String>,
) -> Result<Json<DiscoverResponse>, StatusCode> {
    let client = state.etcd_client.read().await.clone();
    if let Some(client) = client {
        // Create the prefix key for the service
        let prefix = format!("/services/{}/", service_name);
        
        let mut kv_client = client.kv_client().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let resp = kv_client.get(prefix, Some(GetOptions::new().with_prefix())).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let mut instances = Vec::new();
        for kv in resp.kvs() {
            if let Ok(service_instance) = serde_json::from_slice::<ServiceInstance>(kv.value()) {
                instances.push(service_instance);
            }
        }
        
        Ok(Json(DiscoverResponse {
            instances
        }))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

// Deregister a service
async fn deregister_service(
    State(state): State<AppState>,
    Path(service_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = state.etcd_client.read().await.clone();
    if let Some(client) = client {
        // Delete the service from etcd
        let mut kv_client = client.kv_client().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // For simplicity, we'll do a prefix delete of all services with this ID
        // In practice, we might want to be more specific
        let resp = kv_client.delete(service_id, None).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        Ok(Json(serde_json::json!({
            "success": true,
            "message": "Service deregistered",
            "deleted_count": resp.deleted_kvs()
        })))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Connect to etcd
    let endpoints = std::env::var("ETCD_ENDPOINTS").unwrap_or_else(|_| "localhost:2379".to_string());
    let client = etcd_client::Client::connect(&[endpoints.as_str()], None).await?;
    
    // Create application state
    let app_state = AppState {
        etcd_client: Arc::new(RwLock::new(Some(client))),
        service_registry: Arc::new(ServiceRegistry::new()),
    };

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/register", post(register_service))
        .route("/discover/:service_name", get(discover_service))
        .route("/deregister/:service_id", post(deregister_service));

    let port: u16 = std::env::var("PORT").unwrap_or_else(|_| "8005".to_string()).parse()?;
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    println!("🚀 Etcd Service listening on port {}", port);

    axum::serve(listener, app).await?;
    
    Ok(())
}
