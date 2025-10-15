use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Database error: {0}")]
    DatabaseError(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("Forbidden: {0}")]
    Forbidden(String),
    
    #[error("Validation error: {0}")]
    ValidationError(String),
    
    #[error("Internal server error: {0}")]
    InternalServerError(String),
    
    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message, error_code) = match self {
            ApiError::DatabaseError(msg) => {
                eprintln!("Database error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string(), "DATABASE_ERROR")
            }
            ApiError::NotFound(msg) => {
                (StatusCode::NOT_FOUND, msg, "NOT_FOUND")
            }
            ApiError::BadRequest(msg) => {
                (StatusCode::BAD_REQUEST, msg, "BAD_REQUEST")
            }
            ApiError::Unauthorized(msg) => {
                (StatusCode::UNAUTHORIZED, msg, "UNAUTHORIZED")
            }
            ApiError::Forbidden(msg) => {
                (StatusCode::FORBIDDEN, msg, "FORBIDDEN")
            }
            ApiError::ValidationError(msg) => {
                (StatusCode::BAD_REQUEST, msg, "VALIDATION_ERROR")
            }
            ApiError::InternalServerError(msg) => {
                eprintln!("Internal server error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string(), "INTERNAL_ERROR")
            }
            ApiError::ServiceUnavailable(msg) => {
                (StatusCode::SERVICE_UNAVAILABLE, msg, "SERVICE_UNAVAILABLE")
            }
        };

        let body = Json(json!({
            "error": {
                "message": error_message,
                "code": error_code,
                "status": status.as_u16(),
                "timestamp": chrono::Utc::now()
            }
        }));

        (status, body).into_response()
    }
}

// Convert from common error types
impl From<mongodb::error::Error> for ApiError {
    fn from(err: mongodb::error::Error) -> Self {
        ApiError::DatabaseError(err.to_string())
    }
}

impl From<bson::error::Error> for ApiError {
    fn from(_err: bson::oid::Error) -> Self {
        ApiError::BadRequest("Invalid ObjectId format".to_string())
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(err: serde_json::Error) -> Self {
        ApiError::BadRequest(format!("JSON parsing error: {}", err))
    }
}