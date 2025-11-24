use bson::{doc, oid::ObjectId, DateTime};
use futures::stream::TryStreamExt;
use once_cell::sync::Lazy;
use std::sync::RwLock;
use chrono::Utc;
use mongodb::{Collection, Database};
use mongodb::options::FindOptions;
use crate::models::*;
use crate::errors::ApiError;


// Simple in-memory mock storage guarded by RwLock
static CHAMPIONS: Lazy<RwLock<Vec<Champion>>> = Lazy::new(|| {
    let now = Utc::now();
    let set_id = ObjectId::new();
    RwLock::new(Vec::new()) // Initialize with an empty vector
});

pub struct ChampionService {
    pub collection: Collection<Champion>,
}

impl ChampionService {
    pub fn new(db: &Database) -> Self {
        Self {
            collection: db.collection("champions"),
        }
    }

    // Method to populate MongoDB with RIOT champion data
    pub async fn populate_from_riot_data(&self) -> Result<(), ApiError> {
        println!("📖 Loading RIOT champion data...");

        // Load TFT champion data
        let tft_data = include_str!("../../../../tft_champion_data.json");
        let tft_champions: serde_json::Value = serde_json::from_str(tft_data)
            .map_err(|e| ApiError::InternalServerError(format!("Failed to parse TFT champion data: {}", e)))?;

        // Load TFT champion full data for abilities (placeholder - would need actual full data file)
        let tft_full_champions = serde_json::json!({"data": {}});

        // Get set ID (assuming Set 15 exists)
        let set_id = self.get_or_create_set().await?;

        let now = DateTime::now();
        let tft_champion_data = tft_champions["data"].as_object()
            .ok_or_else(|| ApiError::InternalServerError("Invalid TFT champion data format".to_string()))?;

        let tft_full_data_map = tft_full_champions["data"].as_object()
            .unwrap_or(&serde_json::Map::new()).clone();

        for (champion_key, champion_data) in tft_champion_data {
            // Skip tutorial champions
            if champion_key.starts_with("TFTTutorial_") {
                continue;
            }

            let name = champion_data["name"].as_str()
                .ok_or_else(|| ApiError::InternalServerError(format!("Missing name for champion {}", champion_key)))?;
            let tier = champion_data["tier"].as_u64()
                .ok_or_else(|| ApiError::InternalServerError(format!("Missing tier for champion {}", champion_key)))? as u32;

            // Get full champion data for abilities
            let full_champion_data = tft_full_data_map.get(champion_key);
            let ability = if let Some(full_data) = full_champion_data {
                self.parse_champion_ability(full_data)?
            } else {
                // Fallback ability data
                ChampionAbility {
                    name: "Unknown Ability".to_string(),
                    description: "Ability data not available".to_string(),
                    ability_type: "Active".to_string(),
                    targeting: "Enemies".to_string(),
                    damage_type: "Physical".to_string(),
                    scaling: vec![],
                }
            };

            // Create champion stats (placeholder values - would need actual TFT stats)
            let stats = ChampionStats {
                health: 600.0 + (tier as f64 * 100.0), // Base health scaling with cost
                mana: 0.0,
                starting_mana: 0.0,
                armor: 20.0,
                magic_resist: 20.0,
                attack_damage: 40.0 + (tier as f64 * 10.0),
                attack_speed: 0.75,
                attack_range: 1.0, // Most TFT champions are melee
                crit_chance: 0.25,
                crit_multiplier: 1.5,
            };

            let star_scaling = StarScaling {
                two_star: StarMultipliers {
                    health_multiplier: 1.8,
                    damage_multiplier: 1.8,
                },
                three_star: StarMultipliers {
                    health_multiplier: 2.7,
                    damage_multiplier: 2.7,
                },
            };

            // Image URLs
            let image_url = Some(format!("https://ddragon.leagueoflegends.com/cdn/15.21.1/img/tft-champion/{}.png", champion_key));
            let splash_url = Some(format!("https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{}_0.jpg", name.replace(" ", "").replace("'", "")));

            let champion = Champion {
                id: Some(ObjectId::new()),
                set_id,
                name: name.to_string(),
                display_name: Some(name.to_string()),
                cost: tier,
                traits: vec![], // Will be populated when traits are seeded
                stats,
                star_scaling,
                ability,
                image_url,
                splash_url,
                rarity: self.get_rarity_from_cost(tier),
                release_version: Some("15.21.1".to_string()),
                is_enabled: true,
                created_at: now,
                updated_at: now,
            };

            // Insert into MongoDB
            self.collection.insert_one(&champion).await
                .map_err(|e| ApiError::InternalServerError(format!("Failed to insert champion {}: {}", name, e)))?;
        }

        println!("✅ Successfully populated {} champions", tft_champion_data.len());
        Ok(())
    }

