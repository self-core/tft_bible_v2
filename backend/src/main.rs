use axum::{
    routing::{get, post, put, delete},
    Router,
};
use mongodb::{Client, Database};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tower_http::cors::CorsLayer;
use dotenv::dotenv;

mod models;
mod handlers;
mod services;
mod config;
mod errors;

use config::Config;
use handlers::*;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub config: Config,
    pub start_time: u64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logging
    env_logger::init();
    
    // Load configuration
    let config = Config::from_env().expect("Failed to load configuration");
    
    // Connect to MongoDB
    let client = Client::with_uri_str(&config.mongodb_url).await.unwrap();
    let db = client.database(&config.database_name);
    
    // Test database connection
    db.run_command(mongodb::bson::doc! { "ping": 1 }, None).await.unwrap();
    println!("✅ Connected to MongoDB: {}", config.database_name);
    
    // Create app state
    let start_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let state = AppState {
        db,
        config: config.clone(),
        start_time,
    };
    
    // Create router with all routes
    let app = create_router().with_state(Arc::new(state));
    
    // Start server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port)).await.unwrap();
    println!("🚀 TFT API server running on http://0.0.0.0:{}", config.port);
    println!("📚 Health check: http://localhost:{}/api/v1/health", config.port);
    
    axum::serve(listener, app).await?;
    Ok(())
}

fn create_router() -> Router<Arc<AppState>> {
    Router::new()
        // Health check
        .route("/api/v1/health", get(health_check))
        
        // Compositions endpoints
        .route("/api/v1/compositions", get(get_compositions).post(create_composition))
        .route("/api/v1/compositions/:id", get(get_composition_by_id).put(update_composition).delete(delete_composition))
        .route("/api/v1/compositions/:id/vote", post(vote_composition))
        
        // Champions endpoints
        .route("/api/v1/champions", get(get_champions))
        .route("/api/v1/champions/:id", get(get_champion_by_id))
        .route("/api/v1/champions/trait/:trait", get(get_champions_by_trait))
        
        // Items endpoints
        .route("/api/v1/items", get(get_items))
        .route("/api/v1/items/:id", get(get_item_by_id))
        .route("/api/v1/items/recommendations/:champion_id", get(get_item_recommendations))
        
        // Search endpoint
        .route("/api/v1/search", get(search))
        
        // CORS middleware
        .layer(CorsLayer::permissive())
}
