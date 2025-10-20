use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::handlers;
use crate::AppState;

pub fn create_router() -> Router<Arc<AppState>> {
    Router::new()
        // Health check
        .route("/api/v1/health", get(handlers::health::health_check))

        // Compositions endpoints
        .route("/api/v1/compositions", get(handlers::compositions::get_compositions))
        .route("/api/v1/compositions/{id}/vote", post(handlers::compositions::vote_composition))

        // Champions endpoints
        .route("/api/v1/champions", get(handlers::champions::get_champions))
        .route("/api/v1/champions/trait/{trait}", get(handlers::champions::get_champions_by_trait))

        // Items endpoints
        .route("/api/v1/items", get(handlers::items::get_items))
        .route("/api/v1/items/recommendations/{champion_id}", get(handlers::items::get_item_recommendations))

        // Search endpoint
        .route("/api/v1/search", get(handlers::search::search))

        // CORS middleware
        .layer(tower_http::cors::CorsLayer::permissive())
}