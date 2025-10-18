use axum::{
    extract::{Query, State},
    response::Json,
};
use serde_json::{json, Value};
use std::sync::Arc;

use crate::{
    models::*,
    services::SearchService,
    errors::ApiError,
    AppState,
};

pub async fn search(
    State(state): State<Arc<AppState>>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<Value>, ApiError> {
    let service = SearchService::new(&state.db);
    let results = service.search(params).await?;

    Ok(Json(json!({
        "query": results.query,
        "total_results": results.total_results,
        "compositions": results.compositions,
        "champions": results.champions,
        "items": results.items,
        "search_time_ms": results.search_time_ms
    })))
}