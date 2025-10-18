#[cfg(test)]
mod tests {
    use crate::models::{ChampionQuery, ChampionSummary};
    use crate::services::ChampionService;

    #[tokio::test]
    async fn test_get_champions_no_filters() {
        let service = ChampionService::new(&mongodb::Database::new());

        let params = ChampionQuery {
            set: None,
            cost: None,
            traits: None,
            limit: Some(10),
            search: None,
        };

        let result = service.get_champions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 2); // We have 2 mock champions
        assert_eq!(response.data.len(), 2);
        assert_eq!(response.page, 1);
        assert_eq!(response.per_page, 10);
    }

    #[tokio::test]
    async fn test_get_champions_filter_by_cost() {
        let service = ChampionService::new(&mongodb::Database::new());

        let params = ChampionQuery {
            set: None,
            cost: Some(1), // Jinx is cost 1
            traits: None,
            limit: Some(10),
            search: None,
        };

        let result = service.get_champions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].name, "Jinx");
        assert_eq!(response.data[0].cost, 1);
    }

    #[tokio::test]
    async fn test_get_champions_filter_by_traits() {
        let service = ChampionService::new(&mongodb::Database::new());

        let params = ChampionQuery {
            set: None,
            cost: None,
            traits: Some("Shapeshifter".to_string()), // Ahri has Shapeshifter
            limit: Some(10),
            search: None,
        };

        let result = service.get_champions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].name, "Ahri");
        assert!(response.data[0].traits.contains(&"Shapeshifter".to_string()));
    }

    #[tokio::test]
    async fn test_get_champions_search_by_name() {
        let service = ChampionService::new(&mongodb::Database::new());

        let params = ChampionQuery {
            set: None,
            cost: None,
            traits: None,
            limit: Some(10),
            search: Some("Ahri".to_string()),
        };

        let result = service.get_champions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 1);
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].name, "Ahri");
    }

    #[tokio::test]
    async fn test_get_champion_by_id() {
        let service = ChampionService::new(&mongodb::Database::new());

        // First get a champion to get its ID
        let params = ChampionQuery {
            set: None,
            cost: None,
            traits: None,
            limit: Some(1),
            search: None,
        };

        let list_result = service.get_champions(params).await;
        assert!(list_result.is_ok());

        let list_response = list_result.unwrap();
        assert!(!list_response.data.is_empty());

        let champion_id = list_response.data[0].id;

        // Now test get_by_id
        let result = service.get_by_id(champion_id).await;
        assert!(result.is_ok());

        let champion = result.unwrap();
        assert_eq!(champion.id, Some(champion_id));
    }

    #[tokio::test]
    async fn test_get_champion_by_id_not_found() {
        let service = ChampionService::new(&mongodb::Database::new());

        let fake_id = bson::oid::ObjectId::new();
        let result = service.get_by_id(fake_id).await;

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), crate::errors::ApiError::NotFound(_)));
    }

    #[tokio::test]
    async fn test_get_champions_by_trait() {
        let service = ChampionService::new(&mongodb::Database::new());

        let result = service.get_by_trait("Sorcerer").await;
        assert!(result.is_ok());

        let champions = result.unwrap();
        assert_eq!(champions.len(), 1);
        assert_eq!(champions[0].name, "Ahri");
        assert!(champions[0].traits.contains(&"Sorcerer".to_string()));
    }

    #[tokio::test]
    async fn test_get_champions_by_trait_no_matches() {
        let service = ChampionService::new(&mongodb::Database::new());

        let result = service.get_by_trait("NonExistentTrait").await;
        assert!(result.is_ok());

        let champions = result.unwrap();
        assert_eq!(champions.len(), 0);
    }

    #[tokio::test]
    async fn test_pagination() {
        let service = ChampionService::new(&mongodb::Database::new());

        let params = ChampionQuery {
            set: None,
            cost: None,
            traits: None,
            limit: Some(1), // Only 1 per page
            search: None,
        };

        let result = service.get_champions(params).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.total, 2);
        assert_eq!(response.data.len(), 1); // Only 1 item per page
        assert_eq!(response.page, 1);
        assert_eq!(response.per_page, 1);
        assert_eq!(response.total_pages, 2);
    }
}