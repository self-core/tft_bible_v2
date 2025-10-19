use bson::{oid::ObjectId, DateTime};
use once_cell::sync::Lazy;
use std::sync::RwLock;

use crate::models::*;
use crate::errors::ApiError;

// Simple in-memory mock storage guarded by RwLock
static ITEMS: Lazy<RwLock<Vec<Item>>> = Lazy::new(|| {
    let now = DateTime::now();
    let set_id = ObjectId::new();

    let sample = vec![
        Item {
            id: Some(ObjectId::new()),
            set_id,
            name: "Bloodthirster".to_string(),
            description: "Grants Attack Damage and Life Steal".to_string(),
            item_type: "Completed".to_string(),
            category: "AD".to_string(),
            stats: ItemStats {
                attack_damage: Some(55.0),
                ability_power: None,
                attack_speed: None,
                crit_chance: None,
                health: Some(300.0),
                armor: None,
                magic_resist: None,
                mana: None,
            },
            recipe: Some(ItemRecipe {
                component1: ObjectId::new(),
                component2: ObjectId::new(),
            }),
            builds_into: vec![],
            effects: vec![
                ItemEffect {
                    effect_type: "Passive".to_string(),
                    description: "Heal for 50% of damage dealt by basic attacks and abilities".to_string(),
                    value: Some(0.5),
                    duration: None,
                    cooldown: None,
                }
            ],
            priority: 1,
            is_unique: false,
            is_radiant: false,
            image_url: Some("https://example.com/bloodthirster.png".to_string()),
            created_at: now,
            updated_at: now,
        },
        Item {
            id: Some(ObjectId::new()),
            set_id,
            name: "Rabadon's Deathcap".to_string(),
            description: "Massively increases Ability Power".to_string(),
            item_type: "Completed".to_string(),
            category: "AP".to_string(),
            stats: ItemStats {
                attack_damage: None,
                ability_power: Some(120.0),
                attack_speed: None,
                crit_chance: None,
                health: None,
                armor: None,
                magic_resist: None,
                mana: None,
            },
            recipe: Some(ItemRecipe {
                component1: ObjectId::new(),
                component2: ObjectId::new(),
            }),
            builds_into: vec![],
            effects: vec![],
            priority: 1,
            is_unique: false,
            is_radiant: false,
            image_url: Some("https://example.com/rabadons.png".to_string()),
            created_at: now,
            updated_at: now,
        },
        Item {
            id: Some(ObjectId::new()),
            set_id,
            name: "Warmog's Armor".to_string(),
            description: "Grants massive Health and Mana".to_string(),
            item_type: "Completed".to_string(),
            category: "Tank".to_string(),
            stats: ItemStats {
                attack_damage: None,
                ability_power: None,
                attack_speed: None,
                crit_chance: None,
                health: Some(800.0),
                armor: None,
                magic_resist: None,
                mana: Some(150.0),
            },
            recipe: Some(ItemRecipe {
                component1: ObjectId::new(),
                component2: ObjectId::new(),
            }),
            builds_into: vec![],
            effects: vec![
                ItemEffect {
                    effect_type: "Passive".to_string(),
                    description: "Regenerate 3% max Health per second".to_string(),
                    value: Some(0.03),
                    duration: None,
                    cooldown: None,
                }
            ],
            priority: 2,
            is_unique: false,
            is_radiant: false,
            image_url: Some("https://example.com/warmogs.png".to_string()),
            created_at: now,
            updated_at: now,
        },
    ];
    RwLock::new(sample)
});

pub struct ItemService;

impl ItemService {
    pub fn new(_db: &mongodb::Database) -> Self {
        Self
    }

    pub async fn get_items(
        &self,
        params: ItemQuery,
    ) -> Result<PaginatedResponse<ItemSummary>, ApiError> {
        let data = ITEMS.read().unwrap().clone();

        // Filtering
        let mut filtered: Vec<Item> = data.into_iter().collect();

        // category
        if let Some(ref category) = params.category {
            filtered = filtered.into_iter().filter(|i| i.category.eq_ignore_ascii_case(category)).collect();
        }

        // type
        if let Some(ref item_type) = params.item_type {
            filtered = filtered.into_iter().filter(|i| i.item_type.eq_ignore_ascii_case(item_type)).collect();
        }

        // search (name/description)
        if let Some(ref search) = params.search {
            let sl = search.to_lowercase();
            filtered = filtered.into_iter().filter(|i| {
                i.name.to_lowercase().contains(&sl) || i.description.to_lowercase().contains(&sl)
            }).collect();
        }

        let mut items: Vec<Item> = filtered.into_iter().collect();

        // Sorting: by priority then name
        items.sort_by(|a, b| {
            a.priority.cmp(&b.priority).then(a.name.cmp(&b.name))
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
            .map(|i| ItemSummary {
                id: i.id.unwrap_or_else(ObjectId::new),
                name: i.name.clone(),
                category: i.category.clone(),
                item_type: i.item_type.clone(),
                description: i.description.clone(),
                is_unique: i.is_unique,
                priority: i.priority,
                image_url: i.image_url.clone(),
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

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Item, ApiError> {
        let data = ITEMS.read().unwrap();
        let item = data.iter().find(|i| i.id == Some(id)).cloned();
        item.ok_or_else(|| ApiError::NotFound("Item not found".to_string()))
    }

    pub async fn get_recommendations_for_champion(&self, _champion_id: ObjectId) -> Result<Vec<ItemSummary>, ApiError> {
        // Mock recommendations - return all items for now
        let data = ITEMS.read().unwrap();
        let recommendations: Vec<ItemSummary> = data
            .iter()
            .map(|i| ItemSummary {
                id: i.id.unwrap_or_else(ObjectId::new),
                name: i.name.clone(),
                category: i.category.clone(),
                item_type: i.item_type.clone(),
                description: i.description.clone(),
                is_unique: i.is_unique,
                priority: i.priority,
                image_url: i.image_url.clone(),
            })
            .collect();

        Ok(recommendations)
    }
}