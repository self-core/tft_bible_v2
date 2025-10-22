use bson::{oid::ObjectId, DateTime};
use once_cell::sync::Lazy;
use std::sync::RwLock;

use crate::models::*;
use crate::errors::ApiError;

// Simple in-memory mock storage guarded by RwLock
static CHAMPIONS: Lazy<RwLock<Vec<Champion>>> = Lazy::new(|| {
    let now = DateTime::now();
    let set_id = ObjectId::new();

    let sample = vec![
        Champion {
            id: Some(ObjectId::new()),
            set_id,
            name: "Ahri".to_string(),
            display_name: Some("Ahri".to_string()),
            cost: 2,
            traits: vec!["Shapeshifter".to_string(), "Sorcerer".to_string()],
            stats: ChampionStats {
                health: 650.0,
                mana: 0.0,
                starting_mana: 0.0,
                armor: 20.0,
                magic_resist: 20.0,
                attack_damage: 40.0,
                attack_speed: 0.75,
                attack_range: 3.0,
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
                name: "Orb of Deception".to_string(),
                description: "Ahri sends out and pulls back her orb, dealing magic damage on the way out and true damage on the way back.".to_string(),
                ability_type: "Active".to_string(),
                targeting: "Enemies".to_string(),
                damage_type: "Magic".to_string(),
                scaling: vec![
                    AbilityScaling {
                        star_level: 1,
                        damage: 200.0,
                        additional_effects: std::collections::HashMap::new(),
                    },
                    AbilityScaling {
                        star_level: 2,
                        damage: 300.0,
                        additional_effects: std::collections::HashMap::new(),
                    },
                    AbilityScaling {
                        star_level: 3,
                        damage: 450.0,
                        additional_effects: std::collections::HashMap::new(),
                    },
                ],
            },
            image_url: Some("https://example.com/ahri.png".to_string()),
            splash_url: Some("https://example.com/ahri-splash.png".to_string()),
            rarity: "Epic".to_string(),
            release_version: Some("14.23".to_string()),
            is_enabled: true,
            created_at: now,
            updated_at: now,
        },
        Champion {
            id: Some(ObjectId::new()),
            set_id,
            name: "Jinx".to_string(),
            display_name: Some("Jinx".to_string()),
            cost: 1,
            traits: vec!["Scrap".to_string(), "Sniper".to_string()],
            stats: ChampionStats {
                health: 550.0,
                mana: 0.0,
                starting_mana: 0.0,
                armor: 15.0,
                magic_resist: 15.0,
                attack_damage: 55.0,
                attack_speed: 0.8,
                attack_range: 4.0,
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
                name: "Super Mega Death Rocket!".to_string(),
                description: "Jinx fires a rocket that explodes on the first enemy hit, dealing physical damage to nearby enemies.".to_string(),
                ability_type: "Active".to_string(),
                targeting: "Enemies".to_string(),
                damage_type: "Physical".to_string(),
                scaling: vec![
                    AbilityScaling {
                        star_level: 1,
                        damage: 300.0,
                        additional_effects: std::collections::HashMap::new(),
                    },
                    AbilityScaling {
                        star_level: 2,
                        damage: 450.0,
                        additional_effects: std::collections::HashMap::new(),
                    },
                    AbilityScaling {
                        star_level: 3,
                        damage: 675.0,
                        additional_effects: std::collections::HashMap::new(),
                    },
                ],
            },
            image_url: Some("https://example.com/jinx.png".to_string()),
            splash_url: Some("https://example.com/jinx-splash.png".to_string()),
            rarity: "Common".to_string(),
            release_version: Some("14.23".to_string()),
            is_enabled: true,
            created_at: now,
            updated_at: now,
        },
    ];
    RwLock::new(sample)
});

pub struct ChampionService;

impl ChampionService {
    pub fn new(_db: &mongodb::Database) -> Self {
        Self
    }

    pub async fn get_champions(
        &self,
        params: ChampionQuery,
    ) -> Result<PaginatedResponse<ChampionSummary>, ApiError> {
        let data = CHAMPIONS.read().unwrap().clone();

        // Filtering
        let mut filtered: Vec<Champion> = data.into_iter().collect();

        // cost
        if let Some(cost) = params.cost {
            filtered = filtered.into_iter().filter(|c| c.cost == cost).collect();
        }

        // traits (comma-separated)
        if let Some(ref traits) = params.traits {
            let wanted: Vec<String> = traits.split(',').map(|s| s.trim().to_lowercase()).collect();
            filtered = filtered.into_iter().filter(|c| {
                let set: std::collections::HashSet<String> = c.traits.iter().map(|t| t.to_lowercase()).collect();
                wanted.iter().all(|t| set.contains(t))
            }).collect();
        }

        // search (name)
        if let Some(ref search) = params.search {
            let sl = search.to_lowercase();
            filtered = filtered.into_iter().filter(|c| {
                c.name.to_lowercase().contains(&sl) ||
                c.display_name.as_ref().unwrap_or(&c.name).to_lowercase().contains(&sl)
            }).collect();
        }

        let mut items: Vec<Champion> = filtered.into_iter().collect();

        // Sorting: by cost then name
        items.sort_by(|a, b| {
            a.cost.cmp(&b.cost).then(a.name.cmp(&b.name))
        });

        // Pagination
        let per_page = params.limit.unwrap_or(20).clamp(1, 100) as usize;
        let page = 1;
        let total = items.len() as u32;
        let total_pages = ((total as usize + per_page - 1) / per_page) as u32;
        let start = 0;
        let end = (per_page).min(items.len());
        let page_items = &items[start..end];

        let summaries = page_items
            .iter()
            .map(|c| ChampionSummary {
                id: c.id.unwrap_or_else(ObjectId::new),
                name: c.name.clone(),
                cost: c.cost,
                traits: c.traits.clone(),
                health: c.stats.health,
                attack_damage: c.stats.attack_damage,
                ability_name: c.ability.name.clone(),
                image_url: c.image_url.clone(),
            })
            .collect();

        Ok(PaginatedResponse {
            data: summaries,
            total,
            page: page as u32,
            per_page: per_page as u32,
            total_pages,
        })
    }

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Champion, ApiError> {
        let data = CHAMPIONS.read().unwrap();
        let champion = data.iter().find(|c| c.id == Some(id)).cloned();
        champion.ok_or_else(|| ApiError::NotFound("Champion not found".to_string()))
    }

    pub async fn get_by_trait(&self, trait_name: &str) -> Result<Vec<ChampionSummary>, ApiError> {
        let data = CHAMPIONS.read().unwrap();
        let champions: Vec<ChampionSummary> = data
            .iter()
            .filter(|c| c.traits.iter().any(|t| t.eq_ignore_ascii_case(trait_name)))
            .map(|c| ChampionSummary {
                id: c.id.unwrap_or_else(ObjectId::new),
                name: c.name.clone(),
                cost: c.cost,
                traits: c.traits.clone(),
                health: c.stats.health,
                attack_damage: c.stats.attack_damage,
                ability_name: c.ability.name.clone(),
                image_url: c.image_url.clone(),
            })
            .collect();

        Ok(champions)
    }
}