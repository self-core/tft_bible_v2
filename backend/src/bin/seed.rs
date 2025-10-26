use bson::doc;
use mongodb::Client;
use std::env;
use backend::services::compositions::CompositionService;
use backend::services::champions::ChampionService;
use backend::services::items::ItemService;
use backend::services::traits::TraitService;
use backend::services::augments::AugmentService;

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
    let champion_service = ChampionService::new(&database);
    let item_service = ItemService::new(&database);
    let trait_service = TraitService::new(&database);
    let augment_service = AugmentService::new(&database);

    // Check if data already exists
    let existing_compositions = composition_service.collection.count_documents(doc! {}).await?;
    let existing_champions = champion_service.collection.count_documents(doc! {}).await?;
    let existing_items = item_service.collection.count_documents(doc! {}).await?;
    let existing_traits = trait_service.collection.count_documents(doc! {}).await?;
    let existing_augments = augment_service.collection.count_documents(doc! {}).await?;

    if existing_compositions > 0 || existing_champions > 0 || existing_items > 0 || existing_traits > 0 || existing_augments > 0 {
        println!("⚠️  Database already contains data:");
        println!("   - {} compositions", existing_compositions);
        println!("   - {} champions", existing_champions);
        println!("   - {} items", existing_items);
        println!("   - {} traits", existing_traits);
        println!("   - {} augments", existing_augments);
        println!("💡 If you want to reseed, drop the collections first.");
        return Ok(());
    }

    // Populate RIOT asset data first
    println!("📝 Populating RIOT asset data...");

    // Seed sets first (required for foreign keys)
    println!("🌍 Creating TFT Set 15...");
    trait_service.create_set().await?;
    println!("✅ Set created");

    // Seed champions
    println!("👥 Populating champions from RIOT data...");
    champion_service.populate_from_riot_data().await?;
    println!("✅ Champions populated");

    // Seed traits
    println!("🏷️  Populating traits from RIOT data...");
    trait_service.populate_from_riot_data().await?;
    println!("✅ Traits populated");

    // Seed items
    println!("⚔️  Populating items from RIOT data...");
    item_service.populate_from_riot_data().await?;
    println!("✅ Items populated");

    // Seed augments
    println!("🔮 Populating augments from RIOT data...");
    augment_service.populate_from_riot_data().await?;
    println!("✅ Augments populated");

    // Populate compositions from scraped data
    println!("📝 Populating compositions from scraped data...");
    composition_service.populate_from_scraped_data().await?;
    println!("✅ Compositions populated");

    // Verify the data
    let final_compositions = composition_service.collection.count_documents(doc! {}).await?;
    let final_champions = champion_service.collection.count_documents(doc! {}).await?;
    let final_items = item_service.collection.count_documents(doc! {}).await?;
    let final_traits = trait_service.collection.count_documents(doc! {}).await?;
    let final_augments = augment_service.collection.count_documents(doc! {}).await?;

    println!("📊 Final database counts:");
    println!("   - {} compositions", final_compositions);
    println!("   - {} champions", final_champions);
    println!("   - {} items", final_items);
    println!("   - {} traits", final_traits);
    println!("   - {} augments", final_augments);

    println!("🎉 Database seeding completed successfully!");
    Ok(())
}