    fn parse_champion_ability(&self, full_data: &serde_json::Value) -> Result<ChampionAbility, ApiError> {
        let spells = full_data["spells"].as_array()
            .and_then(|spells| spells.get(0))
            .ok_or_else(|| ApiError::InternalServerError("No spells found".to_string()))?;

        let name = spells["name"].as_str().unwrap_or("Unknown Ability").to_string();
        let description = spells["description"].as_str().unwrap_or("No description").to_string();

        // Parse damage type and other properties (simplified)
        let damage_type = if description.to_lowercase().contains("magic") {
            "Magic"
        } else if description.to_lowercase().contains("true") {
            "True"
        } else {
            "Physical"
        }.to_string();

        Ok(ChampionAbility {
            name,
            description,
            ability_type: "Active".to_string(),
            targeting: "Enemies".to_string(),
            damage_type,
            scaling: vec![], // Would need more complex parsing for actual scaling
        })
    }

    fn get_rarity_from_cost(&self, cost: u32) -> String {
        match cost {
            1 => "Common".to_string(),
            2 => "Common".to_string(),
            3 => "Epic".to_string(),
            4 => "Epic".to_string(),
            5 => "Legendary".to_string(),
            _ => "Common".to_string(),
        }
    }

    async fn get_or_create_set(&self) -> Result<ObjectId, ApiError> {
        // For now, create a new set ID. In production, you'd query existing sets
        Ok(ObjectId::new())
    }

    pub async fn get_champions(
        &self,
        params: ChampionQuery,
    ) -> Result<PaginatedResponse<ChampionSummary>, ApiError> {
        // Build MongoDB filter
        let mut filter = doc! {};

        // cost
        if let Some(cost) = params.cost {
            filter.insert("cost", cost);
        }

        // traits (comma-separated)
        if let Some(ref traits) = params.traits {
            let wanted: Vec<String> = traits.split(',').map(|s| s.trim().to_string()).collect();
            filter.insert("traits", doc! { "$in": wanted });
        }

        // search (name)
        if let Some(ref search) = params.search {
            filter.insert("$or", vec![
                doc! { "name": doc! { "$regex": search, "$options": "i" } },
                doc! { "display_name": doc! { "$regex": search, "$options": "i" } }
            ]);
        }

        // Sorting: by cost then name
        let sort_doc = doc! {
            "cost": 1,
            "name": 1
        };

        // Pagination
        let per_page = params.limit.unwrap_or(20).clamp(1, 100) as i64;
        let skip = 0u64; // Simple pagination for now

        // Get total count
        let total = self.collection.count_documents(filter.clone()).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to count champions: {}", e)))?;

        // Get paginated results
        let options = FindOptions::builder()
            .sort(Some(sort_doc))
            .skip(Some(skip))
            .limit(Some(per_page))
            .build();

        let cursor = self.collection.find(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find champions: {}", e)))?;

        let champions: Vec<Champion> = cursor.try_collect().await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to collect champions: {}", e)))?;

        let total_pages = ((total as f64 / per_page as f64).ceil()) as u32;

        let summaries = champions
            .into_iter()
            .map(|c| ChampionSummary {
                id: c.id.unwrap_or_else(ObjectId::new),
                name: c.name,
                cost: c.cost,
                traits: c.traits,
                health: c.stats.health,
                attack_damage: c.stats.attack_damage,
                ability_name: c.ability.name,
                image_url: c.image_url,
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

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Champion, ApiError> {
        let filter = doc! { "_id": id };
        let champion = self.collection.find_one(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find champion: {}", e)))?
            .ok_or_else(|| ApiError::NotFound("Champion not found".to_string()))?;
        Ok(champion)
    }

    pub async fn get_by_trait(&self, trait_name: &str) -> Result<Vec<ChampionSummary>, ApiError> {
        let filter = doc! { "traits": trait_name };
        let cursor = self.collection.find(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find champions by trait: {}", e)))?;

        let champions: Vec<Champion> = cursor.try_collect().await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to collect champions: {}", e)))?;

        let summaries = champions
            .into_iter()
            .map(|c| ChampionSummary {
                id: c.id.unwrap_or_else(ObjectId::new),
                name: c.name,
                cost: c.cost,
                traits: c.traits,
                health: c.stats.health,
                attack_damage: c.stats.attack_damage,
                ability_name: c.ability.name,
                image_url: c.image_url,
            })
            .collect();

        Ok(summaries)
    }

}