use axum::{extract::State, response::Json};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use chrono::Utc;

use crate::{models::*, AppState};

pub async fn health_check(State(state): State<Arc<AppState>>) -> Json<HealthCheck> {
    let uptime = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        - state.start_time;

    Json(HealthCheck {
        status: "healthy".to_string(),
        timestamp: Utc::now(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: "connected".to_string(),
        uptime,
    })
}