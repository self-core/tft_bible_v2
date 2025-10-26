use bson::{doc, oid::ObjectId, DateTime};
use futures::stream::TryStreamExt;
use mongodb::options::FindOptions;
use mongodb::{Collection, Database};
use serde_json;
use std::collections::HashMap;

use crate::models::*;
use crate::errors::ApiError;

pub struct ItemService {
    pub collection: Collection<Item>,
}

impl ItemService {
    pub fn new(db: &Database) -> Self {
        Self {
            collection: db.collection("items"),
        }
    }

    // Method to populate MongoDB with RIOT item data
    pub async fn populate_from_riot_data(&self) -> Result<(), ApiError> {
        println!("⚔️ Loading RIOT item data...");

        // Load TFT item data
        let tft_data = include_str!("../../../../tft_item_data.json");
        let tft_items: serde_json::Value = serde_json::from_str(tft_data)
            .map_err(|e| ApiError::InternalServerError(format!("Failed to parse TFT item data: {}", e)))?;

        // Get set ID (assuming Set 15 exists)
        let set_id = self.get_or_create_set().await?;

        let now = DateTime::now();
        let tft_item_data = tft_items["data"].as_object()
            .ok_or_else(|| ApiError::InternalServerError("Invalid TFT item data format".to_string()))?;

        for (item_key, item_data) in tft_item_data {
            let name = item_data["name"].as_str()
                .ok_or_else(|| ApiError::InternalServerError(format!("Missing name for item {}", item_key)))?;

            let description = item_data["description"].as_str()
                .unwrap_or("No description available");

            // Determine item type
            let item_type = if name.contains("Radiant") {
                "Radiant"
            } else if name.contains("Emblem") {
                "Emblem"
            } else if name.contains("Artifact") {
                "Artifact"
            } else {
                "Completed"
            }.to_string();

            // Determine category (simplified)
            let category = if description.to_lowercase().contains("attack damage") || description.to_lowercase().contains("ad") {
                "AD"
            } else if description.to_lowercase().contains("ability power") || description.to_lowercase().contains("ap") {
                "AP"
            } else if description.to_lowercase().contains("health") || description.to_lowercase().contains("armor") {
                "Tank"
            } else {
                "Utility"
            }.to_string();

            // Placeholder stats - would need actual TFT item stats
            let stats = ItemStats {
                attack_damage: None,
                ability_power: None,
                attack_speed: None,
                crit_chance: None,
                health: None,
                armor: None,
                magic_resist: None,
                mana: None,
            };

            // Placeholder effects - would need actual TFT item effects
            let effects = vec![];

            // Image URL
            let image_url = Some(format!("https://ddragon.leagueoflegends.com/cdn/15.21.1/img/tft-item/{}.png", item_key));

            let item = Item {
                id: Some(ObjectId::new()),
                set_id,
                name: name.to_string(),
                description: description.to_string(),
                item_type,
                category,
                stats,
                recipe: None, // Would need to parse actual recipes
                builds_into: vec![],
                effects,
                priority: 1,
                is_unique: false,
                is_radiant: name.contains("Radiant"),
                image_url,
                created_at: now,
                updated_at: now,
            };

            // Insert into MongoDB
            self.collection.insert_one(&item).await
                .map_err(|e| ApiError::InternalServerError(format!("Failed to insert item {}: {}", name, e)))?;
        }

        println!("✅ Successfully populated {} items", tft_item_data.len());
        Ok(())
    }

    async fn get_or_create_set(&self) -> Result<ObjectId, ApiError> {
        // For now, create a new set ID. In production, you'd query existing sets
        Ok(ObjectId::new())
    }

    pub async fn get_items(
        &self,
        params: ItemQuery,
    ) -> Result<PaginatedResponse<ItemSummary>, ApiError> {
        // Build MongoDB filter
        let mut filter = doc! {};

        // category
        if let Some(ref category) = params.category {
            filter.insert("category", doc! { "$regex": format!("^{}$", category), "$options": "i" });
        }

        // type
        if let Some(ref item_type) = params.item_type {
            filter.insert("item_type", doc! { "$regex": format!("^{}$", item_type), "$options": "i" });
        }

        // search (name/description)
        if let Some(ref search) = params.search {
            filter.insert("$or", vec![
                doc! { "name": doc! { "$regex": search, "$options": "i" } },
                doc! { "description": doc! { "$regex": search, "$options": "i" } }
            ]);
        }

        // Sorting: by priority then name
        let sort_doc = doc! {
            "priority": 1,
            "name": 1
        };

        // Pagination
        let per_page = params.limit.unwrap_or(20).clamp(1, 100) as i64;
        let skip = 0u64; // Simple pagination for now

        // Get total count
        let total = self.collection.count_documents(filter.clone()).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to count items: {}", e)))?;

        // Get paginated results
        let options = FindOptions::builder()
            .sort(Some(sort_doc))
            .skip(Some(skip))
            .limit(Some(per_page))
            .build();

        let cursor = self.collection.find(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find items: {}", e)))?;

        let items: Vec<Item> = cursor.try_collect().await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to collect items: {}", e)))?;

        let total_pages = ((total as f64 / per_page as f64).ceil()) as u32;

        let summaries = items
            .into_iter()
            .map(|i| ItemSummary {
                id: i.id.unwrap_or_else(ObjectId::new),
                name: i.name,
                category: i.category,
                item_type: i.item_type,
                description: i.description,
                is_unique: i.is_unique,
                priority: i.priority,
                image_url: i.image_url,
            })
            .collect();

        Ok(PaginatedResponse {
            data: summaries,
            total: total as u32,
            page: 1,
            per_page: per_page as u32,
            total_pages,
        })
    }

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Item, ApiError> {
        let filter = doc! { "_id": id };
        let item = self.collection.find_one(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find item: {}", e)))?
            .ok_or_else(|| ApiError::NotFound("Item not found".to_string()))?;
        Ok(item)
    }

    pub async fn get_recommendations_for_champion(&self, _champion_id: ObjectId) -> Result<Vec<ItemSummary>, ApiError> {
        // For now, return all items. In production, you'd implement recommendation logic
        let cursor = self.collection.find(doc! {}).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find items: {}", e)))?;

        let items: Vec<Item> = cursor.try_collect().await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to collect items: {}", e)))?;

        let summaries = items
            .into_iter()
            .map(|i| ItemSummary {
                id: i.id.unwrap_or_else(ObjectId::new),
                name: i.name,
                category: i.category,
                item_type: i.item_type,
                description: i.description,
                is_unique: i.is_unique,
                priority: i.priority,
                image_url: i.image_url,
            })
            .collect();

        Ok(summaries)
    }

}