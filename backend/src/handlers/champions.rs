use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;

use crate::{
    models::*,
    services::ChampionService,
    errors::ApiError,
    AppState,
};

pub async fn get_champions(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ChampionQuery>,
) -> Result<Json<PaginatedResponse<ChampionSummary>>, ApiError> {
    let service = ChampionService::new(&state.db);
    let result = service.get_champions(params).await?;
    Ok(Json(result))
}

pub async fn get_champion_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<Champion>, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid champion ID".to_string()))?;

    let service = ChampionService::new(&state.db);
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