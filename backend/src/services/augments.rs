use bson::{doc, oid::ObjectId, DateTime};
use futures::stream::TryStreamExt;
use mongodb::options::FindOptions;
use mongodb::{Collection, Database};
use serde_json;

use crate::models::*;
use crate::errors::ApiError;

pub struct AugmentService {
    pub collection: Collection<Augment>,
}

impl AugmentService {
    pub fn new(db: &Database) -> Self {
        Self {
            collection: db.collection("augments"),
        }
    }

    // Method to populate MongoDB with RIOT augment data
    pub async fn populate_from_riot_data(&self) -> Result<(), ApiError> {
        println!("🔮 Loading RIOT augment data...");

        // Load TFT augment data
        let tft_data = include_str!("../../../../tft_augments_data.json");
        let tft_augments: serde_json::Value = serde_json::from_str(tft_data)
            .map_err(|e| ApiError::InternalServerError(format!("Failed to parse TFT augment data: {}", e)))?;

        // Get set ID (assuming Set 15 exists)
        let set_id = self.get_or_create_set().await?;

        let now = DateTime::now();
        let tft_augment_data = tft_augments["data"].as_object()
            .ok_or_else(|| ApiError::InternalServerError("Invalid TFT augment data format".to_string()))?;

        for (augment_key, augment_data) in tft_augment_data {
            let name = augment_data["name"].as_str()
                .ok_or_else(|| ApiError::InternalServerError(format!("Missing name for augment {}", augment_key)))?;

            let description = augment_data["description"].as_str()
                .unwrap_or("No description available");

            // Determine augment type and tier
            let (augment_type, tier) = self.parse_augment_type_and_tier(name);

            // Determine category (simplified)
            let category = if description.to_lowercase().contains("combat") || description.to_lowercase().contains("damage") {
                "Combat"
            } else if description.to_lowercase().contains("gold") || description.to_lowercase().contains("economy") {
                "Economy"
            } else if description.to_lowercase().contains("synergy") || description.to_lowercase().contains("trait") {
                "Synergy"
            } else {
                "Hero"
            }.to_string();

            // Placeholder effects - would need actual TFT augment effects
            let effects = vec![];

            // Image URL
            let image_url = Some(format!("https://ddragon.leagueoflegends.com/cdn/15.21.1/img/tft-augment/{}.png", augment_key));

            let augment = Augment {
                id: Some(ObjectId::new()),
                set_id,
                name: name.to_string(),
                description: description.to_string(),
                augment_type,
                category,
                tier,
                hero_champion: None,
                effects,
                winrate_impact: None,
                pick_rate: None,
                is_enabled: true,
                image_url,
                created_at: now.into(),
                updated_at: now.into(),
            };

            // Insert into MongoDB
            self.collection.insert_one(&augment).await
                .map_err(|e| ApiError::InternalServerError(format!("Failed to insert augment {}: {}", name, e)))?;
        }

        println!("✅ Successfully populated {} augments", tft_augment_data.len());
        Ok(())
    }

    fn parse_augment_type_and_tier(&self, name: &str) -> (String, u32) {
        if name.contains("Prismatic") {
            ("Prismatic".to_string(), 3)
        } else if name.contains("Gold") {
            ("Gold".to_string(), 2)
        } else {
            ("Silver".to_string(), 1)
        }
    }

    async fn get_or_create_set(&self) -> Result<ObjectId, ApiError> {
        // For now, create a new set ID. In production, you'd query existing sets
        Ok(ObjectId::new())
    }

    pub async fn get_augments(&self, params: AugmentQuery) -> Result<PaginatedResponse<Augment>, ApiError> {
        // Build MongoDB filter
        let mut filter = doc! {};

        // tier
        if let Some(tier) = params.tier {
            filter.insert("tier", tier);
        }

        // category
        if let Some(ref category) = params.category {
            filter.insert("category", doc! { "$regex": format!("^{}$", category), "$options": "i" });
        }

        // type
        if let Some(ref augment_type) = params.augment_type {
            filter.insert("augment_type", doc! { "$regex": format!("^{}$", augment_type), "$options": "i" });
        }

        // Sorting: by tier then name
        let sort_doc = doc! {
            "tier": -1,
            "name": 1
        };

        // Pagination
        let per_page = params.limit.unwrap_or(20).clamp(1, 100) as i64;
        let skip = 0u64; // Simple pagination for now

        // Get total count
        let total = self.collection.count_documents(filter.clone()).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to count augments: {}", e)))?;

        // Get paginated results
        let options = FindOptions::builder()
            .sort(Some(sort_doc))
            .skip(Some(skip))
            .limit(Some(per_page))
            .build();

        let cursor = self.collection.find(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find augments: {}", e)))?;

        let augments: Vec<Augment> = cursor.try_collect().await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to collect augments: {}", e)))?;

        let total_pages = ((total as f64 / per_page as f64).ceil()) as u32;

        Ok(PaginatedResponse {
            data: augments,
            total: total as u32,
            page: 1,
            per_page: per_page as u32,
            total_pages,
        })
    }

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Augment, ApiError> {
        let filter = doc! { "_id": id };
        let augment = self.collection.find_one(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find augment: {}", e)))?
            .ok_or_else(|| ApiError::NotFound("Augment not found".to_string()))?;
        Ok(augment)
    }
}