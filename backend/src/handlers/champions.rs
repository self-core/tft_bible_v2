use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;

use crate::{
    models::*,
    services::champions::ChampionService,
    errors::ApiError,
    AppState,
};

use crate::mock_data::*;

pub async fn get_champions(
    State(_state): State<Arc<AppState>>,
    Query(params): Query<ChampionQuery>,
) -> Result<Json<PaginatedResponse<ChampionSummary>>, ApiError> {
    // Return mock data for development
    let champions = MockData::get_mock_champions();

    // Apply basic filtering if needed
    let filtered_champions = if let Some(cost) = params.cost {
        champions.into_iter().filter(|c| c.cost == cost).collect()
    } else {
        champions
    };

    let response = PaginatedResponse {
        data: filtered_champions,
        total: 65, // Total champions in TFT
        page: 1,
        per_page: 20,
        total_pages: 4,
    };

    Ok(Json(response))
}

pub async fn get_champion_by_id(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<Champion>, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid champion ID".to_string()))?;

    let service = ChampionService::new(&_state.db);
    let champion = service.get_by_id(object_id).await?;

    Ok(Json(champion))
}

pub async fn get_champions_by_trait(
    State(state): State<Arc<AppState>>,
    Path(trait_name): Path<String>,
) -> Result<Json<Vec<ChampionSummary>>, ApiError> {
    let service = ChampionService::new(&state.db);
    let champions = service.get_by_trait(&trait_name).await?;

    Ok(Json(champions))
}