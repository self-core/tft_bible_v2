#[cfg(test)]
mod set_service_tests {
    use crate::services::sets::{SetService, Set};
    use mongodb::{options::ClientOptions, Client, Database};
    use serde::{Deserialize, Serialize};
    use bson::oid::ObjectId;
    use chrono::{DateTime, Utc};
    use tokio;

    async fn setup_test_db() -> Database {
        // For testing purposes, we'll use a local MongoDB instance
        // In a real scenario, you might want to use a test container
        let client_options = ClientOptions::parse("mongodb://localhost:27017")
            .await
            .expect("Failed to parse client options");
            
        let client = Client::with_options(client_options)
            .expect("Failed to create client");
            
        client.database("tft_test_db")
    }

    #[tokio::test]
    async fn test_create_and_get_set() {
        let db = setup_test_db().await;
        let service = SetService::new(&db);
        
        // Clean up any existing test data
        let collection = db.collection::<Set>("sets");
        collection.delete_many(bson::doc! {}, None).await.unwrap();
        
        // Create a test set
        let test_set = Set {
            id: None,
            name: "Test Set".to_string(),
            short_name: "TS".to_string(),
            version: "1.0.0".to_string(),
            is_active: true,
            release_date: Utc::now(),
            end_date: None,
            description: Some("Test set for validation".to_string()),
            image_url: Some("http://example.com/test_set.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        // Create the set
        let created_set = service.create_set(test_set.clone()).await.unwrap();
        
        // Verify the set was created with an ID
        assert!(created_set.id.is_some());
        assert_eq!(created_set.name, "Test Set");
        
        // Get the created set by ID
        let retrieved_set = service.get_set_by_id(&created_set.id.unwrap()).await.unwrap();
        assert!(retrieved_set.is_some());
        assert_eq!(retrieved_set.unwrap().name, "Test Set");
    }

    #[tokio::test]
    async fn test_get_active_set() {
        let db = setup_test_db().await;
        let service = SetService::new(&db);
        
        // Clean up any existing test data
        let collection = db.collection::<Set>("sets");
        collection.delete_many(bson::doc! {}, None).await.unwrap();
        
        // Create an active set
        let active_set = Set {
            id: None,
            name: "Active Set".to_string(),
            short_name: "AS".to_string(),
            version: "1.0.0".to_string(),
            is_active: true,
            release_date: Utc::now(),
            end_date: None,
            description: Some("Active test set".to_string()),
            image_url: Some("http://example.com/active_set.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        service.create_set(active_set).await.unwrap();
        
        // Create an inactive set
        let inactive_set = Set {
            id: None,
            name: "Inactive Set".to_string(),
            short_name: "IS".to_string(),
            version: "1.0.0".to_string(),
            is_active: false,
            release_date: Utc::now(),
            end_date: None,
            description: Some("Inactive test set".to_string()),
            image_url: Some("http://example.com/inactive_set.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        service.create_set(inactive_set).await.unwrap();
        
        // Get the active set
        let active_set_result = service.get_active_set().await.unwrap();
        assert!(active_set_result.is_some());
        assert_eq!(active_set_result.unwrap().name, "Active Set");
    }
}