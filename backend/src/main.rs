use async_graphql::{Schema, EmptyMutation, EmptySubscription};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse, GraphQL};
use axum::{response::Html, routing::get, Extension, Router};
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
mod riot_api; // Removed queue module temporarily
mod graphql;
#[cfg(test)]
mod tests;

use config::Config;
use crate::graphql::{resolvers::{QueryRoot, MutationRoot}, schema::TraitTrackerInput};

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub config: Config,
    pub start_time: u64,
    pub champion_service: crate::services::champions::ChampionService,
    pub trait_service: crate::services::traits::TraitService,
    pub item_service: crate::services::items::ItemService,
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

    let champion_service = crate::services::champions::ChampionService::new(&db);
    let trait_service = crate::services::traits::TraitService::new(&db);
    let item_service = crate::services::items::ItemService::new(&db);

    let state = AppState {
        db,
        config: config.clone(),
        start_time,
        champion_service,
        trait_service,
        item_service,
    };
    
    // Create the GraphQL schema
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(Arc::new(state.clone())) // Add the state as data to the schema
        .finish();

    // Create router with all routes
    let app = router::create_router()
        .with_state(Arc::new(state))
        // Add GraphQL endpoint
        .route("/graphql", get(graphql_playground).post(graphql_handler))
        .layer(Extension(schema));

    // Start server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port)).await.unwrap();
    println!("🚀 TFT API server running on http://0.0.0.0:{}", config.port);
    println!("📚 Health check: http://localhost:{}/api/v1/health", config.port);
    println!("🔍 GraphQL endpoint: http://localhost:{}/graphql", config.port);
    println!("🎮 GraphQL playground: http://localhost:{}/graphql", config.port);

    axum::serve(listener, app).await?;
    Ok(())
}

// GraphQL playground handler
async fn graphql_playground() -> Html<String> {
    Html(async_graphql::http::playground_source(
        async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
    ))
}

// GraphQL request handler
async fn graphql_handler(
    schema: Extension<Schema<QueryRoot, MutationRoot, EmptySubscription>>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

