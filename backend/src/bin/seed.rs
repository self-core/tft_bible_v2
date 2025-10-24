use bson::doc;
use mongodb::Client;
use std::env;
use backend::services::compositions::CompositionService;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🌱 Starting database seeding...");

    // Load environment variables
    dotenv::dotenv().ok();

    let mongodb_url = env::var("MONGODB_URL")
        .unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME")
        .unwrap_or_else(|_| "tft_bible_dev".to_string());

    // Connect to MongoDB
    let client = Client::with_uri_str(&mongodb_url).await?;
    let database = client.database(&database_name);

    println!("✅ Connected to MongoDB: {}", database_name);

    // Initialize services
    let composition_service = CompositionService::new(&database);

    // Check if data already exists
    let existing_count = composition_service.collection.count_documents(doc! {}).await?;
    if existing_count > 0 {
        println!("⚠️  Database already contains {} compositions. Skipping seeding.", existing_count);
        println!("💡 If you want to reseed, drop the compositions collection first.");
        return Ok(());
    }

    // Populate compositions from scraped data
    println!("📝 Populating compositions from scraped data...");
    composition_service.populate_from_scraped_data().await?;
    println!("✅ Successfully populated compositions!");

    // Verify the data
    let final_count = composition_service.collection.count_documents(doc! {}).await?;
    println!("📊 Total compositions in database: {}", final_count);

    println!("🎉 Database seeding completed successfully!");
    Ok(())
}