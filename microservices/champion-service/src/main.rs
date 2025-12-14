use axum::{
    extract::{Path, Query, State},
    http::{StatusCode, Method},
    response::{IntoResponse, Json, Response},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use mongodb::{Client, Database};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tracing;
use futures_util::stream::TryStreamExt;
use common::service_discovery::{ServiceInstance, ServiceHealth};

// Response wrapper for API responses
#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
    errors: Option<Vec<String>>,
}

// Error handling
#[derive(thiserror::Error, Debug)]
enum ServiceError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] mongodb::error::Error),
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
    #[error("Validation error: {0}")]
    ValidationError(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Internal server error")]
    InternalServerError,
}

#[derive(Deserialize, Debug)]
struct ChampionQuery {
    cost: Option<u8>,
    #[serde(rename = "trait")]
    trait_name: Option<String>,
    search: Option<String>,
    limit: Option<u32>,
}

// Application state
#[derive(Clone)]
struct AppState {
    db: Database,
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt; // for `app.oneshot()`
    use serde_json::json;

    // Mock database for testing
    use mongodb::bson::doc;

    #[tokio::test]
    async fn test_health_endpoint() {
        // Create a minimal app for testing
        let app = Router::new()
            .route("/health", get(super::health_handler));

        // Test the /health endpoint
        let response = app
            .oneshot(
                Request::builder()
                    .method(Method::GET)
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_champion_model_serialization() {
        let champion = Champion {
            id: None,
            name: "Test Champion".to_string(),
            cost: 3,
            traits: vec!["Demacia".to_string(), "Knight".to_string()],
            image_url: Some("test_image.png".to_string()),
            splash_url: Some("test_splash.png".to_string()),
            stats: ChampionStats {
                health: 800.0,
                mana: 100.0,
                starting_mana: 50.0,
                armor: 30.0,
                magic_resist: 20.0,
                attack_damage: 60.0,
                attack_speed: 0.75,
                attack_range: 1.0,
                crit_chance: 0.25,
                crit_multiplier: 1.5,
            },
            ability: ChampionAbility {
                name: "Test Ability".to_string(),
                description: "Test ability description".to_string(),
                ability_type: "Active".to_string(),
                targeting: "Enemy".to_string(),
                damage_type: "Physical".to_string(),
            },
        };

        let serialized = serde_json::to_value(&champion).unwrap();
        assert_eq!(serialized["name"], "Test Champion");
        assert_eq!(serialized["cost"], 3);
        assert_eq!(serialized["traits"][0], "Demacia");
    }

    #[tokio::test]
    async fn test_champion_query_params() {
        let query = ChampionQuery {
            cost: Some(3),
            trait_name: Some("Demacia".to_string()),
            search: None,
            limit: Some(10),
        };

        assert_eq!(query.cost, Some(3));
        assert_eq!(query.trait_name, Some("Demacia".to_string()));
        assert_eq!(query.limit, Some(10));
    }
}

// Champion model
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Champion {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<mongodb::bson::oid::ObjectId>,
    name: String,
    cost: u8,
    traits: Vec<String>,
    #[serde(rename = "imageUrl")]
    image_url: Option<String>,
    #[serde(rename = "splashUrl")]
    splash_url: Option<String>,
    stats: ChampionStats,
    ability: ChampionAbility,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChampionStats {
    health: f64,
    mana: f64,
    #[serde(rename = "startingMana")]
    starting_mana: f64,
    armor: f64,
    #[serde(rename = "magicResist")]
    magic_resist: f64,
    #[serde(rename = "attackDamage")]
    attack_damage: f64,
    #[serde(rename = "attackSpeed")]
    attack_speed: f64,
    #[serde(rename = "attackRange")]
    attack_range: f64,
    #[serde(rename = "critChance")]
    crit_chance: f64,
    #[serde(rename = "critMultiplier")]
    crit_multiplier: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChampionAbility {
    name: String,
    description: String,
    #[serde(rename = "abilityType")]
    ability_type: String,
    targeting: String,
    #[serde(rename = "damageType")]
    damage_type: String,
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
    let database_name = std::env::var("DATABASE_NAME").unwrap_or_else(|_| "tft_champions_db".to_string());

    // Connect to MongoDB
    let client = Client::with_uri_str(&database_url).await?;
    let db = client.database(&database_name);

    // Test the connection
    db.run_command(mongodb::bson::doc! {"ping": 1}, None).await?;
    println!("Connected to MongoDB: {}", database_name);

    // Create app state
    let app_state = AppState { db };

    let port: u16 = std::env::var("PORT").unwrap_or_else(|_| "8000".to_string()).parse()?;

    // Register service with discovery
    let gateway_url = std::env::var("GATEWAY_URL").unwrap_or_else(|_| "http://gateway-api:8080".to_string());
    let service_host = std::env::var("SERVICE_HOST").unwrap_or_else(|_| "champion-service".to_string());
    let service_instance = ServiceInstance {
        id: format!("champion-service-{}", port),
        name: "champion-service".to_string(),
        host: service_host,
        port,
        health: ServiceHealth::Healthy,
        metadata: std::collections::HashMap::new(),
    };

    // Register with gateway
    let client = reqwest::Client::new();
    let register_url = format!("{}/register", gateway_url);
    match client.post(&register_url).json(&service_instance).send().await {
        Ok(_) => println!("✅ Champion Service registered with gateway"),
        Err(e) => println!("⚠️  Failed to register with gateway: {}", e),
    }

    // Build our application with a route
    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/champions", get(get_champions))
        .route("/champions/:id", get(get_champion_by_id))
        .route("/champions/by-trait/:trait_name", get(get_champions_by_trait))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    println!("🎯 Champion Service listening on port {}", port);

    // Run our application with hyper
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_handler() -> Json<ApiResponse<String>> {
    tracing::info!("Health check endpoint called");
    Json(ApiResponse {
        success: true,
        data: Some("Champion Service is healthy".to_string()),
        message: Some("Service operational".to_string()),
        errors: None,
    })
}

// Custom error response
impl IntoResponse for ServiceError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ServiceError::DatabaseError(err) => {
                tracing::error!("Database error: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error occurred".to_string())
            },
            ServiceError::SerializationError(err) => {
                tracing::error!("Serialization error: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "Serialization error occurred".to_string())
            },
            ServiceError::ValidationError(msg) => {
                tracing::warn!("Validation error: {}", msg);
                (StatusCode::BAD_REQUEST, msg)
            },
            ServiceError::NotFound(msg) => {
                tracing::warn!("Resource not found: {}", msg);
                (StatusCode::NOT_FOUND, msg)
            },
            ServiceError::InternalServerError => {
                tracing::error!("Internal server error");
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            },
        };

        let response = ApiResponse::<()> {
            success: false,
            data: None,
            message: None,
            errors: Some(vec![error_message]),
        };

        (status, Json(response)).into_response()
    }
}

async fn get_champions(
    State(state): State<AppState>,
    Query(params): Query<ChampionQuery>,
) -> Result<Json<ApiResponse<Vec<Champion>>>, ServiceError> {
    let collection = state.db.collection::<Champion>("champions");

    // Build query filter
    let mut filter = mongodb::bson::doc! {};

    if let Some(cost) = params.cost {
        filter.insert("cost", mongodb::bson::Bson::Int32(cost as i32));
    }

    if let Some(trait_name) = &params.trait_name {
        filter.insert("traits", &trait_name);
    }

    if let Some(search) = &params.search {
        let or_conditions = vec![
            mongodb::bson::Bson::Document(mongodb::bson::doc! {"name": { "$regex": search, "$options": "i" }}),
            mongodb::bson::Bson::Document(mongodb::bson::doc! {"displayName": { "$regex": search, "$options": "i" }}),
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
        .map_err(ServiceError::DatabaseError)?;

    let mut champions = Vec::new();
    while let Some(champion) = cursor.try_next().await.map_err(ServiceError::DatabaseError)? {
        champions.push(champion);
    }

    let champion_count = champions.len();
    tracing::info!("Retrieved {} champions", champion_count);

    Ok(Json(ApiResponse {
        success: true,
        data: Some(champions),
        message: Some(format!("Retrieved {} champions", champion_count)),
        errors: None,
    }))
}

async fn get_champion_by_id(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Champion>>, ServiceError> {
    let collection = state.db.collection::<Champion>("champions");

    let object_id = mongodb::bson::oid::ObjectId::parse_str(&id)
        .map_err(|_| ServiceError::ValidationError("Invalid ID format".to_string()))?;

    let champion = collection
        .find_one(mongodb::bson::doc! { "_id": object_id }, None)
        .await
        .map_err(ServiceError::DatabaseError)?;

    match champion {
        Some(champion) => {
            tracing::info!("Retrieved champion with ID: {}", id);
            Ok(Json(ApiResponse {
                success: true,
                data: Some(champion),
                message: Some("Champion retrieved successfully".to_string()),
                errors: None,
            }))
        },
        None => Err(ServiceError::NotFound(format!("Champion with ID {} not found", id))),
    }
}

async fn get_champions_by_trait(
    State(state): State<AppState>,
    Path(trait_name): Path<String>,
) -> Result<Json<ApiResponse<Vec<Champion>>>, ServiceError> {
    let collection = state.db.collection::<Champion>("champions");

    let filter = mongodb::bson::doc! {
        "traits": &trait_name
    };

    let mut cursor = collection
        .find(filter, None)
        .await
        .map_err(ServiceError::DatabaseError)?;

    let mut champions = Vec::new();
    while let Some(champion) = cursor.try_next().await.map_err(ServiceError::DatabaseError)? {
        champions.push(champion);
    }

    let champion_count = champions.len();
    tracing::info!("Retrieved {} champions with trait '{}'", champion_count, trait_name);

    Ok(Json(ApiResponse {
        success: true,
        data: Some(champions),
        message: Some(format!("Retrieved {} champions with trait '{}'", champion_count, trait_name)),
        errors: None,
    }))
}