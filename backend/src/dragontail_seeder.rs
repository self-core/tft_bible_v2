use mongodb::{Database, Collection, bson::oid::ObjectId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use chrono::{DateTime, Utc};

// Reuse the same models as in models.rs but with different serialization approach
#[derive(Debug, Deserialize)]
pub struct DragontailChampion {
    pub id: String,
    pub name: String,
    #[serde(rename = "tier")]
    pub cost: u32,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
pub struct DragontailTrait {
    pub id: String,
    pub name: String,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
pub struct DragontailItem {
    pub id: String,
    pub name: String,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
pub struct DragontailAugment {
    pub id: String,
    pub name: String,
    pub description: String,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
pub struct DragontailImage {
    pub full: String,
    pub sprite: String,
    #[serde(rename = "group")]
    pub img_group: String,
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

#[derive(Debug, Deserialize)]
pub struct DragontailDataFile<T> {
    #[serde(rename = "type")]
    pub data_type: String,
    pub version: String,
    pub data: HashMap<String, T>,
}

pub struct DragontailSeeder {
    db: Database,
    base_path: String,
}

impl DragontailSeeder {
    pub fn new(db: Database, base_path: String) -> Self {
        Self { db, base_path }
    }

    pub async fn seed_all(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("🌱 Starting dragontail data seeding...");
        
        // First, get or create the active set for seeding
        let set_id = self.get_or_create_active_set().await?;
        
        self.seed_champions(set_id).await?;
        self.seed_traits(set_id).await?;
        self.seed_items(set_id).await?;
        self.seed_augments(set_id).await?;
        
        println!("✅ Dragontail data seeding completed successfully!");
        Ok(())
    }

    async fn get_or_create_active_set(&self) -> Result<ObjectId, Box<dyn std::error::Error>> {
        // For now, we'll get the current active set or create a default one
        // We could also make this configurable to choose which set to seed for
        use mongodb::bson::doc;
        use crate::models::Set;

        let sets_collection: Collection<Set> = self.db.collection("sets");

        // Find if there's an active set
        if let Some(set) = sets_collection.find_one(doc! { "is_active": true }, None).await? {
            Ok(set.id.unwrap_or_else(|| ObjectId::new()))
        } else {
            // Create a default set if none exists
            let new_set = Set {
                id: Some(ObjectId::new()),
                name: "Default Set".to_string(),
                short_name: "Default".to_string(),
                version: "1.0".to_string(),
                is_active: true,
                release_date: Utc::now(),
                end_date: None,
                description: Some("Default TFT Set for seeding".to_string()),
                image_url: Some("https://example.com/default-set.jpg".to_string()),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            
            let result = sets_collection.insert_one(&new_set, None).await?;
            Ok(result.inserted_id.as_object_id().unwrap())
        }
    }

    async fn seed_champions(&self, set_id: ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let path = format!("{}/15.23.1/data/en_US/tft-champion.json", self.base_path);

        if !Path::new(&path).exists() {
            println!("⚠️  Champions file not found at: {}", path);
            return Ok(());
        }

        let data = fs::read_to_string(&path)?;
        let dragontail_data: DragontailDataFile<DragontailChampion> = serde_json::from_str(&data)?;

        let champions_collection: Collection<crate::models::Champion> = self.db.collection("champions");

        for (key, champion) in dragontail_data.data {
            // Check if champion already exists
            let existing = champions_collection.find_one(
                mongodb::bson::doc! { "name": &champion.name, "set_id": set_id },
                None
            ).await?;

            if existing.is_some() {
                println!("⚠️  Champion {} already exists, skipping...", champion.name);
                continue;
            }

            // Determine traits based on champion name patterns
            let traits = self.infer_champion_traits(&champion.name, &key);

            // Create a champion based on the dragontail data with more accurate stats
            let (health, mana, attack_damage, armor, magic_resist, attack_speed) = self.infer_champion_stats(&champion.name, champion.cost);

            let new_champion = crate::models::Champion {
                id: Some(ObjectId::new()),
                set_id,
                name: champion.name.clone(),
                display_name: None,
                cost: champion.cost,
                traits,
                stats: crate::models::ChampionStats {
                    health,
                    mana,
                    starting_mana: 0.0, // This would need to be looked up from another data source
                    armor,
                    magic_resist,
                    attack_damage,
                    attack_speed,
                    attack_range: 3.0, // Default attack range for ranged, 1.0 for melee - would need to look up
                    crit_chance: 25.0, // Default crit chance
                    crit_multiplier: 150.0, // Default crit multiplier
                },
                star_scaling: crate::models::StarScaling {
                    two_star: crate::models::StarMultipliers {
                        health_multiplier: 1.8,
                        damage_multiplier: 1.8,
                    },
                    three_star: crate::models::StarMultipliers {
                        health_multiplier: 2.4,
                        damage_multiplier: 2.4,
                    },
                },
                ability: crate::models::ChampionAbility {
                    name: format!("{}'s Ability", champion.name), // Placeholder ability name
                    description: "Ability details not available from dragontail".to_string(),
                    ability_type: "Unknown".to_string(),
                    targeting: "Enemies".to_string(),
                    damage_type: "Mixed".to_string(),
                    scaling: vec![],
                },
                image_url: Some(format!("https://ddragon.leagueoflegends.com/cdn/15.23.1/img/champion/{}", champion.image.full)),
                splash_url: None,
                rarity: match champion.cost {
                    1 => "Common".to_string(),
                    2 => "Uncommon".to_string(),
                    3 => "Rare".to_string(),
                    4 => "Epic".to_string(),
                    5 => "Mythic".to_string(),
                    _ => "Unknown".to_string(),
                },
                release_version: Some(dragontail_data.version.clone()),
                is_enabled: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            champions_collection.insert_one(&new_champion, None).await?;
            println!("✅ Seeded champion: {}", champion.name);
        }

        Ok(())
    }

    async fn seed_traits(&self, set_id: ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let path = format!("{}/15.23.1/data/en_US/tft-trait.json", self.base_path);

        if !Path::new(&path).exists() {
            println!("⚠️  Traits file not found at: {}", path);
            return Ok(());
        }

        let data = fs::read_to_string(&path)?;
        let dragontail_data: DragontailDataFile<DragontailTrait> = serde_json::from_str(&data)?;

        let traits_collection: Collection<crate::models::Trait> = self.db.collection("traits");

        for (key, trait_data) in dragontail_data.data {
            // Check if trait already exists
            let existing = traits_collection.find_one(
                mongodb::bson::doc! { "name": &trait_data.name, "set_id": set_id },
                None
            ).await?;

            if existing.is_some() {
                println!("⚠️  Trait {} already exists, skipping...", trait_data.name);
                continue;
            }

            // Generate breakpoint information based on trait name and type
            let breakpoints = self.generate_trait_breakpoints(&trait_data.name, &self.infer_trait_type(&trait_data.name));

            let new_trait = crate::models::Trait {
                id: Some(ObjectId::new()),
                set_id,
                name: trait_data.name.clone(),
                description: "Description not available from dragontail".to_string(),
                trait_type: self.infer_trait_type(&trait_data.name), // Infer from name
                image_url: Some(format!("https://ddragon.leagueoflegends.com/cdn/15.23.1/img/tft/trait/{}", trait_data.image.full)),
                breakpoints,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            traits_collection.insert_one(&new_trait, None).await?;
            println!("✅ Seeded trait: {}", trait_data.name);
        }

        Ok(())
    }

    async fn seed_items(&self, set_id: ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let path = format!("{}/15.23.1/data/en_US/tft-item.json", self.base_path);

        if !Path::new(&path).exists() {
            println!("⚠️  Items file not found at: {}", path);
            return Ok(());
        }

        let data = fs::read_to_string(&path)?;
        let dragontail_data: DragontailDataFile<DragontailItem> = serde_json::from_str(&data)?;

        let items_collection: Collection<crate::models::Item> = self.db.collection("items");

        for (key, item) in dragontail_data.data {
            // Only process actual TFT items, skip assist/consumable items
            if key.starts_with("TFT_Item_") && !key.contains("Assist") && !key.contains("Consumable") {
                // Check if item already exists
                let existing = items_collection.find_one(
                    mongodb::bson::doc! { "name": &item.name, "set_id": set_id },
                    None
                ).await?;

                if existing.is_some() {
                    println!("⚠️  Item {} already exists, skipping...", item.name);
                    continue;
                }

                // Infer item stats and effects based on the name
                let (stats, effects) = self.infer_item_stats_and_effects(&item.name);
                let item_type = self.infer_item_type(&item.name);
                let category = self.infer_item_category(&item.name);

                let new_item = crate::models::Item {
                    id: Some(ObjectId::new()),
                    set_id,
                    name: item.name.clone(),
                    description: format!("Description for {}", item.name), // Placeholder
                    item_type: item_type.clone(), // Infer from name
                    category: category.clone(), // Infer from name
                    stats,
                    recipe: None,
                    builds_into: vec![],
                    effects,
                    priority: self.infer_item_priority(&item_type),
                    is_unique: self.is_unique_item(&item.name),
                    is_radiant: key.contains("Radiant") || key.contains("Gold"),
                    image_url: Some(format!("https://ddragon.leagueoflegends.com/cdn/15.23.1/img/tft/item/{}", item.image.full)),
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                };

                items_collection.insert_one(&new_item, None).await?;
                println!("✅ Seeded item: {}", item.name);
            }
        }

        Ok(())
    }

    async fn seed_augments(&self, set_id: ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let path = format!("{}/15.23.1/data/en_US/tft-augments.json", self.base_path);

        if !Path::new(&path).exists() {
            println!("⚠️  Augments file not found at: {}", path);
            return Ok(());
        }

        let data = fs::read_to_string(&path)?;
        let dragontail_data: DragontailDataFile<DragontailAugment> = serde_json::from_str(&data)?;

        let augments_collection: Collection<crate::models::Augment> = self.db.collection("augments");

        for (key, augment) in dragontail_data.data {
            // Check if augment already exists
            let existing = augments_collection.find_one(
                mongodb::bson::doc! { "name": &augment.name, "set_id": set_id },
                None
            ).await?;

            if existing.is_some() {
                println!("⚠️  Augment {} already exists, skipping...", augment.name);
                continue;
            }

            // Parse effects from description and infer other properties
            let effects = self.parse_augment_effects(&augment.description);
            let augment_type = self.infer_augment_type(&key);
            let category = self.infer_augment_category_from_description(&augment.description, &augment.name);
            let tier = self.infer_augment_tier(&key);

            let new_augment = crate::models::Augment {
                id: Some(ObjectId::new()),
                set_id,
                name: augment.name.clone(),
                description: augment.description.clone(),
                augment_type,
                category,
                tier,
                hero_champion: None,
                effects,
                winrate_impact: None,
                pick_rate: None,
                is_enabled: true,
                image_url: Some(format!("https://ddragon.leagueoflegends.com/cdn/15.23.1/img/tft/augment/{}", augment.image.full)),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            augments_collection.insert_one(&new_augment, None).await?;
            println!("✅ Seeded augment: {} (Tier {}, Type: {}, Category: {})",
                     augment.name, tier, augment_type, category);
        }

        Ok(())
    }

    // Helper functions to infer types from names
    fn infer_trait_type(&self, name: &str) -> String {
        // This is a basic implementation - in a real scenario you'd have more rules
        let name_lower = name.to_lowercase();
        
        if name_lower.contains("class") || ["assassin", "duelist", "mystic", "brawler", "protector", "ranger", "sorcerer", "warrior", "skirmisher", "invoker", "cavalier", "shapeshifter", "guardian", "bruiser", "evoker", "dragonmancer", "mage", "juggernaut"].iter().any(|&trait_name| name_lower.contains(trait_name)) {
            "Class".to_string()
        } else if name_lower.contains("origin") || ["demacia", "noxus", "ionia", "targon", "shadow", "piltover", "zaun", "bandlecity", "void", "independent", "shurima", "brawler", "yordle", "wild", "glacial", "desert", "platedsteel"].iter().any(|&trait_name| name_lower.contains(trait_name)) {
            "Origin".to_string()
        } else {
            "Other".to_string()
        }
    }

    fn infer_item_type(&self, name: &str) -> String {
        let name_lower = name.to_lowercase();
        
        if name_lower.contains("spatula") || name_lower.contains("emblem") || name_lower.contains("crown") {
            "Emblem".to_string()
        } else if name_lower.contains("bf") || name_lower.contains("sword") || name_lower.contains("rod") || name_lower.contains("tear") || name_lower.contains("gauntlet") || name_lower.contains("vest") || name_lower.contains("belt") || name_lower.contains("boots") || name_lower.contains("cloak") {
            "Component".to_string()
        } else if name_lower.contains("deathblade") || name_lower.contains("gauntlet") || name_lower.contains("hextech") || name_lower.contains("morellonomicon") || name_lower.contains("rabadon") || name_lower.contains("guinsoo") || name_lower.contains("statikk") || name_lower.contains("spear") || name_lower.contains("trap") || name_lower.contains("bloodthirster") || name_lower.contains("bramble") || name_lower.contains("chalice") || name_lower.contains("edge") || name_lower.contains("guardian") || name_lower.contains("locket") || name_lower.contains("ionic") || name_lower.contains("zekes") || name_lower.contains("randuin") || name_lower.contains("redemption") || name_lower.contains("locket") || name_lower.contains("shojin") || name_lower.contains("spear") || name_lower.contains("sunfire") || name_lower.contains("thornmail") || name_lower.contains("warmogs") || name_lower.contains("zfury") || name_lower.contains("zephyr") {
            "Completed".to_string()
        } else {
            "Other".to_string()
        }
    }

    fn infer_item_category(&self, name: &str) -> String {
        let name_lower = name.to_lowercase();
        
        if name_lower.contains("sword") || name_lower.contains("deathblade") || name_lower.contains("gauntlet") || name_lower.contains("edge") || name_lower.contains("statikk") || name_lower.contains("zfury") || name_lower.contains("bloodthirster") {
            "AD".to_string()
        } else if name_lower.contains("rod") || name_lower.contains("rabadon") || name_lower.contains("morellonomicon") || name_lower.contains("ionic") || name_lower.contains("shojin") || name_lower.contains("guinsoo") {
            "AP".to_string()
        } else if name_lower.contains("vest") || name_lower.contains("thornmail") || name_lower.contains("sunfire") || name_lower.contains("redemption") || name_lower.contains("randuin") {
            "Tank".to_string()
        } else if name_lower.contains("tear") || name_lower.contains("chalice") || name_lower.contains("shroud") || name_lower.contains("trap") {
            "Utility".to_string()
        } else {
            "Other".to_string()
        }
    }

    fn infer_augment_type(&self, name: &str) -> String {
        let name_lower = name.to_lowercase();
        
        if name_lower.contains("gold") || name_lower.contains("silver") || name_lower.contains("prism") {
            if name_lower.contains("gold") { "Gold".to_string() } 
            else if name_lower.contains("silver") { "Silver".to_string() } 
            else { "Prismatic".to_string() }
        } else {
            // Default to Silver for most augments
            "Silver".to_string()
        }
    }

    fn infer_augment_category(&self, name: &str) -> String {
        let name_lower = name.to_lowercase();
        
        if name_lower.contains("com") || name_lower.contains("soul") || name_lower.contains("dual") || name_lower.contains("team") {
            "Synergy".to_string()
        } else if name_lower.contains("gold") || name_lower.contains("rich") || name_lower.contains("treasure") || name_lower.contains("coin") || name_lower.contains("golddigger") {
            "Economy".to_string()
        } else if name_lower.contains("champion") || name_lower.contains("duplicat") || name_lower.contains("stars") || name_lower.contains("star") {
            "Combat".to_string()
        } else {
            "Other".to_string()
        }
    }

    fn infer_augment_tier(&self, key: &str) -> u32 {
        // Check for tier indicators in the key
        if key.contains("_III") || key.contains("3") || key.to_lowercase().ends_with("iii") {
            3
        } else if key.contains("_II") || key.contains("2") || key.to_lowercase().ends_with("ii") {
            2
        } else {
            1
        }
    }

    fn infer_champion_traits(&self, name: &str, key: &str) -> Vec<String> {
        // Extract trait information from the key - TFT champion keys often contain trait information
        let mut traits = Vec::new();
        let key_lower = key.to_lowercase();

        // Extract set traits from the key pattern (e.g., TFT7_ means Set 7)
        if key.contains("TFT7_") {
            // For Set 7, add example traits - in real implementation, you'd map based on actual champion traits
            // This is a simplified approach - you'd need to map based on actual champion traits
        } else if key.contains("TFT15_") {
            // For Set 9, add example traits
            // This is where you'd have your mapping logic based on actual data
        }

        // In a real implementation, you'd have a mapping system
        // For now, let's return an empty vector and note that
        // Actual trait assignment would require external mapping data

        // Example of how you might map specific champions to traits:
        if name.to_lowercase().contains("aatrox") {
            traits.push("Challenger".to_string());
            traits.push("Ghostly".to_string());
        } else if name.to_lowercase().contains("ahri") {
            traits.push("Arcanist".to_string());
            traits.push("Shuriman".to_string());
        }
        // Add more mappings as needed

        traits
    }

    fn infer_champion_stats(&self, name: &str, cost: u32) -> (f64, f64, f64, f64, f64, f64) {
        // Return (health, mana, attack_damage, armor, magic_resist, attack_speed)
        // Default values based on cost
        let (health, mana, attack_damage, armor, magic_resist, attack_speed) = match cost {
            1 => (550.0, 0.0, 50.0, 20.0, 20.0, 0.65),
            2 => (700.0, 0.0, 65.0, 30.0, 30.0, 0.70),
            3 => (850.0, 0.0, 80.0, 35.0, 35.0, 0.75),
            4 => (1000.0, 0.0, 90.0, 40.0, 40.0, 0.80),
            5 => (1200.0, 0.0, 100.0, 50.0, 50.0, 0.85),
            _ => (700.0, 0.0, 70.0, 30.0, 30.0, 0.70), // default
        };

        (health, mana, attack_damage, armor, magic_resist, attack_speed)
    }

    fn generate_trait_breakpoints(&self, name: &str, trait_type: &str) -> Vec<crate::models::TraitBreakpoint> {
        let mut breakpoints = Vec::new();
        let name_lower = name.to_lowercase();

        // Generate breakpoints based on trait type and name
        match trait_type {
            "Class" => {
                // Example breakpoints for class traits
                if name_lower.contains("assassin") {
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 2,
                        description: "2 units: Assassins gain 10% bonus Attack Speed".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("attack_speed".to_string(), 10.0);
                            map
                        },
                    });
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 4,
                        description: "4 units: Assassins gain 30% bonus Attack Speed".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("attack_speed".to_string(), 30.0);
                            map
                        },
                    });
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 6,
                        description: "6 units: Assassins gain 60% bonus Attack Speed".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("attack_speed".to_string(), 60.0);
                            map
                        },
                    });
                } else if name_lower.contains("duelist") {
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 2,
                        description: "2 units: Duelists gain 30% chance to dodge attacks".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("dodge_chance".to_string(), 30.0);
                            map
                        },
                    });
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 4,
                        description: "4 units: Duelists gain 50% chance to dodge attacks".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("dodge_chance".to_string(), 50.0);
                            map
                        },
                    });
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 6,
                        description: "6 units: Duelists gain 100% chance to dodge attacks".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("dodge_chance".to_string(), 100.0);
                            map
                        },
                    });
                } else {
                    // Default class trait pattern
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 2,
                        description: format!("2 units: {} units gain bonus effects", name),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("attack_damage".to_string(), 10.0);
                            map.insert("ability_power".to_string(), 10.0);
                            map
                        },
                    });
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 4,
                        description: format!("4 units: {} units gain enhanced bonus effects", name),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("attack_damage".to_string(), 25.0);
                            map.insert("ability_power".to_string(), 25.0);
                            map
                        },
                    });
                }
            },
            "Origin" => {
                // Example breakpoints for origin traits
                if name_lower.contains("demacia") {
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 2,
                        description: "2 units: Demacia units gain 50 armor and magic resist".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("armor".to_string(), 50.0);
                            map.insert("magic_resist".to_string(), 50.0);
                            map
                        },
                    });
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 4,
                        description: "4 units: All allies gain 30 armor and magic resist".to_string(),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("ally_armor".to_string(), 30.0);
                            map.insert("ally_magic_resist".to_string(), 30.0);
                            map
                        },
                    });
                } else {
                    // Default origin trait pattern
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 3,
                        description: format!("3 units: {} units gain bonus effects", name),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("health".to_string(), 100.0);
                            map
                        },
                    });
                    breakpoints.push(crate::models::TraitBreakpoint {
                        count: 6,
                        description: format!("6 units: All allies gain {} effects", name),
                        bonuses: {
                            let mut map = HashMap::new();
                            map.insert("ally_health".to_string(), 150.0);
                            map
                        },
                    });
                }
            },
            _ => {
                // Default trait pattern
                breakpoints.push(crate::models::TraitBreakpoint {
                    count: 2,
                    description: format!("2 units: {} units gain bonus effects", name),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("attack_speed".to_string(), 10.0);
                        map
                    },
                });
                breakpoints.push(crate::models::TraitBreakpoint {
                    count: 4,
                    description: format!("4 units: Enhanced {} effects", name),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("attack_speed".to_string(), 25.0);
                        map.insert("health".to_string(), 100.0);
                        map
                    },
                });
            }
        }

        breakpoints
    }

    fn infer_item_stats_and_effects(&self, name: &str) -> (crate::models::ItemStats, Vec<crate::models::ItemEffect>) {
        let name_lower = name.to_lowercase();
        let mut stats = crate::models::ItemStats {
            attack_damage: None,
            ability_power: None,
            attack_speed: None,
            crit_chance: None,
            health: None,
            armor: None,
            magic_resist: None,
            mana: None,
        };
        let mut effects = Vec::new();

        // Set stats based on item name patterns
        if name_lower.contains("deathblade") {
            stats.attack_damage = Some(15.0);
            effects.push(crate::models::ItemEffect {
                effect_type: "Damage Amp".to_string(),
                description: "Wearer's damage increased by 15%".to_string(),
                value: Some(15.0),
                duration: None,
                cooldown: None,
            });
        } else if name_lower.contains("bf sword") {
            stats.attack_damage = Some(15.0);
        } else if name_lower.contains("rod") || name_lower.contains("ap") || name_lower.contains("archangel") {
            stats.ability_power = Some(15.0);
        } else if name_lower.contains("tear") || name_lower.contains("manabound") {
            stats.mana = Some(15.0);
        } else if name_lower.contains("vest") || name_lower.contains("armor") {
            stats.armor = Some(15.0);
        } else if name_lower.contains("cloak") || name_lower.contains("mr") {
            stats.magic_resist = Some(15.0);
        } else if name_lower.contains("belt") {
            stats.health = Some(150.0);
        } else if name_lower.contains("glove") || name_lower.contains("sparring") {
            stats.crit_chance = Some(10.0);
        } else if name_lower.contains("boot") || name_lower.contains("speed") {
            stats.attack_speed = Some(10.0);
        }

        // Some specific completed items
        if name_lower.contains("bloodthirster") {
            stats.attack_damage = Some(20.0);
            stats.crit_chance = Some(20.0);
            effects.push(crate::models::ItemEffect {
                effect_type: "Lifesteal".to_string(),
                description: "Wearer heals for 25% of damage dealt".to_string(),
                value: Some(25.0),
                duration: None,
                cooldown: None,
            });
        } else if name_lower.contains("redemption") {
            stats.mana = Some(20.0);
            effects.push(crate::models::ItemEffect {
                effect_type: "Healing".to_string(),
                description: "On being struck by magic or true damage, heal all nearby allies for 20% of their max HP".to_string(),
                value: Some(20.0),
                duration: None,
                cooldown: None,
            });
        } else if name_lower.contains("zephyr") {
            stats.ability_power = Some(10.0);
            stats.mana = Some(15.0);
            effects.push(crate::models::ItemEffect {
                effect_type: "Dispel".to_string(),
                description: "On start of combat, banish an enemy for 5 seconds".to_string(),
                value: None,
                duration: Some(5.0),
                cooldown: None,
            });
        }

        (stats, effects)
    }

    fn infer_item_priority(&self, item_type: &str) -> u32 {
        match item_type {
            "Completed" => 2,
            "Component" => 1,
            "Emblem" => 3,
            _ => 1,
        }
    }

    fn is_unique_item(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        // Identify unique items based on name patterns
        name_lower.contains("thief") || name_lower.contains("trap") || name_lower.contains("locket") ||
        name_lower.contains("redemption") || name_lower.contains("zephyr") || name_lower.contains("shroud") ||
        name_lower.contains("bloodthirster") || name_lower.contains("blue")
    }

    fn parse_augment_effects(&self, description: &str) -> Vec<crate::models::AugmentEffect> {
        let mut effects = Vec::new();
        let desc_lower = description.to_lowercase();

        // Extract effects based on keywords in description
        if desc_lower.contains("attack speed") || desc_lower.contains("attackspeed") || desc_lower.contains("as") {
            effects.push(crate::models::AugmentEffect {
                effect_type: "StatBonus".to_string(),
                description: "Increases Attack Speed".to_string(),
                value: Some(10.0), // Default value
                is_percentage: true,
            });
        }

        if desc_lower.contains("health") || desc_lower.contains("max hp") || desc_lower.contains("heal") {
            effects.push(crate::models::AugmentEffect {
                effect_type: "StatBonus".to_string(),
                description: "Increases Health".to_string(),
                value: Some(100.0), // Default value
                is_percentage: false,
            });
        }

        if desc_lower.contains("ability power") || desc_lower.contains("ap") {
            effects.push(crate::models::AugmentEffect {
                effect_type: "StatBonus".to_string(),
                description: "Increases Ability Power".to_string(),
                value: Some(10.0), // Default value
                is_percentage: false,
            });
        }

        if desc_lower.contains("armor") || desc_lower.contains("magic resist") || desc_lower.contains("resist") {
            effects.push(crate::models::AugmentEffect {
                effect_type: "StatBonus".to_string(),
                description: "Increases Armor and Magic Resist".to_string(),
                value: Some(10.0), // Default value
                is_percentage: false,
            });
        }

        if desc_lower.contains("damage") {
            effects.push(crate::models::AugmentEffect {
                effect_type: "Damage Amp".to_string(),
                description: "Increases damage dealt".to_string(),
                value: Some(5.0), // Default value
                is_percentage: true,
            });
        }

        if desc_lower.contains("gold") {
            effects.push(crate::models::AugmentEffect {
                effect_type: "Gold Gain".to_string(),
                description: "Increases gold gain".to_string(),
                value: Some(1.0), // Default value
                is_percentage: false,
            });
        }

        if desc_lower.contains("mana") || desc_lower.contains("regen") {
            effects.push(crate::models::AugmentEffect {
                effect_type: "Mana".to_string(),
                description: "Improves mana generation".to_string(),
                value: Some(5.0), // Default value
                is_percentage: false,
            });
        }

        if effects.is_empty() {
            // Add a default effect if none could be parsed
            effects.push(crate::models::AugmentEffect {
                effect_type: "Generic".to_string(),
                description: "Provides beneficial effect".to_string(),
                value: Some(1.0),
                is_percentage: false,
            });
        }

        effects
    }

    fn infer_augment_category_from_description(&self, description: &str, name: &str) -> String {
        let desc_lower = description.to_lowercase();
        let name_lower = name.to_lowercase();

        // Determine category based on keywords in description and name
        if desc_lower.contains("champion") || desc_lower.contains("star") || desc_lower.contains("unit") ||
           desc_lower.contains("copy") || name_lower.contains("champion") || name_lower.contains("duplicat") {
            "Champion".to_string()
        } else if desc_lower.contains("econom") || desc_lower.contains("gold") || desc_lower.contains("interest") ||
                  desc_lower.contains("reroll") || desc_lower.contains("shop") || name_lower.contains("econom") {
            "Economy".to_string()
        } else if desc_lower.contains("trait") || desc_lower.contains("team") || desc_lower.contains("ally") ||
                  desc_lower.contains("synerg") || name_lower.contains("trait") {
            "Synergy".to_string()
        } else if desc_lower.contains("combat") || desc_lower.contains("attack") || desc_lower.contains("damage") ||
                  desc_lower.contains("fight") || name_lower.contains("combat") {
            "Combat".to_string()
        } else if desc_lower.contains("hero") {
            "Hero".to_string()
        } else {
            // Default category based on other characteristics
            "Other".to_string()
        }
    }
}