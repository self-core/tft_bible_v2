use mongodb::{Client, Database};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use dotenv::dotenv;

mod models;
mod handlers;
mod services;
mod config;
mod errors;
mod router;

use config::Config;

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
    log::info!("Attempting to connect to MongoDB at: {}", config.mongodb_url);
    let client = Client::with_uri_str(&config.mongodb_url).await.unwrap();
    let db = client.database(&config.database_name);

    // Test database connection
    log::info!("Testing database connection to: {}", config.database_name);
    db.run_command(mongodb::bson::doc! { "ping": 1 }).await.unwrap();
    log::info!("Successfully connected to MongoDB database: {}", config.database_name);
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
    let app = router::create_router().with_state(Arc::new(state));
    
    // Start server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port)).await.unwrap();
    println!("🚀 TFT API server running on http://0.0.0.0:{}", config.port);
    println!("📚 Health check: http://localhost:{}/api/v1/health", config.port);
    
    axum::serve(listener, app).await?;
    Ok(())
}

