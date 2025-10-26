use bson::{doc, oid::ObjectId, DateTime};
use futures::stream::TryStreamExt;
use mongodb::options::FindOptions;
use mongodb::{Collection, Database};
use serde_json;
use std::collections::HashMap;

use crate::models::*;
use crate::errors::ApiError;

pub struct TraitService {
    pub collection: Collection<Trait>,
    pub sets_collection: Collection<Set>,
}

impl TraitService {
    pub fn new(db: &Database) -> Self {
        Self {
            collection: db.collection("traits"),
            sets_collection: db.collection("sets"),
        }
    }

    // Create the TFT Set 15 if it doesn't exist
    pub async fn create_set(&self) -> Result<(), ApiError> {
        let existing_count = self.sets_collection.count_documents(doc! {}).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to check sets: {}", e)))?;

        if existing_count > 0 {
            return Ok(()); // Set already exists
        }

        let now = DateTime::now();
        let set = Set {
            id: Some(ObjectId::new()),
            name: "Set 15: Ixtal".to_string(),
            short_name: "15".to_string(),
            version: "15.21.1".to_string(),
            is_active: true,
            release_date: now,
            end_date: None,
            description: Some("Set 15: Ixtal brings new champions and mechanics".to_string()),
            image_url: Some("https://ddragon.leagueoflegends.com/cdn/15.21.1/img/tft-logo.png".to_string()),
            created_at: now,
            updated_at: now,
        };

        self.sets_collection.insert_one(&set).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to create set: {}", e)))?;

        Ok(())
    }

    // Method to populate MongoDB with RIOT trait data
    pub async fn populate_from_riot_data(&self) -> Result<(), ApiError> {
        println!("🏷️ Loading RIOT trait data...");

        // Load TFT trait data
        let tft_data = include_str!("../../../../tft_trait_data.json");
        let tft_traits: serde_json::Value = serde_json::from_str(tft_data)
            .map_err(|e| ApiError::InternalServerError(format!("Failed to parse TFT trait data: {}", e)))?;

        // Get set ID
        let set_id = self.get_set_id().await?;

        let now = DateTime::now();
        let tft_trait_data = tft_traits["data"].as_object()
            .ok_or_else(|| ApiError::InternalServerError("Invalid TFT trait data format".to_string()))?;

        for (trait_key, trait_data) in tft_trait_data {
            // Skip tutorial traits
            if trait_key.starts_with("TFTTutorial_") {
                continue;
            }

            let name = trait_data["name"].as_str()
                .ok_or_else(|| ApiError::InternalServerError(format!("Missing name for trait {}", trait_key)))?;

            // Parse trait type
            let trait_type = if trait_key.contains("Origin") {
                "Origin"
            } else if trait_key.contains("Class") {
                "Class"
            } else {
                "Unique"
            }.to_string();

            // Placeholder description - would need actual TFT trait descriptions
            let description = format!("{} trait for TFT Set 15", name);

            // Placeholder breakpoints - would need actual TFT trait breakpoints
            let breakpoints = vec![
                TraitBreakpoint {
                    count: 2,
                    description: format!("2 {} - Basic effect", name),
                    bonuses: HashMap::new(),
                },
                TraitBreakpoint {
                    count: 4,
                    description: format!("4 {} - Enhanced effect", name),
                    bonuses: HashMap::new(),
                },
                TraitBreakpoint {
                    count: 6,
                    description: format!("6 {} - Maximum effect", name),
                    bonuses: HashMap::new(),
                },
            ];

            // Image URL
            let image_url = Some(format!("https://ddragon.leagueoflegends.com/cdn/15.21.1/img/tft-trait/{}.png", trait_key));

            let trait_obj = Trait {
                id: Some(ObjectId::new()),
                set_id,
                name: name.to_string(),
                description,
                trait_type,
                image_url,
                breakpoints,
                created_at: now,
                updated_at: now,
            };

            // Insert into MongoDB
            self.collection.insert_one(&trait_obj).await
                .map_err(|e| ApiError::InternalServerError(format!("Failed to insert trait {}: {}", name, e)))?;
        }

        println!("✅ Successfully populated {} traits", tft_trait_data.len());
        Ok(())
    }

    async fn get_set_id(&self) -> Result<ObjectId, ApiError> {
        let filter = doc! { "version": "15.21.1" };
        let set = self.sets_collection.find_one(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find set: {}", e)))?
            .ok_or_else(|| ApiError::InternalServerError("Set 15 not found".to_string()))?;

        set.id.ok_or_else(|| ApiError::InternalServerError("Set ID is None".to_string()))
    }

    pub async fn get_traits(&self) -> Result<Vec<TraitSummary>, ApiError> {
        let cursor = self.collection.find(doc! {}).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find traits: {}", e)))?;

        let traits: Vec<Trait> = cursor.try_collect().await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to collect traits: {}", e)))?;

        let summaries = traits
            .into_iter()
            .map(|t| TraitSummary {
                id: t.id.unwrap_or_else(ObjectId::new),
                name: t.name,
                trait_type: t.trait_type,
                description: t.description,
                breakpoints: t.breakpoints.iter().map(|b| b.count).collect(),
                image_url: t.image_url,
            })
            .collect();

        Ok(summaries)
    }

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Trait, ApiError> {
        let filter = doc! { "_id": id };
        let trait_obj = self.collection.find_one(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find trait: {}", e)))?
            .ok_or_else(|| ApiError::NotFound("Trait not found".to_string()))?;
        Ok(trait_obj)
    }
}