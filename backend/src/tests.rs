// Integration tests for the backend
#[cfg(test)]
mod tests {
    use crate::config::Config;
    use crate::riot_api::RiotApiClient;

    #[test]
    fn test_riot_api_client_no_key() {
        // Test that the Riot API client handles missing API key gracefully
        let config = Config {
            mongodb_url: "mongodb://localhost:27017".to_string(),
            database_name: "test_db".to_string(),
            jwt_secret: "test_secret".to_string(),
            port: 8080,
            cors_origin: "*".to_string(),
            kafka_url: Some("localhost:9092".to_string()),
            riot_api_key: None, // No API key
        };

        let client = RiotApiClient::new(&config);
        assert!(client.is_none(), "Riot API client should be None when no API key is provided");
    }

    #[test]
    fn test_riot_api_client_with_key() {
        // Test that the Riot API client is created when API key is provided
        let config = Config {
            mongodb_url: "mongodb://localhost:27017".to_string(),
            database_name: "test_db".to_string(),
            jwt_secret: "test_secret".to_string(),
            port: 8080,
            cors_origin: "*".to_string(),
            kafka_url: Some("localhost:9092".to_string()),
            riot_api_key: Some("RGAPI-12345678-1234-1234-1234-123456789012".to_string()), // Example API key
        };

        let client = RiotApiClient::new(&config);
        assert!(client.is_some(), "Riot API client should be Some when API key is provided");
    }
}