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
        .route("/api/v1/compositions/{id}/export", post(handlers::compositions::export_composition))
        .route("/api/v1/compositions/import", post(handlers::compositions::import_composition))

        // Champions endpoints
        .route("/api/v1/champions", get(handlers::champions::get_champions))
        .route("/api/v1/champions/trait/{trait}", get(handlers::champions::get_champions_by_trait))

        // Traits endpoints
        .route("/api/v1/traits", get(handlers::traits::get_traits))
        .route("/api/v1/traits/{trait_name}", get(handlers::traits::get_trait_by_name))

        // Sets endpoints
        .route("/api/v1/sets", get(handlers::sets::get_sets))
        .route("/api/v1/sets/active", get(handlers::sets::get_active_set))
        .route("/api/v1/sets/{set_id}", get(handlers::sets::get_set_by_id))
        .route("/api/v1/sets/name/{set_name}", get(handlers::sets::get_set_by_name))

        // Items endpoints
        .route("/api/v1/items", get(handlers::items::get_items))
        .route("/api/v1/items/recommendations/{champion_id}", get(handlers::items::get_item_recommendations))

        // Search endpoint
        .route("/api/v1/search", get(handlers::search::search))

        // Riot TFT API endpoints (background fetch)
        .route("/api/v1/riot/queue/summoner/:identifier", post(handlers::riot_data::queue_summoner_fetch))
        .route("/api/v1/riot/queue/match-history/:puuid", post(handlers::riot_data::queue_match_history_fetch))

        // Riot TFT API endpoints (direct fetch for user requests)
        .route("/api/v1/riot/summoner/:identifier", get(handlers::riot_data::get_summoner))
        .route("/api/v1/riot/match-history/:puuid", get(handlers::riot_data::get_match_history))
        .route("/api/v1/riot/match/:match_id", get(handlers::riot_data::get_match_details))

        // CORS middleware
        .layer(tower_http::cors::CorsLayer::permissive())
}