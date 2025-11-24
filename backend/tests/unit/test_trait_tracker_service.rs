use crate::services::trait_tracker::{TraitTrackerService, TraitRequirement};
use crate::models::{Champion, ChampionStats, ChampionAbility, Trait, TraitBreakpoint, StarScaling, StarMultipliers};
use bson::oid::ObjectId;
use std::collections::HashMap;

#[tokio::test]
async fn test_trait_tracker_basic_functionality() {
    // Create mock champions
    let champion1 = Champion {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        name: "Champion1".to_string(),
        display_name: None,
        cost: 1,
        traits: vec!["TraitA".to_string()],
        stats: ChampionStats {
            health: 100.0,
            mana: 50.0,
            starting_mana: 0.0,
            armor: 20.0,
            magic_resist: 20.0,
            attack_damage: 50.0,
            attack_speed: 0.65,
            attack_range: 1.0,
            crit_chance: 0.25,
            crit_multiplier: 1.5,
        },
        star_scaling: StarScaling {
            two_star: StarMultipliers { health_multiplier: 1.8, damage_multiplier: 1.8 },
            three_star: StarMultipliers { health_multiplier: 2.7, damage_multiplier: 2.7 },
        },
        ability: ChampionAbility {
            name: "Test Ability".to_string(),
            description: "Test".to_string(),
            ability_type: "Active".to_string(),
            targeting: "Enemies".to_string(),
            damage_type: "Physical".to_string(),
            scaling: vec![],
        },
        image_url: None,
        splash_url: None,
        rarity: "Common".to_string(),
        release_version: None,
        is_enabled: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let champion2 = Champion {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        name: "Champion2".to_string(),
        display_name: None,
        cost: 2,
        traits: vec!["TraitA".to_string(), "TraitB".to_string()],
        stats: ChampionStats {
            health: 100.0,
            mana: 50.0,
            starting_mana: 0.0,
            armor: 20.0,
            magic_resist: 20.0,
            attack_damage: 50.0,
            attack_speed: 0.65,
            attack_range: 1.0,
            crit_chance: 0.25,
            crit_multiplier: 1.5,
        },
        star_scaling: StarScaling {
            two_star: StarMultipliers { health_multiplier: 1.8, damage_multiplier: 1.8 },
            three_star: StarMultipliers { health_multiplier: 2.7, damage_multiplier: 2.7 },
        },
        ability: ChampionAbility {
            name: "Test Ability".to_string(),
            description: "Test".to_string(),
            ability_type: "Active".to_string(),
            targeting: "Enemies".to_string(),
            damage_type: "Physical".to_string(),
            scaling: vec![],
        },
        image_url: None,
        splash_url: None,
        rarity: "Common".to_string(),
        release_version: None,
        is_enabled: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let champions = vec![champion1.clone(), champion2.clone()];

    // Create mock traits with breakpoints
    let trait_a = Trait {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        name: "TraitA".to_string(),
        description: "Test Trait A".to_string(),
        trait_type: "Class".to_string(),
        image_url: None,
        breakpoints: vec![
            TraitBreakpoint {
                count: 2,
                description: "2 units".to_string(),
                bonuses: Default::default(),
            },
            TraitBreakpoint {
                count: 4,
                description: "4 units".to_string(),
                bonuses: Default::default(),
            },
        ],
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let traits = vec![trait_a];

    // Set up requirements
    let requirements = vec![TraitRequirement {
        trait_name: "TraitA".to_string(),
        required_count: 3,
    }];

    // Set up current traits
    let mut current_traits = HashMap::new();
    current_traits.insert("TraitA".to_string(), 1);

    // Test the trait tracker service
    let result = TraitTrackerService::find_optimal_trait_path(
        champions,
        requirements,
        current_traits,
        traits,
    ).await;

    // Verify the result
    assert!(result.is_ok());
    let response = result.unwrap();
    
    // Should have found a path
    assert!(!response.path.is_empty());
    
    // Efficiency should be calculated
    assert!(response.efficiency >= 0.0);
}

#[tokio::test]
async fn test_trait_tracker_no_solution() {
    // Create mock champions that don't match the required trait
    let champion1 = Champion {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        name: "Champion1".to_string(),
        display_name: None,
        cost: 1,
        traits: vec!["TraitB".to_string()],
        stats: ChampionStats {
            health: 100.0,
            mana: 50.0,
            starting_mana: 0.0,
            armor: 20.0,
            magic_resist: 20.0,
            attack_damage: 50.0,
            attack_speed: 0.65,
            attack_range: 1.0,
            crit_chance: 0.25,
            crit_multiplier: 1.5,
        },
        star_scaling: StarScaling {
            two_star: StarMultipliers { health_multiplier: 1.8, damage_multiplier: 1.8 },
            three_star: StarMultipliers { health_multiplier: 2.7, damage_multiplier: 2.7 },
        },
        ability: ChampionAbility {
            name: "Test Ability".to_string(),
            description: "Test".to_string(),
            ability_type: "Active".to_string(),
            targeting: "Enemies".to_string(),
            damage_type: "Physical".to_string(),
            scaling: vec![],
        },
        image_url: None,
        splash_url: None,
        rarity: "Common".to_string(),
        release_version: None,
        is_enabled: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let champions = vec![champion1];

    // Create mock traits
    let trait_a = Trait {
        id: Some(ObjectId::new()),
        set_id: ObjectId::new(),
        name: "TraitA".to_string(),
        description: "Test Trait A".to_string(),
        trait_type: "Class".to_string(),
        image_url: None,
        breakpoints: vec![
            TraitBreakpoint {
                count: 2,
                description: "2 units".to_string(),
                bonuses: Default::default(),
            },
        ],
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let traits = vec![trait_a];

    // Set up requirements
    let requirements = vec![TraitRequirement {
        trait_name: "TraitA".to_string(),
        required_count: 2,
    }];

    // Set up current traits (none for this test)
    let current_traits = HashMap::new();

    // Test the trait tracker service - should return empty path since no solution exists
    let result = TraitTrackerService::find_optimal_trait_path(
        champions,
        requirements,
        current_traits,
        traits,
    ).await;

    // Verify the result
    assert!(result.is_ok());
    let response = result.unwrap();
    
    // Path should be empty since no champion has the required trait
    assert!(response.path.is_empty());
}