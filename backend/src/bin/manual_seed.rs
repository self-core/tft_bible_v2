use mongodb::{options::ClientOptions, Client, Database, Collection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::Utc;
use dotenv::dotenv;
use std::env;

#[derive(Debug, Serialize, Deserialize)]
struct Set {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    pub name: String,
    pub short_name: String,
    pub version: String,
    pub is_active: bool,
    pub release_date: chrono::DateTime<chrono::Utc>,
    pub end_date: Option<chrono::DateTime<chrono::Utc>>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TraitBreakpoint {
    pub count: u32,
    pub description: String,
    pub bonuses: HashMap<String, f64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Trait {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    pub set_id: mongodb::bson::oid::ObjectId,
    pub name: String,
    pub description: String,
    pub trait_type: String, // "Region", "Story", "Class", etc.
    pub image_url: Option<String>,
    pub breakpoints: Vec<TraitBreakpoint>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChampionStats {
    pub health: f64,
    pub mana: f64,
    #[serde(rename = "startingMana")]
    pub starting_mana: f64,
    pub armor: f64,
    #[serde(rename = "magicResist")]
    pub magic_resist: f64,
    #[serde(rename = "attackDamage")]
    pub attack_damage: f64,
    #[serde(rename = "attackSpeed")]
    pub attack_speed: f64,
    #[serde(rename = "attackRange")]
    pub attack_range: f64,
    #[serde(rename = "critChance")]
    pub crit_chance: f64,
    #[serde(rename = "critMultiplier")]
    pub crit_multiplier: f64,
}

#[derive(Debug, Serialize, Deserialize)]
struct StarMultipliers {
    #[serde(rename = "healthMultiplier")]
    pub health_multiplier: f64,
    #[serde(rename = "damageMultiplier")]
    pub damage_multiplier: f64,
}

#[derive(Debug, Serialize, Deserialize)]
struct StarScaling {
    #[serde(rename = "twoStar")]
    pub two_star: StarMultipliers,
    #[serde(rename = "threeStar")]
    pub three_star: StarMultipliers,
}

#[derive(Debug, Serialize, Deserialize)]
struct AbilityScaling {
    #[serde(rename = "starLevel")]
    pub star_level: u32,
    pub damage: f64,
    #[serde(rename = "additionalEffects")]
    pub additional_effects: HashMap<String, f64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChampionAbility {
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub ability_type: String, // "Active", "Passive", "Transform"
    pub targeting: String,     // "Enemies", "Allies", "Self"
    #[serde(rename = "damageType")]
    pub damage_type: String,   // "Physical", "Magic", "True"
    pub scaling: Vec<AbilityScaling>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Champion {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    pub set_id: mongodb::bson::oid::ObjectId,
    pub name: String,
    pub display_name: Option<String>,
    pub cost: u32, // 1-5
    pub traits: Vec<String>,
    pub stats: ChampionStats,
    pub star_scaling: StarScaling,
    pub ability: ChampionAbility,
    pub image_url: Option<String>,
    pub splash_url: Option<String>,
    pub rarity: String,
    pub release_version: Option<String>,
    pub is_enabled: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ItemStats {
    #[serde(rename = "attackDamage")]
    pub attack_damage: Option<f64>,
    #[serde(rename = "abilityPower")]
    pub ability_power: Option<f64>,
    #[serde(rename = "attackSpeed")]
    pub attack_speed: Option<f64>,
    #[serde(rename = "critChance")]
    pub crit_chance: Option<f64>,
    pub health: Option<f64>,
    pub armor: Option<f64>,
    #[serde(rename = "magicResist")]
    pub magic_resist: Option<f64>,
    pub mana: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ItemEffect {
    #[serde(rename = "type")]
    pub effect_type: String, // "OnAttack", "OnCast", "Passive"
    pub description: String,
    pub value: Option<f64>,
    pub duration: Option<f64>,
    pub cooldown: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Item {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    pub set_id: mongodb::bson::oid::ObjectId,
    pub name: String,
    pub description: String,
    pub item_type: String, // "Component", "Completed", "Radiant", "Artifact"
    pub category: String,  // "AD", "AP", "Tank", "Utility"
    pub stats: ItemStats,
    // Note: Skipping recipe and builds_into fields for simplicity
    pub effects: Vec<ItemEffect>,
    pub priority: u32,
    pub is_unique: bool,
    pub is_radiant: bool,
    pub image_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct HeroChampion {
    pub champion_id: mongodb::bson::oid::ObjectId,
    pub star_level: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct AugmentEffect {
    #[serde(rename = "type")]
    pub effect_type: String, // "StatBonus", "GoldGain", "ItemGrant"
    pub description: String,
    pub value: Option<f64>,
    #[serde(rename = "isPercentage")]
    pub is_percentage: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct Augment {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    pub set_id: mongodb::bson::oid::ObjectId,
    pub name: String,
    pub description: String,
    pub augment_type: String, // "Silver", "Gold", "Prismatic"
    pub category: String,      // "Combat", "Economy", "Synergy", "Hero"
    pub tier: u32,            // 1 = Silver, 2 = Gold, 3 = Prismatic
    pub hero_champion: Option<HeroChampion>,
    pub effects: Vec<AugmentEffect>,
    pub winrate_impact: Option<f64>,
    pub pick_rate: Option<f64>,
    pub is_enabled: bool,
    pub image_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

struct DatabaseSeeder {
    db: Database,
}

impl DatabaseSeeder {
    fn new(db: Database) -> Self {
        Self { db }
    }

    async fn seed_set16(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("🌱 Starting Set 16: Lore & Legends database seeding...");
        
        // Create the set first
        let set_id = self.seed_sets().await?;
        
        // Then seed in order of dependencies
        self.seed_traits(set_id).await?;
        self.seed_items(set_id).await?;
        self.seed_champions(set_id).await?;
        self.seed_augments(set_id).await?;

        println!("✅ Set 16: Lore & Legends database seeding completed successfully!");
        Ok(())
    }

    async fn seed_sets(&self) -> Result<mongodb::bson::oid::ObjectId, Box<dyn std::error::Error>> {
        let sets_collection: Collection<Set> = self.db.collection("sets");

        // Check if Lore & Legends set already exists
        let existing_set = sets_collection.find_one(
            mongodb::bson::doc! {"name": "Lore & Legends"}, 
            None
        ).await?;

        if let Some(existing) = existing_set {
            println!("⚠️  Set 'Lore & Legends' already exists, skipping creation.");
            return Ok(existing.id.unwrap_or_default()); // Return existing set ID
        }

        // Add the new Lore & Legends set (Set 16)
        let lore_legends_set = Set {
            id: None,
            name: "Lore & Legends".to_string(),
            short_name: "Set16".to_string(),
            version: "16.0".to_string(),
            is_active: true,
            release_date: chrono::DateTime::parse_from_rfc3339("2025-12-03T00:00:00Z")?.with_timezone(&Utc),
            end_date: None,
            description: Some("TFT Set 16: Lore & Legends - Dive into Runeterra's history with a massive Library of Lore".to_string()),
            image_url: Some("https://example.com/set16-image.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = sets_collection.insert_one(lore_legends_set).await?;
        let set_id = result.inserted_id.as_object_id().unwrap();
        
        println!("✅ Seeded sets collection with Lore & Legends (Set 16)");
        Ok(set_id)
    }

    async fn seed_traits(&self, set_id: mongodb::bson::oid::ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let traits_collection: Collection<Trait> = self.db.collection("traits");

        // Check if Set 16 traits already exist
        let existing_traits = traits_collection.count_documents(
            mongodb::bson::doc! {"set_id": set_id}, 
            None
        ).await?;

        if existing_traits > 0 {
            println!("⚠️  Set 16 traits already exist ({} found), skipping creation.", existing_traits);
            return Ok(());
        }

        // Demacia trait
        let demacia_trait = Trait {
            id: None,
            set_id,
            name: "Demacia".to_string(),
            description: "Each time your team loses 25% max Health, Demacians RALLY, reducing the cost of their abilities by 10%. Demacians gain Armor and Magic Resist.".to_string(),
            trait_type: "Region".to_string(),
            image_url: Some("https://example.com/demacia-trait.jpg".to_string()),
            breakpoints: vec![
                TraitBreakpoint {
                    count: 3,
                    description: "3 units: 12 Armor & MR".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("armor".to_string(), 12.0);
                        map.insert("magic_resist".to_string(), 12.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 5,
                    description: "5 units: 25 Armor & MR".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("armor".to_string(), 25.0);
                        map.insert("magic_resist".to_string(), 25.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 7,
                    description: "7 units: 25 Armor & MR. On Rally, smite enemies for 5% of their max Health.".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("armor".to_string(), 25.0);
                        map.insert("magic_resist".to_string(), 25.0);
                        map.insert("smite_damage".to_string(), 0.05);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 11,
                    description: "11 units: 150 Armor & MR. BATTLE FOR DEMACIA!".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("armor".to_string(), 150.0);
                        map.insert("magic_resist".to_string(), 150.0);
                        map.insert("battle_for_demacia".to_string(), 1.0);
                        map
                    },
                },
            ],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Noxus trait
        let noxus_trait = Trait {
            id: None,
            set_id,
            name: "Noxus".to_string(),
            description: "After the enemy team has lost 15% of their Health, summon Atakhan, Bringer of Ruin. Each Noxian champion's star level increases his power.".to_string(),
            trait_type: "Region".to_string(),
            image_url: Some("https://example.com/noxus-trait.jpg".to_string()),
            breakpoints: vec![
                TraitBreakpoint {
                    count: 3,
                    description: "3 units: He slashes enemies, dealing magic damage.".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("slash_damage".to_string(), 200.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 5,
                    description: "5 units: Noxians get more powerful the longer he is alive.".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("noxian_power_scaling".to_string(), 1.0);
                        map.insert("duration_power".to_string(), 1.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 7,
                    description: "7 units: He drains the souls of enemies on cast.".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("soul_drain".to_string(), 1.0);
                        map.insert("cast_soul_drain".to_string(), 1.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 10,
                    description: "10 units: After 10 seconds, BRING RUIN.".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("bring_ruin_timer".to_string(), 10.0);
                        map.insert("bring_ruin".to_string(), 1.0);
                        map
                    },
                },
            ],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Void trait
        let void_trait = Trait {
            id: None,
            set_id,
            name: "Void".to_string(),
            description: "Gain Mutations that only Void champions can use. Void champions gain Attack Speed.".to_string(),
            trait_type: "Region".to_string(),
            image_url: Some("https://example.com/void-trait.jpg".to_string()),
            breakpoints: vec![
                TraitBreakpoint {
                    count: 2,
                    description: "2 units: 1 Mutation, 8% AS".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("mutations".to_string(), 1.0);
                        map.insert("attack_speed".to_string(), 0.08);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 4,
                    description: "4 units: 2 Mutations, 18% AS".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("mutations".to_string(), 2.0);
                        map.insert("attack_speed".to_string(), 0.18);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 6,
                    description: "6 units: 3 Mutations, 28% AS".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("mutations".to_string(), 3.0);
                        map.insert("attack_speed".to_string(), 0.28);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 9,
                    description: "9 units: Mutations become supercharged, increasing their power by 50%. 35% AS".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("mutations".to_string(), 3.0);
                        map.insert("mutation_power".to_string(), 1.5);
                        map.insert("attack_speed".to_string(), 0.35);
                        map
                    },
                },
            ],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Ionia trait
        let ionia_trait = Trait {
            id: None,
            set_id,
            name: "Ionia".to_string(),
            description: "Ionians follow a Path that grants them different bonuses (Spirit, Generosity, Enlightenment, Transcendence, Precision). Effects include bonus HP, stacking AD/AP on casts, gold from takedowns, XP gains, critical strike mechanics, and more depending on path.".to_string(),
            trait_type: "Region".to_string(),
            image_url: Some("https://example.com/ionia-trait.jpg".to_string()),
            breakpoints: vec![
                TraitBreakpoint {
                    count: 3,
                    description: "3 units: Path bonuses begin to apply (Spirit/Generosity style bonuses)".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("path_bonus".to_string(), 1.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 5,
                    description: "5 units: Additional path bonuses, increased stacking and gold rewards".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("path_bonus".to_string(), 2.0);
                        map.insert("stacking_bonus".to_string(), 1.5);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 7,
                    description: "7 units: Major path bonuses and powerful team effects".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("path_bonus".to_string(), 3.0);
                        map.insert("team_effect".to_string(), 1.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 10,
                    description: "10 units: Grand path: ultimate bonuses and powerful awakenings".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("path_bonus".to_string(), 4.0);
                        map.insert("awakening_bonus".to_string(), 1.0);
                        map
                    },
                },
            ],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Bilgewater trait
        let bilgewater_trait = Trait {
            id: None,
            set_id,
            name: "Bilgewater".to_string(),
            description: "Each round, gain Silver Serpents (Serpents), plus 2 additional for each Bilgewater takedown. Silver Serpents can be spent in the Black Market to grant Bilgewater champions bonus stats and special loot. Higher tiers unlock rarer loot.".to_string(),
            trait_type: "Region".to_string(),
            image_url: Some("https://example.com/bilgewater-trait.jpg".to_string()),
            breakpoints: vec![
                TraitBreakpoint {
                    count: 3,
                    description: "3 units: 18 Serpents".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("serpents".to_string(), 18.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 5,
                    description: "5 units: 30 Serpents, improved loot".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("serpents".to_string(), 30.0);
                        map.insert("loot_quality".to_string(), 1.5);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 7,
                    description: "7 units: 55 Serpents, superior loot".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("serpents".to_string(), 55.0);
                        map.insert("loot_quality".to_string(), 2.0);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 10,
                    description: "10 units: 150 Serpents, 2x stats, FIRE CANNONS!".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("serpents".to_string(), 150.0);
                        map.insert("stat_multiplier".to_string(), 2.0);
                        map.insert("fire_cannons".to_string(), 1.0);
                        map
                    },
                },
            ],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Cultist trait
        let cultist_trait = Trait {
            id: None,
            set_id,
            name: "Cultist".to_string(),
            description: "Cultists gain attack speed and damage during combat. The effect increases as combat continues.".to_string(),
            trait_type: "Story".to_string(),
            image_url: Some("https://example.com/cultist-trait.jpg".to_string()),
            breakpoints: vec![
                TraitBreakpoint {
                    count: 2,
                    description: "2 units: Cultists gain +20% attack speed and +10% damage".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("attack_speed".to_string(), 0.20);
                        map.insert("damage".to_string(), 0.10);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 4,
                    description: "4 units: Cultists gain +45% attack speed and +20% damage".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("attack_speed".to_string(), 0.45);
                        map.insert("damage".to_string(), 0.20);
                        map
                    },
                },
                TraitBreakpoint {
                    count: 6,
                    description: "6 units: Cultists gain +80% attack speed and +35% damage".to_string(),
                    bonuses: {
                        let mut map = HashMap::new();
                        map.insert("attack_speed".to_string(), 0.80);
                        map.insert("damage".to_string(), 0.35);
                        map
                    },
                },
            ],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        traits_collection.insert_many(vec![
            demacia_trait,
            noxus_trait,
            void_trait,
            ionia_trait,
            bilgewater_trait,
            cultist_trait,
        ], None).await?;

        println!("✅ Seeded traits collection with Set 16 traits");
        Ok(())
    }

    async fn seed_champions(&self, set_id: mongodb::bson::oid::ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let champions_collection: Collection<Champion> = self.db.collection("champions");

        // Check if Set 16 champions already exist
        let existing_champions = champions_collection.count_documents(
            mongodb::bson::doc! {"set_id": set_id}, 
            None
        ).await?;

        if existing_champions > 0 {
            println!("⚠️  Set 16 champions already exist ({} found), skipping creation.", existing_champions);
            return Ok(());
        }

        // Kai'Sa - Void, Marksman, Assimilator
        let kaisa = Champion {
            id: None,
            set_id,
            name: "Kai'Sa".to_string(),
            display_name: Some("Daughter of the Void".to_string()),
            cost: 3,
            traits: vec!["Void".to_string(), "Marksman".to_string(), "Assimilator".to_string()],
            stats: ChampionStats {
                health: 700.0,
                mana: 0.0,
                starting_mana: 0.0,
                armor: 25.0,
                magic_resist: 20.0,
                attack_damage: 60.0,
                attack_speed: 0.75,
                attack_range: 4.0,
                crit_chance: 25.0,
                crit_multiplier: 150.0,
            },
            star_scaling: StarScaling {
                two_star: StarMultipliers {
                    health_multiplier: 1.8,
                    damage_multiplier: 1.8,
                },
                three_star: StarMultipliers {
                    health_multiplier: 2.4,
                    damage_multiplier: 2.4,
                },
            },
            ability: ChampionAbility {
                name: "Killer Instinct".to_string(),
                description: "Kai'Sa's ability changes based on whether Attack Damage or Ability Power is higher".to_string(),
                ability_type: "Passive".to_string(),
                targeting: "Self".to_string(),
                damage_type: "Mixed".to_string(),
                scaling: vec![
                    AbilityScaling {
                        star_level: 1,
                        damage: 150.0, // Scales with build
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("adaptive_scaling".to_string(), 1.0);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 2,
                        damage: 225.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("adaptive_scaling".to_string(), 1.0);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 3,
                        damage: 300.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("adaptive_scaling".to_string(), 1.0);
                            map
                        },
                    },
                ],
            },
            image_url: Some("https://example.com/kaisa.jpg".to_string()),
            splash_url: Some("https://example.com/kaisa-splash.jpg".to_string()),
            rarity: "Epic".to_string(),
            release_version: Some("Set16".to_string()),
            is_enabled: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Sylas - Chainbreaker
        let sylas = Champion {
            id: None,
            set_id,
            name: "Sylas".to_string(),
            display_name: Some("The Unshackled".to_string()),
            cost: 3,
            traits: vec!["Chainbreaker".to_string()],
            stats: ChampionStats {
                health: 800.0,
                mana: 100.0,
                starting_mana: 0.0,
                armor: 40.0,
                magic_resist: 30.0,
                attack_damage: 65.0,
                attack_speed: 0.70,
                attack_range: 1.0,
                crit_chance: 25.0,
                crit_multiplier: 150.0,
            },
            star_scaling: StarScaling {
                two_star: StarMultipliers {
                    health_multiplier: 1.8,
                    damage_multiplier: 1.8,
                },
                three_star: StarMultipliers {
                    health_multiplier: 2.4,
                    damage_multiplier: 2.4,
                },
            },
            ability: ChampionAbility {
                name: "Dynamic Ability".to_string(),
                description: "Sylas cycles between 3 different abilities, depending on which one is most useful at the moment. He cannot cast the same one twice in a row.".to_string(),
                ability_type: "Active".to_string(),
                targeting: "Enemies".to_string(),
                damage_type: "Mixed".to_string(),
                scaling: vec![
                    AbilityScaling {
                        star_level: 1,
                        damage: 200.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("ability_rotation".to_string(), 1.0);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 2,
                        damage: 300.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("ability_rotation".to_string(), 1.0);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 3,
                        damage: 400.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("ability_rotation".to_string(), 1.0);
                            map
                        },
                    },
                ],
            },
            image_url: Some("https://example.com/sylas.jpg".to_string()),
            splash_url: Some("https://example.com/sylas-splash.jpg".to_string()),
            rarity: "Epic".to_string(),
            release_version: Some("Set16".to_string()),
            is_enabled: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Azir - Emperor
        let azir = Champion {
            id: None,
            set_id,
            name: "Azir".to_string(),
            display_name: Some("The Emperor of the Sands".to_string()),
            cost: 4,
            traits: vec!["Emperor".to_string()],
            stats: ChampionStats {
                health: 750.0,
                mana: 120.0,
                starting_mana: 0.0,
                armor: 30.0,
                magic_resist: 25.0,
                attack_damage: 45.0,
                attack_speed: 0.85,
                attack_range: 4.0,
                crit_chance: 25.0,
                crit_multiplier: 150.0,
            },
            star_scaling: StarScaling {
                two_star: StarMultipliers {
                    health_multiplier: 1.8,
                    damage_multiplier: 1.8,
                },
                three_star: StarMultipliers {
                    health_multiplier: 2.4,
                    damage_multiplier: 2.4,
                },
            },
            ability: ChampionAbility {
                name: "Strategic Command".to_string(),
                description: "Azir deploys two Guards who can be placed anywhere on the battlefield. They do not move or attack, and die when Azir does.".to_string(),
                ability_type: "Active".to_string(),
                targeting: "Board".to_string(),
                damage_type: "Utility".to_string(),
                scaling: vec![
                    AbilityScaling {
                        star_level: 1,
                        damage: 0.0, // Guardian summoning
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("guards_deployed".to_string(), 2.0);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 2,
                        damage: 0.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("guards_deployed".to_string(), 2.0);
                            map.insert("guard_stats".to_string(), 1.5);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 3,
                        damage: 0.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("guards_deployed".to_string(), 2.0);
                            map.insert("guard_stats".to_string(), 2.0);
                            map
                        },
                    },
                ],
            },
            image_url: Some("https://example.com/azir.jpg".to_string()),
            splash_url: Some("https://example.com/azir-splash.jpg".to_string()),
            rarity: "Epic".to_string(),
            release_version: Some("Set16".to_string()),
            is_enabled: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Aatrox - World Ender
        let aatrox = Champion {
            id: None,
            set_id,
            name: "Aatrox".to_string(),
            display_name: Some("The Darkin Blade".to_string()),
            cost: 5,
            traits: vec!["World Ender".to_string()],
            stats: ChampionStats {
                health: 1000.0,
                mana: 150.0,
                starting_mana: 50.0,
                armor: 50.0,
                magic_resist: 35.0,
                attack_damage: 80.0,
                attack_speed: 0.80,
                attack_range: 1.0,
                crit_chance: 25.0,
                crit_multiplier: 150.0,
            },
            star_scaling: StarScaling {
                two_star: StarMultipliers {
                    health_multiplier: 1.8,
                    damage_multiplier: 1.8,
                },
                three_star: StarMultipliers {
                    health_multiplier: 2.4,
                    damage_multiplier: 2.4,
                },
            },
            ability: ChampionAbility {
                name: "Darkin Resilience".to_string(),
                description: "Aatrox gains Attack Damage equal to his Omnivamp. On first death, he becomes briefly untargetable and heals back to full Health over 2 seconds.".to_string(),
                ability_type: "Passive".to_string(),
                targeting: "Self".to_string(),
                damage_type: "Physical".to_string(),
                scaling: vec![
                    AbilityScaling {
                        star_level: 1,
                        damage: 250.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("omnivamp_scaling".to_string(), 1.0);
                            map.insert("heal_on_death".to_string(), 100.0);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 2,
                        damage: 375.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("omnivamp_scaling".to_string(), 1.0);
                            map.insert("heal_on_death".to_string(), 100.0);
                            map
                        },
                    },
                    AbilityScaling {
                        star_level: 3,
                        damage: 500.0,
                        additional_effects: {
                            let mut map = HashMap::new();
                            map.insert("omnivamp_scaling".to_string(), 1.0);
                            map.insert("heal_on_death".to_string(), 100.0);
                            map
                        },
                    },
                ],
            },
            image_url: Some("https://example.com/aatrox.jpg".to_string()),
            splash_url: Some("https://example.com/aatrox-splash.jpg".to_string()),
            rarity: "Mythic".to_string(),
            release_version: Some("Set16".to_string()),
            is_enabled: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        champions_collection.insert_many(vec![
            kaisa,
            sylas,
            azir,
            aatrox,
        ], None).await?;

        println!("✅ Seeded champions collection with Set 16 champions");
        Ok(())
    }

    async fn seed_items(&self, set_id: mongodb::bson::oid::ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let items_collection: Collection<Item> = self.db.collection("items");

        // Check if Set 16 items already exist
        let existing_items = items_collection.count_documents(
            mongodb::bson::doc! {"set_id": set_id}, 
            None
        ).await?;

        if existing_items > 0 {
            println!("⚠️  Set 16 items already exist ({} found), skipping creation.", existing_items);
            return Ok(());
        }

        let bloodthirster = Item {
            id: None,
            set_id,
            name: "Bloodthirster".to_string(),
            description: "Grants bonus Attack Damage and Life Steal. Critical strikes heal for a percentage of damage dealt".to_string(),
            item_type: "Completed".to_string(),
            category: "AD".to_string(),
            stats: ItemStats {
                attack_damage: Some(30.0),
                ability_power: None,
                attack_speed: None,
                crit_chance: Some(20.0),
                health: None,
                armor: None,
                magic_resist: Some(30.0),
                mana: None,
            },
            effects: vec![
                ItemEffect {
                    effect_type: "Lifesteal".to_string(),
                    description: "Heal for 30% of damage dealt".to_string(),
                    value: Some(30.0),
                    duration: None,
                    cooldown: None,
                }
            ],
            priority: 1,
            is_unique: true,
            is_radiant: false,
            image_url: Some("https://example.com/bloodthirster.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let infinity_edge = Item {
            id: None,
            set_id,
            name: "Infinity Edge".to_string(),
            description: "Grants Attack Damage and Critical Strike Chance. Bonus Critical Strike Damage".to_string(),
            item_type: "Completed".to_string(),
            category: "AD".to_string(),
            stats: ItemStats {
                attack_damage: Some(75.0),
                ability_power: None,
                attack_speed: None,
                crit_chance: Some(75.0),
                health: None,
                armor: None,
                magic_resist: None,
                mana: None,
            },
            effects: vec![
                ItemEffect {
                    effect_type: "Crit Damage".to_string(),
                    description: "Critical strikes deal 100% bonus damage".to_string(),
                    value: Some(100.0),
                    duration: None,
                    cooldown: None,
                }
            ],
            priority: 1,
            is_unique: true,
            is_radiant: false,
            image_url: Some("https://example.com/infinity_edge.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        items_collection.insert_many(vec![
            bloodthirster,
            infinity_edge,
        ], None).await?;

        println!("✅ Seeded items collection with Set 16 items");
        Ok(())
    }

    async fn seed_augments(&self, set_id: mongodb::bson::oid::ObjectId) -> Result<(), Box<dyn std::error::Error>> {
        let augments_collection: Collection<Augment> = self.db.collection("augments");

        // Check if Set 16 augments already exist
        let existing_augments = augments_collection.count_documents(
            mongodb::bson::doc! {"set_id": set_id}, 
            None
        ).await?;

        if existing_augments > 0 {
            println!("⚠️  Set 16 augments already exist ({} found), skipping creation.", existing_augments);
            return Ok(());
        }

        // Team-Up Augments (Returning from previous sets)
        let demacia_valor = Augment {
            id: None,
            set_id,
            name: "Demacia: Valor".to_string(),
            description: "The chosen Demacian gains 50% bonus damage and 50% bonus health. While this champion is alive, all of your Demacians gain 20% bonus damage.".to_string(),
            augment_type: "Gold".to_string(), // Tier 2
            category: "Champion".to_string(),
            tier: 2,
            hero_champion: None,
            effects: vec![
                AugmentEffect {
                    effect_type: "Damage Bonus".to_string(),
                    description: "Chosen Demacian gains 50% bonus damage and health".to_string(),
                    value: Some(0.50),
                    is_percentage: true,
                },
                AugmentEffect {
                    effect_type: "Ally Damage Bonus".to_string(),
                    description: "All Demacians gain 20% bonus damage".to_string(),
                    value: Some(0.20),
                    is_percentage: true,
                }
            ],
            winrate_impact: Some(0.15),
            pick_rate: Some(0.25),
            is_enabled: true,
            image_url: Some("https://example.com/demacia-valor.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let void_corruption = Augment {
            id: None,
            set_id,
            name: "Void: Corruption".to_string(),
            description: "Void units gain 25% bonus attack damage and ability power. When they score a takedown, their next ability cost is reduced by 20 mana.".to_string(),
            augment_type: "Gold".to_string(), // Tier 2
            category: "Synergy".to_string(),
            tier: 2,
            hero_champion: None,
            effects: vec![
                AugmentEffect {
                    effect_type: "Stat Bonus".to_string(),
                    description: "Void units gain 25% bonus AD and AP".to_string(),
                    value: Some(0.25),
                    is_percentage: true,
                },
                AugmentEffect {
                    effect_type: "Mana Reduction".to_string(),
                    description: "After takedowns, next ability cost reduced by 20".to_string(),
                    value: Some(20.0),
                    is_percentage: false,
                }
            ],
            winrate_impact: Some(0.12),
            pick_rate: Some(0.23),
            is_enabled: true,
            image_url: Some("https://example.com/void-corruption.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // New Ascendant Charms (specific to Set 16)
        let ascendant_charm = Augment {
            id: None,
            set_id,
            name: "Ascendant Charm".to_string(),
            description: "After each combat, an Ascendant Charm appears in your shop. These are powerful effects that can be bought for gold.".to_string(),
            augment_type: "Prismatic".to_string(), // Tier 3
            category: "Economy".to_string(),
            tier: 3,
            hero_champion: None,
            effects: vec![
                AugmentEffect {
                    effect_type: "Shop Mechanic".to_string(),
                    description: "Receive Ascendant Charm after each combat".to_string(),
                    value: Some(1.0),
                    is_percentage: false,
                }
            ],
            winrate_impact: Some(0.08),
            pick_rate: Some(0.35),
            is_enabled: true,
            image_url: Some("https://example.com/ascendant-charm.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Region-specific augments
        let bilgewater_black_market = Augment {
            id: None,
            set_id,
            name: "Bilgewater: Black Market".to_string(),
            description: "Each round, gain Silver Serpents that can be spent in the Black Market for Bilgewater champions' stat bonuses and special loot.".to_string(),
            augment_type: "Gold".to_string(), // Tier 2
            category: "Economy".to_string(),
            tier: 2,
            hero_champion: None,
            effects: vec![
                AugmentEffect {
                    effect_type: "Resource Generation".to_string(),
                    description: "Gain Silver Serpents each round for Black Market purchases".to_string(),
                    value: Some(1.0),
                    is_percentage: false,
                }
            ],
            winrate_impact: Some(0.10),
            pick_rate: Some(0.20),
            is_enabled: true,
            image_url: Some("https://example.com/bilgewater-black-market.jpg".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        augments_collection.insert_many(vec![
            demacia_valor,
            void_corruption,
            ascendant_charm,
            bilgewater_black_market,
        ], None).await?;

        println!("✅ Seeded augments collection with Set 16 augments");
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();

    // Load environment variables
    dotenv().ok();
    
    let db_url = env::var("MONGODB_URL").unwrap_or("mongodb://localhost:27017".to_string());
    let db_name = env::var("DATABASE_NAME").unwrap_or("tft_bible_dev".to_string());

    println!("🔗 Connecting to MongoDB at: {}", db_url);

    // Parse the connection string
    let client_options = ClientOptions::parse(&db_url).await?;
    let client = Client::with_options(client_options)?;

    // Test database connection
    client.database("admin").run_command(mongodb::bson::doc! { "ping": 1 }, None).await?;
    println!("✅ Connected to MongoDB");

    // Get the database
    let db = client.database(&db_name);
    println!("📋 Using database: {}", db_name);

    // Create seeder and run Set 16 seeding
    let seeder = DatabaseSeeder::new(db);
    seeder.seed_set16().await?;

    println!("🎯 Manual seeding completed successfully!");
    Ok(())
}