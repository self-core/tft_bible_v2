// use std::sync::Arc; // Temporarily unused
use mongodb::Database;
use backend::config::Config;

/// Test utilities and helpers
pub struct TestApp {
    pub config: Config,
    pub db: Database,
}

impl TestApp {
    pub async fn new() -> Self {
        // Use in-memory database for tests or mock database
        // For now, we'll create a mock config
        let config = Config {
            mongodb_url: "mongodb://localhost:27017".to_string(),
            database_name: "tft_bible_test".to_string(),
            port: 3001,
            redis_url: None,
            jwt_secret: "test_secret".to_string(),
            cors_origin: "*".to_string(),
            riot_api_key: Some("test_api_key".to_string()),
        };

        // For now, we'll create a mock database connection
        // In a real implementation, you'd connect to a test database
        let client = mongodb::Client::with_uri_str(&config.mongodb_url)
            .await
            .expect("Failed to connect to test database");
        let db = client.database(&config.database_name);

        Self { config, db }
    }
}

/// Helper function to create test data
pub fn create_test_champion() -> backend::models::Champion {
    use bson::oid::ObjectId;
    use chrono::Utc;
    use backend::models::*;

    Champion {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        name: "Test Champion".to_string(),
        display_name: Some("Test Champion".to_string()),
        cost: 1,
        traits: vec!["TestTrait".to_string()],
        stats: ChampionStats {
            health: 500.0,
            mana: 0.0,
            starting_mana: 0.0,
            armor: 20.0,
            magic_resist: 20.0,
            attack_damage: 40.0,
            attack_speed: 0.75,
            attack_range: 1.0,
            crit_chance: 0.25,
            crit_multiplier: 1.5,
        },
        star_scaling: StarScaling {
            two_star: StarMultipliers {
                health_multiplier: 1.8,
                damage_multiplier: 1.8,
            },
            three_star: StarMultipliers {
                health_multiplier: 2.7,
                damage_multiplier: 2.7,
            },
        },
        ability: ChampionAbility {
            name: "Test Ability".to_string(),
            description: "A test ability".to_string(),
            ability_type: "Active".to_string(),
            targeting: "Enemies".to_string(),
            damage_type: "Physical".to_string(),
            scaling: vec![],
        },
        image_url: Some("https://example.com/test.png".to_string()),
        splash_url: Some("https://example.com/test-splash.png".to_string()),
        rarity: "Common".to_string(),
        release_version: Some("14.23".to_string()),
        is_enabled: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

/// Helper function to create test item
pub fn create_test_item() -> backend::models::Item {
    use bson::oid::ObjectId;
    use chrono::Utc;
    use backend::models::*;

    Item {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        name: "Test Item".to_string(),
        description: "A test item".to_string(),
        item_type: "Completed".to_string(),
        category: "AD".to_string(),
        stats: ItemStats {
            attack_damage: Some(50.0),
            ability_power: None,
            attack_speed: None,
            crit_chance: None,
            health: None,
            armor: None,
            magic_resist: None,
            mana: None,
        },
        recipe: None,
        builds_into: vec![],
        effects: vec![],
        priority: 1,
        is_unique: false,
        is_radiant: false,
        image_url: Some("https://example.com/test-item.png".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

/// Helper function to create test composition
pub fn create_test_composition() -> backend::models::Composition {
    use bson::oid::ObjectId;
    use chrono::Utc;
    use backend::models::*;

    Composition {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        author_id: None,
        name: "Test Composition".to_string(),
        description: "A test composition".to_string(),
        category: "Test".to_string(),
        tags: vec!["test".to_string()],
        champions: vec![],
        augments: CompositionAugments {
            preferred: vec![],
            acceptable: vec![],
            avoid: vec![],
        },
        positioning: None,
        gameplan: None,
        meta: CompositionMeta {
            tier: "A".to_string(),
            difficulty: 2,
            cost: "Budget".to_string(),
            patch: "14.23".to_string(),
            playstyle: "Aggressive".to_string(),
            winrate: 0.55,
            avg_placement: 3.8,
            playrate: 0.15,
            contest_rate: 0.20,
        },
        matchups: None,
        votes: Votes { upvotes: 0, downvotes: 0 },
        views: 0,
        favorites: 0,
        comments: vec![],
        is_public: true,
        is_verified: false,
        is_featured: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}