use axum::{
    extract::{Path, Query, State},
    Json,
    http::StatusCode,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::{
    AppState,
    services::tft_data_service::TftDataService,
};

#[derive(Deserialize)]
pub struct MatchHistoryQuery {
    start: Option<i32>,
    count: Option<i32>,
}

#[derive(Deserialize)]
pub struct SummonerSearchQuery {
    #[serde(rename = "type")]
    search_type: Option<String>, // puuid, summoner_id, or name
}

pub async fn get_summoner(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
    Query(query): Query<SummonerSearchQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let service = TftDataService::new(&state);
    
    // Determine search type and fetch accordingly
    let result = match query.search_type.as_deref().unwrap_or("name") {
        "puuid" => service.get_summoner_by_puuid(&identifier).await,
        // For other types, we would need different service methods
        _ => service.get_summoner_by_puuid(&identifier).await, // Default behavior
    };

    match result {
        Some(summoner) => {
            Ok(Json(serde_json::json!({
                "success": true,
                "data": summoner
            })))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn get_match_history(
    State(state): State<Arc<AppState>>,
    Path(puuid): Path<String>,
    Query(query): Query<MatchHistoryQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let service = TftDataService::new(&state);
    
    let result = service.get_match_ids_by_puuid(&puuid, query.start, query.count).await;

    match result {
        Some(matches) => {
            Ok(Json(serde_json::json!({
                "success": true,
                "data": matches
            })))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn get_match_details(
    State(state): State<Arc<AppState>>,
    Path(match_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let service = TftDataService::new(&state);
    
    let result = service.get_match_by_id(&match_id).await;

    match result {
        Some(match_data) => {
            Ok(Json(serde_json::json!({
                "success": true,
                "data": match_data
            })))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn queue_summoner_fetch(
    State(state): State<Arc<AppState>>,
    Path(identifier): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let service = TftDataService::new(&state);
    
    // This queues the fetch operation instead of performing it immediately
    service.queue_summoner_fetch(
        identifier,
        crate::queue::types::SummonerSearchType::Puuid
    ).await;
    
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Summoner fetch queued successfully"
    })))
}

pub async fn queue_match_history_fetch(
    State(state): State<Arc<AppState>>,
    Path(puuid): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let service = TftDataService::new(&state);
    
    // This queues the fetch operation instead of performing it immediately
    service.queue_match_history_fetch(puuid, None, Some(20)).await;
    
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Match history fetch queued successfully"
    })))
}