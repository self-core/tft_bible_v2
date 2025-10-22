use mongodb::{Client, Database};
use std::env;
use dotenv::dotenv;

use tft_bible_backend::config::Config;
use tft_bible_backend::seed::DatabaseSeeder;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();

    // Initialize logging
    env_logger::init();

    // Load configuration
    let config = Config::from_env().expect("Failed to load configuration");

    println!("🔗 Connecting to MongoDB at: {}", config.mongodb_url);

    // Connect to MongoDB
    let client = Client::with_uri_str(&config.mongodb_url).await?;
    let db = client.database(&config.database_name);

    // Test database connection
    db.run_command(mongodb::bson::doc! { "ping": 1 }).await?;
    println!("✅ Connected to MongoDB database: {}", config.database_name);

    // Create seeder and run seeding
    let seeder = DatabaseSeeder::new(db);
    seeder.seed_all().await?;

    println!("🎉 Database seeding completed successfully!");
    Ok(())
}