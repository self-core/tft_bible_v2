use axum::{extract::{Path, State}, Json};
use std::sync::Arc;
use crate::{AppState, services::traits::TraitService, errors::ApiError};

pub async fn get_traits(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<crate::services::traits::TraitSummary>>, ApiError> {
    let trait_service = TraitService::new(&state.db);
    let traits = trait_service.get_all_traits().await?;
    Ok(Json(traits))
}

pub async fn get_trait_by_name(
    State(state): State<Arc<AppState>>,
    Path(trait_name): Path<String>,
) -> Result<Json<crate::services::traits::Trait>, ApiError> {
    let trait_service = TraitService::new(&state.db);
    let trait_opt = trait_service.get_trait_by_name(&trait_name).await?;
    
    match trait_opt {
        Some(trait_item) => Ok(Json(trait_item)),
        None => Err(ApiError::NotFound(format!("Trait with name '{}' not found", trait_name))),
    }
}