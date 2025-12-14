use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use mongodb::{Client, Database};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use futures_util::stream::TryStreamExt;
use common::service_discovery::{ServiceInstance, ServiceHealth};

// Composition model
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Composition {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<mongodb::bson::oid::ObjectId>,
    name: String,
    description: String,
    category: String,
    tags: Vec<String>,
    champions: Vec<CompositionChampion>,
    augments: CompositionAugments,
    #[serde(rename = "positioning")]
    positioning: Option<serde_json::Value>, // Positioning map or strategy
    #[serde(rename = "gameplan")]
    gameplan: Option<String>, // Text-based strategy guide
    meta: CompositionMeta,
    matchups: Option<serde_json::Value>, // Matchup information
    votes: Votes,
    views: u32,
    favorites: u32,
    comments: Vec<Comment>,
    #[serde(rename = "isPublic")]
    is_public: bool,
    #[serde(rename = "isVerified")]
    is_verified: bool,
    #[serde(rename = "isFeatured")]
    is_featured: bool,
    #[serde(rename = "createdAt")]
    created_at: chrono::DateTime<chrono::Utc>,
    #[serde(rename = "updatedAt")]
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CompositionChampion {
    #[serde(rename = "championId")]
    champion_id: mongodb::bson::oid::ObjectId,
    #[serde(rename = "starLevel")]
    star_level: u8,
    items: Vec<mongodb::bson::oid::ObjectId>, // Item IDs
    position: Position,
    #[serde(rename = "isCore")]
    is_core: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Position {
    x: u8,
    y: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CompositionAugments {
    #[serde(rename = "preferred")]
    preferred: Vec<mongodb::bson::oid::ObjectId>, // Preferred augment IDs
    #[serde(rename = "acceptable")]
    acceptable: Vec<mongodb::bson::oid::ObjectId>, // Acceptable augment IDs
    #[serde(rename = "avoid")]
    avoid: Vec<mongodb::bson::oid::ObjectId>, // Augments to avoid
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CompositionMeta {
    tier: String, // "S", "A", "B", etc.
    difficulty: u8, // 1-5 scale
    cost: String, // "Budget", "Mid", "Late", "Flexible"
    patch: String, // e.g. "14.23"
    #[serde(rename = "playstyle")]
    playstyle: String, // "Aggressive", "Control", "Reroll", etc.
    #[serde(rename = "winrate")]
    winrate: f64,
    #[serde(rename = "avgPlacement")]
    avg_placement: f64,
    #[serde(rename = "playrate")]
    playrate: f64,
    #[serde(rename = "contestRate")]
    contest_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Votes {
    upvotes: u32,
    downvotes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Comment {
    #[serde(rename = "_id")]
    id: mongodb::bson::oid::ObjectId,
    #[serde(rename = "userId")]
    user_id: mongodb::bson::oid::ObjectId,
    content: String,
    #[serde(rename = "createdAt")]
    created_at: chrono::DateTime<chrono::Utc>,
    #[serde(rename = "updatedAt")]
    updated_at: chrono::DateTime<chrono::Utc>,
}

// Query parameters
#[derive(Debug, Deserialize)]
struct CompositionQuery {
    tier: Option<String>,
    category: Option<String>,
    tags: Option<String>, // Comma-separated
    champion: Option<String>,
    patch: Option<String>,
    difficulty: Option<u8>,
    limit: Option<u32>,
    offset: Option<u32>,
    search: Option<String>,
}

// Service state
#[derive(Clone)]
struct AppState {
    db: Database,
}

// Response models
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
    let database_name = std::env::var("DATABASE_NAME").unwrap_or_else(|_| "tft_compositions_db".to_string());

    // Connect to MongoDB
    let client = Client::with_uri_str(&database_url).await?;
    let db = client.database(&database_name);

    // Test the connection
    db.run_command(mongodb::bson::doc! {"ping": 1}, None).await?;
    println!("Connected to MongoDB: {}", database_name);

    // Create app state
    let app_state = AppState { db };

    let port: u16 = std::env::var("PORT").unwrap_or_else(|_| "8002".to_string()).parse()?;

    // Register service with discovery
    let gateway_url = std::env::var("GATEWAY_URL").unwrap_or_else(|_| "http://gateway-api:8080".to_string());
    let service_host = std::env::var("SERVICE_HOST").unwrap_or_else(|_| "composition-service".to_string());
    let service_instance = ServiceInstance {
        id: format!("composition-service-{}", port),
        name: "composition-service".to_string(),
        host: service_host,
        port,
        health: ServiceHealth::Healthy,
        metadata: std::collections::HashMap::new(),
    };

    // Register with gateway
    let client = reqwest::Client::new();
    let register_url = format!("{}/register", gateway_url);
    match client.post(&register_url).json(&service_instance).send().await {
        Ok(_) => println!("✅ Composition Service registered with gateway"),
        Err(e) => println!("⚠️  Failed to register with gateway: {}", e),
    }

    // Build our application with routes
    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/compositions", get(get_compositions).post(create_composition))
        .route("/compositions/:id", get(get_composition_by_id).put(update_composition).delete(delete_composition))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    println!("🎯 Composition Service listening on port {}", port);

    // Run our application with hyper
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_handler() -> Json<ApiResponse<String>> {
    Json(ApiResponse {
        success: true,
        data: Some("Composition Service is healthy".to_string()),
        message: Some("Service operational".to_string()),
        errors: None,
    })
}

async fn get_compositions(
    State(state): State<AppState>,
    Query(params): Query<CompositionQuery>,
) -> Result<Json<ApiResponse<Vec<Composition>>>, StatusCode> {
    let collection = state.db.collection::<Composition>("compositions");

    // Build query filter
    let mut filter = mongodb::bson::doc! {};

    if let Some(tier) = &params.tier {
        filter.insert("meta.tier", &tier);
    }

    if let Some(category) = &params.category {
        filter.insert("category", &category);
    }

    if let Some(tags) = &params.tags {
        let tag_list: Vec<String> = tags.split(',').map(|s| s.trim().to_string()).collect();
        filter.insert("tags", mongodb::bson::doc! { "$in": tag_list });
    }

    if let Some(champion) = &params.champion {
        // This would require a more complex lookup
        filter.insert("champions.champion_id", mongodb::bson::doc! { "$regex": &champion, "$options": "i" });
    }

    if let Some(patch) = &params.patch {
        filter.insert("meta.patch", &patch);
    }

    if let Some(difficulty) = params.difficulty {
        filter.insert("meta.difficulty", mongodb::bson::Bson::Int32(difficulty as i32));
    }

    if let Some(search) = &params.search {
        let or_conditions = vec![
            mongodb::bson::Bson::Document(mongodb::bson::doc! {"name": { "$regex": &search, "$options": "i" }}),
            mongodb::bson::Bson::Document(mongodb::bson::doc! {"description": { "$regex": &search, "$options": "i" }}),
            mongodb::bson::Bson::Document(mongodb::bson::doc! {"category": { "$regex": &search, "$options": "i" }}),
        ];
        filter.insert("$or", mongodb::bson::Bson::Array(or_conditions));
    }

    // Apply isPublic filter for public compositions
    filter.insert("is_public", true);

    // Set up options for pagination
    let options = mongodb::options::FindOptions::builder()
        .limit(params.limit.unwrap_or(20) as i64)
        .skip(params.offset.map(|o| o as u64))
        .build();

    let mut cursor = collection
        .find(filter, options)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut compositions = Vec::new();
    while let Some(composition) = cursor.try_next().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)? {
        compositions.push(composition);
    }

    let composition_count = compositions.len();
    Ok(Json(ApiResponse {
        success: true,
        data: Some(compositions),
        message: Some(format!("Retrieved {} compositions", composition_count)),
        errors: None,
    }))
}

async fn get_composition_by_id(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Composition>>, StatusCode> {
    let collection = state.db.collection::<Composition>("compositions");

    let object_id = mongodb::bson::oid::ObjectId::parse_str(&id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let composition = collection
        .find_one(mongodb::bson::doc! { "_id": object_id, "is_public": true }, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match composition {
        Some(composition) => {
            // Increment views
            let _ = collection.update_one(
                mongodb::bson::doc! { "_id": object_id },
                mongodb::bson::doc! { "$inc": { "views": 1_i32 } },
                None,
            ).await;
            
            Ok(Json(ApiResponse {
                success: true,
                data: Some(composition),
                message: Some("Composition retrieved successfully".to_string()),
                errors: None,
            }))
        },
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn create_composition(
    State(state): State<AppState>,
    Json(payload): Json<Composition>,
) -> Result<Json<ApiResponse<Composition>>, StatusCode> {
    let collection = state.db.collection::<Composition>("compositions");

    let new_composition = Composition {
        id: Some(mongodb::bson::oid::ObjectId::new()),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        views: 0,
        votes: Votes { upvotes: 0, downvotes: 0 },
        favorites: 0,
        comments: Vec::new(),
        ..payload
    };

    collection
        .insert_one(&new_composition, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(new_composition),
        message: Some("Composition created successfully".to_string()),
        errors: None,
    }))
}

async fn update_composition(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<Composition>,
) -> Result<Json<ApiResponse<Composition>>, StatusCode> {
    let collection = state.db.collection::<Composition>("compositions");

    let object_id = mongodb::bson::oid::ObjectId::parse_str(&id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let updated_composition = Composition {
        id: Some(object_id),
        updated_at: chrono::Utc::now(),
        ..payload
    };

    collection
        .replace_one(
            mongodb::bson::doc! { "_id": object_id },
            &updated_composition,
            None,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(updated_composition),
        message: Some("Composition updated successfully".to_string()),
        errors: None,
    }))
}

async fn delete_composition(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    let collection = state.db.collection::<Composition>("compositions");

    let object_id = mongodb::bson::oid::ObjectId::parse_str(&id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    collection
        .delete_one(mongodb::bson::doc! { "_id": object_id }, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some("Composition deleted successfully".to_string()),
        message: Some("Composition deleted successfully".to_string()),
        errors: None,
    }))
}