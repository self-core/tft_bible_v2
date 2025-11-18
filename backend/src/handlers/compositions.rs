use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;

use crate::{
    models::*,
    services::compositions::CompositionService,
    errors::ApiError,
};

use crate::AppState;

pub async fn get_compositions(
    State(state): State<Arc<AppState>>,
    Query(params): Query<CompositionQuery>,
) -> Result<Json<PaginatedResponse<CompositionSummary>>, ApiError> {
    let service = CompositionService::new(&state.db);
    let response = service.get_compositions(params).await?;
    Ok(Json(response))
}

pub async fn get_composition_by_id(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<Composition>, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid composition ID".to_string()))?;
    
    let service = CompositionService::new(&_state.db);
    let composition = service.get_by_id(object_id).await?;
    
    // Increment view count
    let _ = service.increment_views(object_id).await;
    
    Ok(Json(composition))
}
pub async fn create_composition(
    State(_state): State<Arc<AppState>>,
    Json(request): Json<CreateCompositionRequest>,
) -> Result<Json<ApiResponse<Composition>>, ApiError> {
    // Validate request
    if let Err(errors) = request.validate() {
        return Ok(Json(ApiResponse {
            success: false,
            data: None,
            message: Some("Validation failed".to_string()),
            errors: Some(errors),
        }));
    }

    let service = CompositionService::new(&_state.db);
    let composition = service.create(request, None).await?; // TODO: Add user_id from auth
    
    Ok(Json(ApiResponse {
        success: true,
        data: Some(composition),
        message: Some("Composition created successfully".to_string()),
        errors: None,
    }))
}

pub async fn update_composition(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(request): Json<UpdateCompositionRequest>,
) -> Result<Json<ApiResponse<Composition>>, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid composition ID".to_string()))?;

    let service = CompositionService::new(&state.db);
    let composition = service.update(object_id, request, None).await?; // TODO: Add user_id from auth
    
    Ok(Json(ApiResponse {
        success: true,
        data: Some(composition),
        message: Some("Composition updated successfully".to_string()),
        errors: None,
    }))
}

pub async fn delete_composition(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid composition ID".to_string()))?;
    
    let service = CompositionService::new(&state.db);
    service.delete(object_id, None).await?; // TODO: Add user_id from auth
    
    Ok(StatusCode::NO_CONTENT)
}

pub async fn vote_composition(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(request): Json<VoteRequest>,
) -> Result<Json<ApiResponse<Votes>>, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid composition ID".to_string()))?;

    let service = CompositionService::new(&state.db);
    let votes = service.vote(object_id, &request.vote_type, None).await?; // TODO: Add user_id from auth

    Ok(Json(ApiResponse {
        success: true,
        data: Some(votes),
        message: Some("Vote recorded successfully".to_string()),
        errors: None,
    }))
}

#[derive(Deserialize)]
pub struct ExportRequest {
    pub set_name: String,
}

pub async fn export_composition(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(request): Json<ExportRequest>,
) -> Result<Json<ApiResponse<String>>, ApiError> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| ApiError::BadRequest("Invalid composition ID".to_string()))?;

    let service = CompositionService::new(&state.db);
    let export_string = service.export_composition(object_id, &request.set_name).await?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(export_string),
        message: Some("Composition exported successfully".to_string()),
        errors: None,
    }))
}

#[derive(Deserialize)]
pub struct ImportRequest {
    pub import_string: String,
}

pub async fn import_composition(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ImportRequest>,
) -> Result<Json<ApiResponse<Composition>>, ApiError> {
    let service = CompositionService::new(&state.db);
    let composition = service.import_composition(&request.import_string).await?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(composition),
        message: Some("Composition imported successfully".to_string()),
        errors: None,
    }))
}
