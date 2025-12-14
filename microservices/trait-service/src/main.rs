use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use mongodb::{Client, Database};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use futures_util::stream::TryStreamExt;
use common::service_discovery::{ServiceInstance, ServiceHealth};

// Trait model
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Trait {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<mongodb::bson::oid::ObjectId>,
    name: String,
    #[serde(rename = "traitType")]
    trait_type: String, // "Origin", "Class", "Unique"
    description: String,
    #[serde(rename = "imageUrl")]
    image_url: Option<String>,
    breakpoints: Vec<TraitBreakpoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TraitBreakpoint {
    units: u32,
    #[serde(rename = "style")]
    style: u8, // 0=gray, 1=green, 2=blue, 3=purple
    description: String,
    #[serde(rename = "bonuses")]
    bonuses: serde_json::Value, // Dynamic bonus structure
}

// Query parameters for trait search
#[derive(Debug, Deserialize)]
struct TraitQuery {
    #[serde(rename = "type")]
    trait_type: Option<String>,
    search: Option<String>,
    limit: Option<u32>,
}

// Service state
#[derive(Clone)]
struct AppState {
    db: Database,
}

// Request/Response models
#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
    errors: Option<Vec<String>>,
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

    // Get database connection details from environment
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = std::env::var("DATABASE_NAME").unwrap_or_else(|_| "tft_traits_db".to_string());

    // Connect to MongoDB
    let client = Client::with_uri_str(&database_url).await?;
    let db = client.database(&database_name);

    // Test the connection
    db.run_command(mongodb::bson::doc! {"ping": 1}, None).await?;
    println!("Connected to MongoDB: {}", database_name);

    // Create app state
    let app_state = AppState { db };

    let port: u16 = std::env::var("PORT").unwrap_or_else(|_| "8001".to_string()).parse()?;

    // Register service with discovery
    let gateway_url = std::env::var("GATEWAY_URL").unwrap_or_else(|_| "http://gateway-api:8080".to_string());
    let service_host = std::env::var("SERVICE_HOST").unwrap_or_else(|_| "trait-service".to_string());
    let service_instance = ServiceInstance {
        id: format!("trait-service-{}", port),
        name: "trait-service".to_string(),
        host: service_host,
        port,
        health: ServiceHealth::Healthy,
        metadata: std::collections::HashMap::new(),
    };

    // Register with gateway
    let client = reqwest::Client::new();
    let register_url = format!("{}/register", gateway_url);
    match client.post(&register_url).json(&service_instance).send().await {
        Ok(_) => println!("✅ Trait Service registered with gateway"),
        Err(e) => println!("⚠️  Failed to register with gateway: {}", e),
    }

    // Build our application with routes
    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/traits", get(get_traits))
        .route("/traits/:name", get(get_trait_by_name))
        .route("/traits/type/:type", get(get_traits_by_type))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    println!("🎯 Trait Service listening on port {}", port);

    // Run our application with hyper
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_handler() -> Json<ApiResponse<String>> {
    Json(ApiResponse {
        success: true,
        data: Some("Trait Service is healthy".to_string()),
        message: Some("Service operational".to_string()),
        errors: None,
    })
}

async fn get_traits(
    State(state): State<AppState>,
    Query(params): Query<TraitQuery>,
) -> Result<Json<ApiResponse<Vec<Trait>>>, StatusCode> {
    let collection = state.db.collection::<Trait>("traits");

    // Build query filter
    let mut filter = mongodb::bson::doc! {};

    if let Some(trait_type) = params.trait_type {
        filter.insert("trait_type", &trait_type);
    }

    if let Some(search) = params.search {
        let or_conditions = vec![
            mongodb::bson::Bson::Document(mongodb::bson::doc! {"name": { "$regex": &search, "$options": "i" }}),
            mongodb::bson::Bson::Document(mongodb::bson::doc! {"description": { "$regex": &search, "$options": "i" }}),
        ];
        filter.insert("$or", mongodb::bson::Bson::Array(or_conditions));
    }

    // Set up options for pagination
    let options = mongodb::options::FindOptions::builder()
        .limit(params.limit.unwrap_or(50) as i64)
        .build();

    let mut cursor = collection
        .find(filter, options)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut traits = Vec::new();
    while let Some(trait_item) = cursor.try_next().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)? {
        traits.push(trait_item);
    }

    let trait_count = traits.len();
    Ok(Json(ApiResponse {
        success: true,
        data: Some(traits),
        message: Some(format!("Retrieved {} traits", trait_count)),
        errors: None,
    }))
}

async fn get_trait_by_name(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Json<ApiResponse<Trait>>, StatusCode> {
    let collection = state.db.collection::<Trait>("traits");

    let trait_item = collection
        .find_one(mongodb::bson::doc! { "name": &name }, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match trait_item {
        Some(trait_item) => Ok(Json(ApiResponse {
            success: true,
            data: Some(trait_item),
            message: Some(format!("Trait '{}' found", name)),
            errors: None,
        })),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn get_traits_by_type(
    State(state): State<AppState>,
    Path(trait_type): Path<String>,
) -> Result<Json<ApiResponse<Vec<Trait>>>, StatusCode> {
    let collection = state.db.collection::<Trait>("traits");

    let mut cursor = collection
        .find(mongodb::bson::doc! { "trait_type": &trait_type }, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut traits = Vec::new();
    while let Some(trait_item) = cursor.try_next().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)? {
        traits.push(trait_item);
    }

    let trait_count = traits.len();
    Ok(Json(ApiResponse {
        success: true,
        data: Some(traits),
        message: Some(format!("Retrieved {} traits of type '{}'", trait_count, trait_type)),
        errors: None,
    }))
}