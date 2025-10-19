use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;

use crate::{
    models::*,
    services::items::ItemService,
    errors::ApiError,
    AppState,
};

pub async fn get_items(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ItemQuery>,
) -> Result<Json<PaginatedResponse<ItemSummary>>, ApiError> {
    let service = ItemService::new(&state.db);
    let result = service.get_items(params).await?;
    Ok(Json(result))
}

pub async fn get_item_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<Item>, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid item ID".to_string()));
    
    let service = ItemService::new(&state.db);
    let item = service.get_by_id(object_id).await?;
    
    Ok(Json(item))
}

pub async fn get_item_recommendations(
    State(state): State<Arc<AppState>>,
    Path(champion_id): Path<String>,
) -> Result<Json<Vec<ItemSummary>>, ApiError> {
    let object_id = ObjectId::parse_str(&champion_id)
        .map_err(|_| ApiError::BadRequest("Invalid champion ID".to_string()))?;

    let service = ItemService::new(&state.db);
    let recommendations = service.get_recommendations_for_champion(object_id).await?;

    Ok(Json(recommendations))
}