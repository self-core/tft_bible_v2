#[cfg(test)]
mod graphql_integration_tests {
    use async_graphql::{Schema, EmptyMutation, EmptySubscription};
    use axum_test::TestServer;
    use serde_json::json;
    use backend::graphql::{resolvers::{QueryRoot, MutationRoot}, schema::{TraitTrackerInput, TraitRequirement, CurrentTraitInput}};
    use backend::router::create_router;
    use backend::config::Config;
    use backend::AppState;
    use std::sync::Arc;

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

        let champion_service = backend::services::champions::ChampionService::new(&db);
        let trait_service = backend::services::traits::TraitService::new(&db);
        let item_service = backend::services::items::ItemService::new(&db);
        let composition_service = backend::services::compositions::CompositionService::new(&db);

        let state = AppState {
            db,
            config,
            start_time,
            champion_service,
            trait_service,
            item_service,
            composition_service,
        };

        // Create GraphQL schema
        let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
            .data(Arc::new(state.clone()))
            .finish();

        // Create router with GraphQL endpoint
        let app = create_router()
            .with_state(Arc::new(state))
            .route("/graphql", axum::routing::post(backend::graphql_handler))
            .layer(axum::extract::Extension(schema));

        TestServer::new(app).unwrap()
    }

    #[tokio::test]
    async fn test_graphql_health_query() {
        let server = setup_test_server().await;

        let request_body = json!({
            "query": "{ health }"
        });

        let response = server
            .post("/graphql")
            .json(&request_body)
            .await;

        response.assert_status_ok();

        let response_json: serde_json::Value = response.json();
        
        // Check that the response has data
        assert!(response_json["data"]["health"].is_string());
        assert_eq!(response_json["data"]["health"], "OK");
    }

    #[tokio::test]
    async fn test_graphql_get_champions_query() {
        let server = setup_test_server().await;

        let request_body = json!({
            "query": "{ champions { id name cost traits } }"
        });

        let response = server
            .post("/graphql")
            .json(&request_body)
            .await;

        response.assert_status_ok();

        let response_json: serde_json::Value = response.json();
        assert!(response_json["data"]["champions"].is_array());
        
        // Verify the structure of a champion
        if let Some(champions) = response_json["data"]["champions"].as_array() {
            if !champions.is_empty() {
                let first_champion = &champions[0];
                assert!(first_champion["id"].is_string());
                assert!(first_champion["name"].is_string());
                assert!(first_champion["cost"].is_number());
                assert!(first_champion["traits"].is_array());
            }
        }
    }

    #[tokio::test]
    async fn test_graphql_get_traits_query() {
        let server = setup_test_server().await;

        let request_body = json!({
            "query": "{ traits { id name description traitType } }"
        });

        let response = server
            .post("/graphql")
            .json(&request_body)
            .await;

        response.assert_status_ok();

        let response_json: serde_json::Value = response.json();
        assert!(response_json["data"]["traits"].is_array());
        
        // Verify the structure of a trait
        if let Some(traits) = response_json["data"]["traits"].as_array() {
            if !traits.is_empty() {
                let first_trait = &traits[0];
                assert!(first_trait["id"].is_string());
                assert!(first_trait["name"].is_string());
                assert!(first_trait["description"].is_string());
                assert!(first_trait["traitType"].is_string());
            }
        }
    }

    #[tokio::test]
    async fn test_graphql_trait_tracker_mutation() {
        let server = setup_test_server().await;

        let request_body = json!({
            "query": "
                mutation GetTraitTracker($input: TraitTrackerInput!) {
                    traitTracker(input: $input) {
                        efficiency
                        path {
                            champion {
                                id
                                name
                                cost
                                traits
                            }
                            traitsGained
                            cost
                            efficiency
                        }
                    }
                }
            ",
            "variables": {
                "input": {
                    "targetTraits": [
                        {
                            "traitName": "Shapeshifter",
                            "requiredCount": 2
                        }
                    ],
                    "currentTraits": []
                }
            }
        });

        let response = server
            .post("/graphql")
            .json(&request_body)
            .await;

        response.assert_status_ok();

        let response_json: serde_json::Value = response.json();

        // The response should contain the trait tracker result
        assert!(response_json["data"]["traitTracker"]["efficiency"].is_number());
        assert!(response_json["data"]["traitTracker"]["path"].is_array());

        // If path has champions, verify their structure
        if let Some(path) = response_json["data"]["traitTracker"]["path"].as_array() {
            for path_item in path {
                assert!(path_item["champion"]["id"].is_string());
                assert!(path_item["champion"]["name"].is_string());
                assert!(path_item["champion"]["cost"].is_number());
                assert!(path_item["champion"]["traits"].is_array());
                assert!(path_item["cost"].is_number());
                assert!(path_item["efficiency"].is_number());
            }
        }
    }

    #[tokio::test]
    async fn test_graphql_trait_tracker_with_current_traits() {
        let server = setup_test_server().await;

        let request_body = json!({
            "query": "
                mutation GetTraitTracker($input: TraitTrackerInput!) {
                    traitTracker(input: $input) {
                        efficiency
                        path {
                            champion {
                                name
                                traits
                            }
                            traitsGained
                            cost
                        }
                    }
                }
            ",
            "variables": {
                "input": {
                    "targetTraits": [
                        {
                            "traitName": "Shapeshifter",
                            "requiredCount": 3
                        }
                    ],
                    "currentTraits": [
                        {
                            "name": "Shapeshifter",
                            "count": 1
                        }
                    ]
                }
            }
        });

        let response = server
            .post("/graphql")
            .json(&request_body)
            .await;

        response.assert_status_ok();

        let response_json: serde_json::Value = response.json();

        // The response should contain the trait tracker result
        assert!(response_json["data"]["traitTracker"]["efficiency"].is_number());
        assert!(response_json["data"]["traitTracker"]["path"].is_array());
    }

    #[tokio::test]
    async fn test_graphql_create_composition_mutation() {
        let server = setup_test_server().await;

        let request_body = json!({
            "query": "
                mutation CreateComposition($input: CreateCompositionInput!) {
                    createComposition(input: $input) {
                        id
                        name
                        description
                        category
                        champions {
                            champion {
                                id
                                name
                            }
                            starLevel
                            position {
                                x
                                y
                            }
                        }
                    }
                }
            ",
            "variables": {
                "input": {
                    "name": "Test Composition from GraphQL",
                    "description": "A test composition created via GraphQL",
                    "category": "Test",
                    "tags": ["test", "graphql"],
                    "champions": [],
                    "augments": [],
                    "positioning": null,
                    "gameplan": null,
                    "meta": {
                        "tier": "A",
                        "difficulty": 3,
                        "cost": "Flexible",
                        "patch": "16.0",
                        "playstyle": "Balanced",
                        "winrate": 0.55,
                        "avgPlacement": 4.0,
                        "playrate": 0.15,
                        "contestRate": 0.2
                    },
                    "matchups": null
                }
            }
        });

        let response = server
            .post("/graphql")
            .json(&request_body)
            .await;

        response.assert_status_ok();

        let response_json: serde_json::Value = response.json();
        
        // The response should contain the created composition
        assert!(response_json["data"]["createComposition"]["id"].is_string());
        assert_eq!(response_json["data"]["createComposition"]["name"], "Test Composition from GraphQL");
        assert_eq!(response_json["data"]["createComposition"]["description"], "A test composition created via GraphQL");
        assert_eq!(response_json["data"]["createComposition"]["category"], "Test");
        assert!(response_json["data"]["createComposition"]["champions"].is_array());
    }

    #[tokio::test]
    async fn test_graphql_get_compositions_query() {
        let server = setup_test_server().await;

        let request_body = json!({
            "query": "{ compositions { id name description category } }"
        });

        let response = server
            .post("/graphql")
            .json(&request_body)
            .await;

        response.assert_status_ok();

        let response_json: serde_json::Value = response.json();
        assert!(response_json["data"]["compositions"].is_array());

        // Verify the structure of a composition
        if let Some(compositions) = response_json["data"]["compositions"].as_array() {
            // Even if there are no compositions, the structure should be valid
            for composition in compositions {
                assert!(composition["id"].is_string());
                assert!(composition["name"].is_string());
                assert!(composition["description"].is_string());
                assert!(composition["category"].is_string());
            }
        }
    }

    #[tokio::test]
    async fn test_graphql_composition_lifecycle() {
        let server = setup_test_server().await;

        // First, create a composition
        let create_request_body = json!({
            "query": "
                mutation CreateComposition($input: CreateCompositionInput!) {
                    createComposition(input: $input) {
                        id
                        name
                        description
                        category
                        champions {
                            champion {
                                id
                                name
                            }
                            starLevel
                            position {
                                x
                                y
                            }
                        }
                    }
                }
            ",
            "variables": {
                "input": {
                    "name": "Test Composition Lifecycle",
                    "description": "A test composition for lifecycle testing",
                    "category": "Test Category",
                    "tags": ["test", "lifecycle"],
                    "champions": [],
                    "augments": [],
                    "positioning": null,
                    "gameplan": null,
                    "meta": {
                        "tier": "A",
                        "difficulty": 3,
                        "cost": "Flexible",
                        "patch": "16.0",
                        "playstyle": "Balanced",
                        "winrate": 0.55,
                        "avgPlacement": 4.0,
                        "playrate": 0.15,
                        "contestRate": 0.2
                    },
                    "matchups": null
                }
            }
        });

        let create_response = server
            .post("/graphql")
            .json(&create_request_body)
            .await;

        create_response.assert_status_ok();

        let create_response_json: serde_json::Value = create_response.json();
        assert!(create_response_json["data"]["createComposition"]["id"].is_string());
        let created_id = create_response_json["data"]["createComposition"]["id"].as_str().unwrap();
        assert_eq!(create_response_json["data"]["createComposition"]["name"], "Test Composition Lifecycle");

        // Then, get the specific composition
        let get_request_body = json!({
            "query": "
                query GetComposition($id: String!) {
                    composition(id: $id) {
                        id
                        name
                        description
                        category
                    }
                }
            ",
            "variables": {
                "id": created_id
            }
        });

        let get_response = server
            .post("/graphql")
            .json(&get_request_body)
            .await;

        get_response.assert_status_ok();

        let get_response_json: serde_json::Value = get_response.json();
        assert_eq!(get_response_json["data"]["composition"]["id"], created_id);
        assert_eq!(get_response_json["data"]["composition"]["name"], "Test Composition Lifecycle");
        assert_eq!(get_response_json["data"]["composition"]["description"], "A test composition for lifecycle testing");

        // Now, update the composition
        let update_request_body = json!({
            "query": "
                mutation UpdateComposition($id: String!, $input: UpdateCompositionInput!) {
                    updateComposition(id: $id, input: $input) {
                        id
                        name
                        description
                        category
                    }
                }
            ",
            "variables": {
                "id": created_id,
                "input": {
                    "name": "Updated Test Composition",
                    "description": "An updated test composition for lifecycle testing",
                    "category": "Updated Category",
                    "tags": ["test", "lifecycle", "updated"],
                    "champions": [],
                    "augments": [],
                    "positioning": null,
                    "gameplan": null,
                    "meta": {
                        "tier": "S",
                        "difficulty": 5,
                        "cost": "Flexible",
                        "patch": "16.0",
                        "playstyle": "Aggressive",
                        "winrate": 0.65,
                        "avgPlacement": 2.0,
                        "playrate": 0.25,
                        "contestRate": 0.35
                    },
                    "matchups": null
                }
            }
        });

        let update_response = server
            .post("/graphql")
            .json(&update_request_body)
            .await;

        update_response.assert_status_ok();

        let update_response_json: serde_json::Value = update_response.json();
        assert_eq!(update_response_json["data"]["updateComposition"]["id"], created_id);
        assert_eq!(update_response_json["data"]["updateComposition"]["name"], "Updated Test Composition");
        assert_eq!(update_response_json["data"]["updateComposition"]["description"], "An updated test composition for lifecycle testing");
        assert_eq!(update_response_json["data"]["updateComposition"]["category"], "Updated Category");

        // Finally, delete the composition
        let delete_request_body = json!({
            "query": "
                mutation DeleteComposition($id: String!) {
                    deleteComposition(id: $id)
                }
            ",
            "variables": {
                "id": created_id
            }
        });

        let delete_response = server
            .post("/graphql")
            .json(&delete_request_body)
            .await;

        delete_response.assert_status_ok();

        let delete_response_json: serde_json::Value = delete_response.json();
        assert_eq!(delete_response_json["data"]["deleteComposition"], true);

        // Verify that the composition no longer exists
        let verify_response = server
            .post("/graphql")
            .json(&get_request_body)
            .await;

        verify_response.assert_status_ok();

        let verify_response_json: serde_json::Value = verify_response.json();
        // The composition should not be found or return null
        assert!(verify_response_json["data"]["composition"].is_null() ||
                verify_response_json["errors"].is_array());
    }
}