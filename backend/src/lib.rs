pub mod models;
pub mod handlers;
pub mod services;
pub mod config;
pub mod errors;

// Re-export AppState from main.rs for testing
pub use crate::main::AppState;