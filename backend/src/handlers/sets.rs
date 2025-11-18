use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use bson::oid::ObjectId;
use crate::{AppState, services::sets::SetService, models::Set};

#[derive(serde::Deserialize)]
pub struct SetQuery {
    pub active: Option<bool>,
}

pub async fn get_sets(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SetQuery>,
) -> Result<Json<Vec<crate::services::sets::SetSummary>>, crate::errors::ApiError> {
    let set_service = SetService::new(&state.db);
    
    let sets = if let Some(true) = query.active {
        // Get only active sets
        match set_service.get_active_set().await? {
            Some(active_set) => vec![crate::services::sets::SetSummary {
                id: active_set.id.unwrap_or_default(),
                name: active_set.name,
                short_name: active_set.short_name,
                version: active_set.version,
                is_active: active_set.is_active,
                release_date: active_set.release_date,
                description: active_set.description,
                image_url: active_set.image_url,
            }],
            None => vec![],
        }
    } else {
        // Get all sets
        set_service.get_all_sets().await?
    };
    
    Ok(Json(sets))
}

pub async fn get_set_by_id(
    State(state): State<Arc<AppState>>,
    Path(set_id): Path<String>,
) -> Result<Json<Set>, crate::errors::ApiError> {
    let oid = ObjectId::parse_str(&set_id)
        .map_err(|_| crate::errors::ApiError::BadRequest("Invalid set ID format".to_string()))?;
        
    let set_service = SetService::new(&state.db);
    let set_opt = set_service.get_set_by_id(&oid).await?;
    
    match set_opt {
        Some(set) => Ok(Json(set)),
        None => Err(crate::errors::ApiError::NotFound(format!("Set with ID '{}' not found", set_id))),
    }
}

pub async fn get_set_by_name(
    State(state): State<Arc<AppState>>,
    Path(set_name): Path<String>,
) -> Result<Json<Set>, crate::errors::ApiError> {
    let set_service = SetService::new(&state.db);
    let set_opt = set_service.get_set_by_name(&set_name).await?;
    
    match set_opt {
        Some(set) => Ok(Json(set)),
        None => Err(crate::errors::ApiError::NotFound(format!("Set with name '{}' not found", set_name))),
    }
}

pub async fn get_active_set(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Option<Set>>, crate::errors::ApiError> {
    let set_service = SetService::new(&state.db);
    let set = set_service.get_active_set().await?;
    Ok(Json(set))
}