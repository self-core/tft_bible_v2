use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub mongodb_url: String,
    pub database_name: String,
    pub jwt_secret: String,
    pub port: u16,
    pub cors_origin: String,
    pub redis_url: Option<String>,
    pub riot_api_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Config {
            mongodb_url: env::var("MONGODB_URL")
                .unwrap_or_else(|_| "mongodb://localhost:27017".to_string()),
            database_name: env::var("DATABASE_NAME")
                .unwrap_or_else(|_| "tft_bible".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,
            cors_origin: env::var("CORS_ORIGIN")
                .unwrap_or_else(|_| "*".to_string()),
            redis_url: env::var("REDIS_URL").ok(),
            riot_api_key: env::var("RIOT_API_KEY").ok(),
        })
    }
}