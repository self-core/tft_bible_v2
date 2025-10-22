pub mod models;
pub mod handlers;
pub mod services;
pub mod config;
pub mod errors;
pub mod router;
pub mod mock_data;
pub mod seed;

// Define AppState here for testing
use mongodb::Database;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub config: config::Config,
    pub start_time: u64,
}