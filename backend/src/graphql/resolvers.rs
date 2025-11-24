// src/graphql/resolvers.rs
use async_graphql::*;
use crate::graphql::schema::{ChampionType, TraitType, ItemType, SetType, CompositionType, TraitTrackerResponse, TraitTrackerInput};
use crate::AppState;
use std::sync::Arc;

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn health(&self) -> String {
        "OK".to_string()
    }

    async fn champions(&self, ctx: &Context<'_>, limit: Option<i32>) -> FieldResult<Vec<ChampionType>> {
        let state = ctx.data::<Arc<AppState>>().unwrap();
        let champions = state.champion_service.get_champions(crate::models::ChampionQuery {
            set: None,
            cost: None,
            traits: None,
            limit: limit.map(|l| l as i64),
            search: None,
        }).await
        .map_err(|e| {
            FieldError::new(format!("Failed to get champions: {}", e))
        })?;
        
        // Convert internal models to GraphQL types
        let mut result = Vec::new();
        for summary in champions.data {
            result.push(ChampionType {
                id: summary.id.to_hex(),
                name: summary.name,
                cost: summary.cost as i32,
                traits: summary.traits,
                stats: crate::graphql::schema::ChampionStatsType {
                    health: summary.health,
                    mana: summary.attack_damage, // placeholder, adjust as needed
                    starting_mana: summary.attack_damage, // placeholder
                    armor: summary.attack_damage, // placeholder
                    magic_resist: summary.attack_damage, // placeholder
                    attack_damage: summary.attack_damage,
                    attack_speed: summary.attack_damage, // placeholder
                    attack_range: summary.attack_damage, // placeholder
                    crit_chance: summary.attack_damage, // placeholder
                    crit_multiplier: summary.attack_damage, // placeholder
                },
                ability: crate::graphql::schema::ChampionAbilityType {
                    name: summary.ability_name,
                    description: "Placeholder description".to_string(), // Would need to fetch full champion
                    ability_type: "Active".to_string(), // Placeholder
                    targeting: "Enemies".to_string(), // Placeholder
                    damage_type: "Physical".to_string(), // Placeholder
                },
                image: summary.image_url,
            });
        }
        
        Ok(result)
    }

    async fn champion(&self, ctx: &Context<'_>, id: String) -> FieldResult<Option<ChampionType>> {
        let state = ctx.data::<Arc<AppState>>().unwrap();
        let id_obj = bson::oid::ObjectId::parse_str(&id)
            .map_err(|_| FieldError::new("Invalid ID format"))?;
        
        let champion = state.champion_service.get_by_id(id_obj).await
            .map_err(|e| FieldError::new(format!("Failed to get champion: {}", e)))?;
        
        Ok(Some(ChampionType {
            id: champion.id.unwrap_or_else(bson::oid::ObjectId::new).to_hex(),
            name: champion.name,
            cost: champion.cost as i32,
            traits: champion.traits,
            stats: crate::graphql::schema::ChampionStatsType {
                health: champion.stats.health,
                mana: champion.stats.mana,
                starting_mana: champion.stats.starting_mana,
                armor: champion.stats.armor,
                magic_resist: champion.stats.magic_resist,
                attack_damage: champion.stats.attack_damage,
                attack_speed: champion.stats.attack_speed,
                attack_range: champion.stats.attack_range,
                crit_chance: champion.stats.crit_chance,
                crit_multiplier: champion.stats.crit_multiplier,
            },
            ability: crate::graphql::schema::ChampionAbilityType {
                name: champion.ability.name,
                description: champion.ability.description,
                ability_type: champion.ability.ability_type,
                targeting: champion.ability.targeting,
                damage_type: champion.ability.damage_type,
            },
            image: champion.image_url,
        }))
    }

    async fn traits(&self, ctx: &Context<'_>) -> FieldResult<Vec<TraitType>> {
        let state = ctx.data::<Arc<AppState>>().unwrap();
        let traits = state.trait_service.get_all_traits().await
            .map_err(|e| FieldError::new(format!("Failed to get traits: {}", e)))?;
        
        let mut result = Vec::new();
        for summary in traits {
            result.push(TraitType {
                id: summary.id, // Assuming this is already a hex string
                name: summary.name,
                description: summary.description,
                trait_type: summary.trait_type,
                breakpoints: vec![], // Placeholder - need to fetch full trait data
            });
        }
        
        Ok(result)
    }

    async fn items(&self, ctx: &Context<'_>) -> FieldResult<Vec<ItemType>> {
        todo!("Implement items resolver")
    }

    async fn sets(&self, ctx: &Context<'_>) -> FieldResult<Vec<SetType>> {
        todo!("Implement sets resolver")
    }

    async fn compositions(&self, ctx: &Context<'_>) -> FieldResult<Vec<CompositionType>> {
        todo!("Implement compositions resolver")
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn trait_tracker(&self, ctx: &Context<'_>, input: TraitTrackerInput) -> FieldResult<TraitTrackerResponse> {
        let state = ctx.data::<Arc<AppState>>().unwrap();

        // Get all champions from the database
        let champions = state.champion_service.get_champions(crate::models::ChampionQuery {
            set: None,
            cost: None,
            traits: None,
            limit: Some(100), // Reasonable limit for TFT
            search: None,
        }).await
        .map_err(|e| FieldError::new(format!("Failed to get champions: {}", e)))?
        .data;

        // Get all traits from the database
        let traits = state.trait_service.get_all_traits().await
            .map_err(|e| FieldError::new(format!("Failed to get traits: {}", e)))?;

        // Convert Vec<CurrentTraitInput> to HashMap<String, u32>
        let current_traits: std::collections::HashMap<String, u32> = input.current_traits
            .unwrap_or_default()
            .into_iter()
            .map(|ct| (ct.name, ct.count as u32))
            .collect();

        // Convert TraitTrackerInput to the required format for the trait tracker service
        let target_traits: Vec<crate::services::trait_tracker::TraitRequirement> = input.target_traits
            .into_iter()
            .map(|req| crate::services::trait_tracker::TraitRequirement {
                trait_name: req.trait_name,
                required_count: req.required_count as u32,
            })
            .collect();

        // Convert internal trait format for the trait tracker service
        let internal_traits: Vec<crate::models::Trait> = traits
            .into_iter()
            .map(|trait_summary| {
                // For now, use empty breakpoints - would need to fetch full trait data
                crate::models::Trait {
                    id: Some(bson::oid::ObjectId::parse_str(&trait_summary.id).unwrap_or_else(|_| bson::oid::ObjectId::new())),
                    set_id: bson::oid::ObjectId::new(), // Placeholder
                    name: trait_summary.name,
                    description: trait_summary.description,
                    trait_type: trait_summary.trait_type,
                    image_url: None, // Placeholder
                    breakpoints: Vec::new(), // Would need to fetch full trait data
                    created_at: chrono::Utc::now(),
                    updated_at: chrono::Utc::now(),
                }
            })
            .collect();

        // Find the optimal path using the trait tracker service
        let result = crate::services::trait_tracker::TraitTrackerService::find_optimal_trait_path(
            champions.into_iter().map(|c| c.into()).collect(), // Convert summaries to full champions
            target_traits,
            current_traits,
            internal_traits,
        ).await
        .map_err(|e| FieldError::new(format!("Failed to compute trait tracker path: {}", e)))?;

        // Convert the result to GraphQL types
        let path: Vec<crate::graphql::schema::TraitPath> = result.path
            .into_iter()
            .map(|champion| crate::graphql::schema::TraitPath {
                champion: ChampionType {
                    id: champion.id.unwrap_or_else(|| bson::oid::ObjectId::new()).to_hex(),
                    name: champion.name,
                    cost: champion.cost as i32,
                    traits: champion.traits,
                    stats: crate::graphql::schema::ChampionStatsType {
                        health: champion.stats.health,
                        mana: champion.stats.mana,
                        starting_mana: champion.stats.starting_mana,
                        armor: champion.stats.armor,
                        magic_resist: champion.stats.magic_resist,
                        attack_damage: champion.stats.attack_damage,
                        attack_speed: champion.stats.attack_speed,
                        attack_range: champion.stats.attack_range,
                        crit_chance: champion.stats.crit_chance,
                        crit_multiplier: champion.stats.crit_multiplier,
                    },
                    ability: crate::graphql::schema::ChampionAbilityType {
                        name: champion.ability.name,
                        description: champion.ability.description,
                        ability_type: champion.ability.ability_type,
                        targeting: champion.ability.targeting,
                        damage_type: champion.ability.damage_type,
                    },
                    image: champion.image_url,
                },
                traits_gained: champion.traits, // Placeholder for actual traits gained
                cost: champion.cost as i32,
                efficiency: result.efficiency, // Placeholder for actual efficiency per champion
            })
            .collect();

        Ok(TraitTrackerResponse {
            path,
            efficiency: result.efficiency,
        })
    }
}