#[cfg(test)]
mod tests {
    use backend::models::{CompositionQuery, CompositionSummary};
    use backend::services::compositions::CompositionService;

    #[tokio::test]
    async fn test_get_compositions_no_filters() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(10),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 2); // We have 2 mock compositions
        assert_eq!(response.data.len(), 2);
        assert_eq!(response.page, 1);
        assert_eq!(response.per_page, 10);
    }

    #[tokio::test]
    async fn test_get_compositions_filter_by_tier() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: Some("S".to_string()), // Luchador Reroll is S tier
            category: None,
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(10),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].tier, "S");
        assert_eq!(response.data[0].name, "Luchador Reroll");
    }

    #[tokio::test]
    async fn test_get_compositions_filter_by_category() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: None,
            category: Some("Frontline".to_string()), // Bastion Bruisers is Frontline
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(10),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].category, "Frontline");
        assert_eq!(response.data[0].name, "Bastion Bruisers");
    }

    #[tokio::test]
    async fn test_get_compositions_filter_by_tags() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(10),
            offset: Some(0),
            sort_by: None,
            tags: Some("beginner".to_string()), // Bastion Bruisers has "beginner" tag
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].name, "Bastion Bruisers");
    }

    #[tokio::test]
    async fn test_get_compositions_filter_by_difficulty() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: Some(3), // Luchador Reroll has difficulty 3
            patch: None,
            limit: Some(10),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].difficulty, 3);
        assert_eq!(response.data[0].name, "Luchador Reroll");
    }

    #[tokio::test]
    async fn test_get_compositions_filter_by_patch() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: None,
            patch: Some("14.23".to_string()),
            limit: Some(10),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 2); // Both compositions are on 14.23
        assert_eq!(response.data.len(), 2);
    }

    #[tokio::test]
    async fn test_get_composition_by_id() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        // First get a composition to get its ID
        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(1),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let list_result = service.get_compositions(params).await;
        assert!(list_result.is_ok());

        let list_response = list_result.unwrap();
        assert!(!list_response.data.is_empty());

        let composition_id = list_response.data[0].id;

        // Now test get_by_id
        let result = service.get_by_id(composition_id).await;
        assert!(result.is_ok());

        let composition = result.unwrap();
        assert_eq!(composition.id, Some(composition_id));
    }

    #[tokio::test]
    async fn test_get_composition_by_id_not_found() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let fake_id = bson::oid::ObjectId::new();
        let result = service.get_by_id(fake_id).await;

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), backend::errors::ApiError::NotFound(_)));
    }

    #[tokio::test]
    async fn test_pagination() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(1), // Only 1 per page
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 2);
        assert_eq!(response.data.len(), 1); // Only 1 item per page
        assert_eq!(response.page, 1);
        assert_eq!(response.per_page, 1);
        assert_eq!(response.total_pages, 2);
    }

    #[tokio::test]
    async fn test_sorting_by_tier_and_difficulty() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(10),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let result = service.get_compositions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.data.len(), 2);

        // S tier should come before A tier
        assert_eq!(response.data[0].tier, "S");
        assert_eq!(response.data[1].tier, "A");
    }

    #[tokio::test]
    async fn test_increment_views() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        // Get a composition ID
        let params = CompositionQuery {
            set: None,
            tier: None,
            category: None,
            champion: None,
            difficulty: None,
            patch: None,
            limit: Some(1),
            offset: Some(0),
            sort_by: None,
            tags: None,
        };

        let list_result = service.get_compositions(params).await;
        assert!(list_result.is_ok());

        let list_response = list_result.unwrap();
        let composition_id = list_response.data[0].id;

        // Test increment_views (should succeed in mock mode)
        let result = service.increment_views(composition_id).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_create_composition_fails_in_mock() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = CompositionService::new(&db);

        let request = backend::models::CreateCompositionRequest {
            name: "Test".to_string(),
            description: "Test".to_string(),
            category: "Test".to_string(),
            tags: vec![],
            champions: vec![],
            augments: backend::models::CompositionAugments {
                preferred: vec![],
                acceptable: vec![],
                avoid: vec![],
            },
            positioning: None,
            gameplan: None,
            meta: backend::models::CompositionMeta {
                tier: "A".to_string(),
                difficulty: 2,
                cost: "Budget".to_string(),
                patch: "14.23".to_string(),
                playstyle: "Aggressive".to_string(),
                winrate: 0.5,
                avg_placement: 4.0,
                playrate: 0.1,
                contest_rate: 0.2,
            },
            is_public: true,
        };

        let result = service.create(request, None).await;
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), backend::errors::ApiError::Forbidden(_)));
    }
}