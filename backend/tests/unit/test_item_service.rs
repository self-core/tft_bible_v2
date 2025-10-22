#[cfg(test)]
mod tests {
    use backend::models::ItemQuery;
    use backend::services::items::ItemService;

    #[tokio::test]
    async fn test_get_items_no_filters() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let params = ItemQuery {
            set: None,
            category: None,
            item_type: None,
            limit: Some(10),
            search: None,
        };

        let result = service.get_items(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 4); // We have 4 mock items
        assert_eq!(response.data.len(), 4);
        assert_eq!(response.page, 1);
        assert_eq!(response.per_page, 10);
    }

    #[tokio::test]
    async fn test_get_items_filter_by_category() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let params = ItemQuery {
            set: None,
            category: Some("AD".to_string()), // Bloodthirster and Rabadon's are AD/AP
            item_type: None,
            limit: Some(10),
            search: None,
        };

        let result = service.get_items(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 2); // Bloodthirster and Infinity Edge are AD category
        assert_eq!(response.data.len(), 2);

        let names: Vec<String> = response.data.iter().map(|i| i.name.clone()).collect();
        assert!(names.contains(&"Bloodthirster".to_string()));
    }

    #[tokio::test]
    async fn test_get_items_filter_by_type() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let params = ItemQuery {
            set: None,
            category: None,
            item_type: Some("Completed".to_string()),
            limit: Some(10),
            search: None,
        };

        let result = service.get_items(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 4); // All mock items are "Completed"
        assert_eq!(response.data.len(), 4);
    }

    #[tokio::test]
    async fn test_get_items_search_by_name() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let params = ItemQuery {
            set: None,
            category: None,
            item_type: None,
            limit: Some(10),
            search: Some("Bloodthirster".to_string()),
        };

        let result = service.get_items(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].name, "Bloodthirster");
    }

    #[tokio::test]
    async fn test_get_item_by_id() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        // First get an item to get its ID
        let params = ItemQuery {
            set: None,
            category: None,
            item_type: None,
            limit: Some(1),
            search: None,
        };

        let list_result = service.get_items(params).await;
        assert!(list_result.is_ok());

        let list_response = list_result.unwrap();
        assert!(!list_response.data.is_empty());

        let item_id = list_response.data[0].id;

        // Now test get_by_id
        let result = service.get_by_id(item_id).await;
        assert!(result.is_ok());

        let item = result.unwrap();
        assert_eq!(item.id, Some(item_id));
    }

    #[tokio::test]
    async fn test_get_item_by_id_not_found() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let fake_id = bson::oid::ObjectId::new();
        let result = service.get_by_id(fake_id).await;

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), backend::errors::ApiError::NotFound(_)));
    }

    #[tokio::test]
    async fn test_get_recommendations_for_champion() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let fake_champion_id = bson::oid::ObjectId::new();
        let result = service.get_recommendations_for_champion(fake_champion_id).await;

        assert!(result.is_ok());

        let recommendations = result.unwrap();
        assert_eq!(recommendations.len(), 4); // Returns all mock items for now
    }

    #[tokio::test]
    async fn test_pagination() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let params = ItemQuery {
            set: None,
            category: None,
            item_type: None,
            limit: Some(2), // Only 2 per page
            search: None,
        };

        let result = service.get_items(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 4);
        assert_eq!(response.data.len(), 2); // Only 2 items per page
        assert_eq!(response.page, 1);
        assert_eq!(response.per_page, 2);
        assert_eq!(response.total_pages, 2);
    }

    #[tokio::test]
    async fn test_sorting_by_priority() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = ItemService::new(&db);

        let params = ItemQuery {
            set: None,
            category: None,
            item_type: None,
            limit: Some(10),
            search: None,
        };

        let result = service.get_items(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.data.len(), 4);

        // Check that items are sorted by priority (Warmog's has priority 2, others have 1)
        assert_eq!(response.data[0].priority, 1);
        assert_eq!(response.data[1].priority, 1);
        assert_eq!(response.data[2].priority, 1);
        assert_eq!(response.data[3].priority, 2);
    }
}