use backend::{dragontail_seeder::DragontailSeeder, config::Config, AppState};
use mongodb::Client;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv::dotenv().ok();
    
    // Load configuration
    let config = Config::from_env()?;
    
    // Connect to MongoDB
    let client = Client::with_uri_str(&config.database_url).await?;
    let db = client.database(&config.database_name);
    
    // Create AppState to hold the database connection
    let app_state = AppState {
        db: db.clone(),
        config: config.clone(),
        start_time: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs(),
    };
    
    // Get the dragontail path from environment variable or use a default
    let dragontail_path = env::var("DRAGONTAIL_PATH")
        .unwrap_or_else(|_| "C:\\Users\\puppets\\Documents\\League of Legends\\dragontail-15.23.1".to_string());
    
    println!("Using dragontail path: {}", dragontail_path);
    
    // Create dragontail seeder and run seeding
    let seeder = DragontailSeeder::new(db, dragontail_path);
    seeder.seed_all().await?;
    
    println!("🎉 Dragontail seeding test completed successfully!");
    Ok(())
}