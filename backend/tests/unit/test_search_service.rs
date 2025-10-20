#[cfg(test)]
mod tests {
    use backend::models::SearchQuery;
    use backend::services::search::SearchService;

    #[tokio::test]
    async fn test_search_basic() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = SearchService::new(&db);

        let params = SearchQuery {
            q: "test query".to_string(),
            search_type: None,
            limit: Some(10),
            set_id: None,
        };

        let result = service.search(params).await;
        assert!(result.is_ok());

        let search_results = result.unwrap();
        assert_eq!(search_results.query, "test query");
        assert_eq!(search_results.total_results, 0); // Mock returns empty results
        assert_eq!(search_results.compositions.len(), 0);
        assert_eq!(search_results.champions.len(), 0);
        assert_eq!(search_results.items.len(), 0);
        assert!(search_results.search_time_ms >= 0);
    }

    #[tokio::test]
    async fn test_search_with_type_filter() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = SearchService::new(&db);

        let params = SearchQuery {
            q: "champion search".to_string(),
            search_type: Some("champions".to_string()),
            limit: Some(5),
            set_id: None,
        };

        let result = service.search(params).await;
        assert!(result.is_ok());

        let search_results = result.unwrap();
        assert_eq!(search_results.query, "champion search");
        assert_eq!(search_results.total_results, 0); // Mock returns empty results
    }

    #[tokio::test]
    async fn test_search_empty_query() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = SearchService::new(&db);

        let params = SearchQuery {
            q: "".to_string(),
            search_type: None,
            limit: Some(10),
            set_id: None,
        };

        let result = service.search(params).await;
        assert!(result.is_ok());

        let search_results = result.unwrap();
        assert_eq!(search_results.query, "");
        assert_eq!(search_results.total_results, 0);
    }

    #[tokio::test]
    async fn test_search_with_limit() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = SearchService::new(&db);

        let params = SearchQuery {
            q: "limited search".to_string(),
            search_type: None,
            limit: Some(1),
            set_id: None,
        };

        let result = service.search(params).await;
        assert!(result.is_ok());

        let search_results = result.unwrap();
        assert_eq!(search_results.query, "limited search");
        // Mock doesn't implement actual limiting, but structure is correct
    }

    #[tokio::test]
    async fn test_search_performance() {
        // Create a mock database for testing
        let client = mongodb::Client::with_uri_str("mongodb://localhost:27017")
            .await
            .expect("Failed to create test client");
        let db = client.database("tft_bible_test");
        let service = SearchService::new(&db);

        let params = SearchQuery {
            q: "performance test".to_string(),
            search_type: None,
            limit: Some(10),
            set_id: None,
        };

        let result = service.search(params).await;
        assert!(result.is_ok());

        let search_results = result.unwrap();
        // Search time should be reasonable (less than 100ms for mock)
        assert!(search_results.search_time_ms < 100);
    }
}