use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::AppState;
use crate::models::{Champion, Trait};
use crate::services::trait_tracker::{TraitTrackerService, TraitRequirement};

#[derive(Deserialize)]
pub struct TraitTrackerRequest {
    pub target_traits: Vec<TraitRequirement>,
    pub current_traits: Option<Vec<CurrentTrait>>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct CurrentTrait {
    pub name: String,
    pub count: u32,
}

#[derive(Serialize)]
pub struct TraitTrackerResponse {
    pub path: Vec<Champion>,
    pub efficiency: f64,
}

pub async fn get_trait_tracker(
    State(state): State<Arc<AppState>>,
    Json(request): Json<TraitTrackerRequest>,
) -> Result<Json<TraitTrackerResponse>, StatusCode> {
    // Get all champions from the database
    let champions = state.champion_service.get_champions(crate::models::ChampionQuery {
        set: None,
        cost: None,
        traits: None,
        limit: Some(100), // Reasonable limit for TFT
        search: None,
    }).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .data;

    // Get all traits from the database
    let traits = state.trait_service.get_all_traits().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Convert Vec<CurrentTrait> to HashMap<String, u32>
    let current_traits: std::collections::HashMap<String, u32> = request.current_traits
        .unwrap_or_default()
        .into_iter()
        .map(|ct| (ct.name, ct.count))
        .collect();

    // Find the optimal path using the trait tracker service
    let result = TraitTrackerService::find_optimal_trait_path(
        champions,
        request.target_traits,
        current_traits,
        traits,
    ).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(TraitTrackerResponse {
        path: result.path,
        efficiency: result.efficiency,
    }))
}

pub async fn get_trait_tracker_with_current_team(
    State(state): State<Arc<AppState>>,
    Json(request): Json<TraitTrackerRequest>,
) -> Result<Json<TraitTrackerResponse>, StatusCode> {
    // This is a more complex implementation that would take a user's current team
    // and calculate the optimal additions based on the current team's traits
    todo!("Implementation for getting trait tracker with current team")
}