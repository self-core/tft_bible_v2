#[cfg(test)]
mod tests {
    use axum::http::StatusCode;
    use axum_test::TestServer;
    use serde_json::json;

    // Import create_router directly from the crate root
    // Since it's defined in main.rs, we need to access it differently
    // For now, we'll comment out the integration test until we resolve the import
    // use backend::create_router;
    use backend::config::Config;
    use backend::AppState;

    async fn setup_test_server() -> TestServer {
        // Create test config
        let config = Config {
            mongodb_url: "mongodb://localhost:27017".to_string(),
            database_name: "tft_bible_test".to_string(),
            port: 3001,
            redis_url: None,
            jwt_secret: "test_secret".to_string(),
            cors_origin: "*".to_string(),
            riot_api_key: Some("test_api_key".to_string()),
        };

        // Create mock database connection
        let client = mongodb::Client::with_uri_str(&config.mongodb_url)
            .await
            .expect("Failed to connect to test database");
        let db = client.database(&config.database_name);

        let start_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let state = AppState {
            db,
            config,
            start_time,
        };

        // Temporarily disabled due to import issues
        // TestServer::new(create_router().with_state(std::sync::Arc::new(state))).unwrap()
        panic!("Integration test temporarily disabled due to create_router import issues")
    }

    #[tokio::test]
    async fn test_health_check() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/health").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["status"], "healthy");
        assert!(body["version"].is_string());
        assert!(body["timestamp"].is_string());
        assert!(body["uptime"].is_number());
    }

    #[tokio::test]
    async fn test_get_compositions() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/compositions").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert!(body["data"].is_array());
        assert!(body["total"].is_number());
        assert!(body["page"].is_number());
        assert!(body["per_page"].is_number());
        assert!(body["total_pages"].is_number());

        // Should have our mock compositions
        assert_eq!(body["total"], 2);
        assert_eq!(body["data"].as_array().unwrap().len(), 2);
    }

    #[tokio::test]
    async fn test_get_compositions_with_filters() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/compositions?tier=S").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["total"], 1);
        assert_eq!(body["data"].as_array().unwrap().len(), 1);
        assert_eq!(body["data"][0]["tier"], "S");
    }

    #[tokio::test]
    async fn test_get_composition_by_id() {
        let server = setup_test_server().await;

        // First get a composition ID from the list
        let list_response = server.get("/api/v1/compositions?limit=1").await;
        let list_body: serde_json::Value = list_response.json();
        let composition_id = list_body["data"][0]["id"].as_str().unwrap();

        // Now test getting by ID
        let response = server.get(&format!("/api/v1/compositions/{}", composition_id)).await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["id"], composition_id);
        assert!(body["name"].is_string());
        assert!(body["description"].is_string());
    }

    #[tokio::test]
    async fn test_get_composition_by_invalid_id() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/compositions/invalid-id").await;

        assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_get_composition_by_nonexistent_id() {
        let server = setup_test_server().await;

        let fake_id = bson::oid::ObjectId::new().to_string();
        let response = server.get(&format!("/api/v1/compositions/{}", fake_id)).await;

        assert_eq!(response.status_code(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_get_champions() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/champions").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert!(body["data"].is_array());
        assert!(body["total"].is_number());

        // Should have our mock champions
        assert_eq!(body["total"], 2);
        assert_eq!(body["data"].as_array().unwrap().len(), 2);
    }

    #[tokio::test]
    async fn test_get_champions_with_cost_filter() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/champions?cost=1").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["total"], 1);
        assert_eq!(body["data"].as_array().unwrap().len(), 1);
        assert_eq!(body["data"][0]["cost"], 1);
    }

    #[tokio::test]
    async fn test_get_champion_by_id() {
        let server = setup_test_server().await;

        // First get a champion ID from the list
        let list_response = server.get("/api/v1/champions?limit=1").await;
        let list_body: serde_json::Value = list_response.json();
        let champion_id = list_body["data"][0]["id"].as_str().unwrap();

        // Now test getting by ID
        let response = server.get(&format!("/api/v1/champions/{}", champion_id)).await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["id"], champion_id);
        assert!(body["name"].is_string());
        assert!(body["cost"].is_number());
    }

    #[tokio::test]
    async fn test_get_champions_by_trait() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/champions/trait/Shapeshifter").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert!(body.is_array());
        assert_eq!(body.as_array().unwrap().len(), 1);
        assert!(body[0]["traits"].as_array().unwrap().contains(&json!("Shapeshifter")));
    }

    #[tokio::test]
    async fn test_get_items() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/items").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert!(body["data"].is_array());
        assert!(body["total"].is_number());

        // Should have our mock items
        assert_eq!(body["total"], 3);
        assert_eq!(body["data"].as_array().unwrap().len(), 3);
    }

    #[tokio::test]
    async fn test_get_items_with_category_filter() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/items?category=AD").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["total"], 2);
        assert_eq!(body["data"].as_array().unwrap().len(), 2);
    }

    #[tokio::test]
    async fn test_get_item_by_id() {
        let server = setup_test_server().await;

        // First get an item ID from the list
        let list_response = server.get("/api/v1/items?limit=1").await;
        let list_body: serde_json::Value = list_response.json();
        let item_id = list_body["data"][0]["id"].as_str().unwrap();

        // Now test getting by ID
        let response = server.get(&format!("/api/v1/items/{}", item_id)).await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["id"], item_id);
        assert!(body["name"].is_string());
        assert!(body["description"].is_string());
    }

    #[tokio::test]
    async fn test_get_item_recommendations() {
        let server = setup_test_server().await;

        let fake_champion_id = bson::oid::ObjectId::new().to_string();
        let response = server.get(&format!("/api/v1/items/recommendations/{}", fake_champion_id)).await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert!(body.is_array());
        // Should return all mock items as recommendations
        assert_eq!(body.as_array().unwrap().len(), 3);
    }

    #[tokio::test]
    async fn test_search() {
        let server = setup_test_server().await;

        let response = server.get("/api/v1/search?q=test").await;

        response.assert_status_ok();

        let body: serde_json::Value = response.json();
        assert_eq!(body["query"], "test");
        assert!(body["total_results"].is_number());
        assert!(body["compositions"].is_array());
        assert!(body["champions"].is_array());
        assert!(body["items"].is_array());
        assert!(body["search_time_ms"].is_number());
    }

    #[tokio::test]
    async fn test_create_composition_validation() {
        let server = setup_test_server().await;

        let invalid_request = json!({
            "name": "",
            "description": "Test",
            "category": "Test",
            "tags": [],
            "champions": [],
            "augments": {
                "preferred": [],
                "acceptable": [],
                "avoid": []
            },
            "meta": {
                "tier": "A",
                "difficulty": 2,
                "cost": "Budget",
                "patch": "14.23",
                "playstyle": "Aggressive",
                "winrate": 0.5,
                "avgPlacement": 4.0,
                "playrate": 0.1,
                "contestRate": 0.2
            },
            "is_public": true
        });

        let response = server.post("/api/v1/compositions").json(&invalid_request).await;

        assert_eq!(response.status_code(), StatusCode::OK); // Validation returns 200 with errors

        let body: serde_json::Value = response.json();
        assert_eq!(body["success"], false);
        assert!(body["errors"].is_array());
        assert!(body["errors"].as_array().unwrap().len() > 0);
    }

    #[tokio::test]
    async fn test_create_composition_mock_forbidden() {
        let server = setup_test_server().await;

        let valid_request = json!({
            "name": "Test Composition",
            "description": "A test composition",
            "category": "Test",
            "tags": ["test"],
            "champions": [{
                "championId": "507c7f79bcf86cd7994f6c0e",
                "starLevel": 1,
                "items": [],
                "position": {"x": 0, "y": 0},
                "priority": 1,
                "isCore": true,
                "alternatives": []
            }],
            "augments": {
                "preferred": [],
                "acceptable": [],
                "avoid": []
            },
            "meta": {
                "tier": "A",
                "difficulty": 2,
                "cost": "Budget",
                "patch": "14.23",
                "playstyle": "Aggressive",
                "winrate": 0.5,
                "avgPlacement": 4.0,
                "playrate": 0.1,
                "contestRate": 0.2
            },
            "is_public": true
        });

        let response = server.post("/api/v1/compositions").json(&valid_request).await;

        assert_eq!(response.status_code(), StatusCode::FORBIDDEN); // Mock mode forbids writes
    }

    #[tokio::test]
    async fn test_vote_composition() {
        let server = setup_test_server().await;

        // Get a composition ID
        let list_response = server.get("/api/v1/compositions?limit=1").await;
        let list_body: serde_json::Value = list_response.json();
        let composition_id = list_body["data"][0]["id"].as_str().unwrap();

        let vote_request = json!({
            "vote_type": "upvote"
        });

        let response = server
            .post(&format!("/api/v1/compositions/{}/vote", composition_id))
            .json(&vote_request)
            .await;

        assert_eq!(response.status_code(), StatusCode::FORBIDDEN); // Mock mode forbids voting
    }
}