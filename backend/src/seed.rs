use mongodb::Database;
use mongodb::bson::Document;
use mongodb::Collection;
use serde::{Deserialize, Serialize};
use bson::doc;

#[derive(Debug, Serialize, Deserialize)]
pub struct Set {
    pub name: String,
    pub version: String,
    pub release_date: bson::DateTime,
    pub is_active: bool,
    pub created_at: bson::DateTime,
    pub updated_at: bson::DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Trait {
    pub name: String,
    pub trait_type: String,
    pub description: String,
    pub image_url: String,
    pub created_at: bson::DateTime,
    pub updated_at: bson::DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Champion {
    pub name: String,
    pub cost: i32,
    pub traits: Vec<String>,
    pub health: Vec<i32>,
    pub mana: Vec<i32>,
    pub armor: i32,
    pub magic_resist: i32,
    pub attack_damage: Vec<i32>,
    pub attack_speed: f64,
    pub range: i32,
    pub ability_name: String,
    pub ability_description: String,
    pub mana_cost: i32,
    pub mana_start: i32,
    pub rarity: String,
    pub is_enabled: bool,
    pub created_at: bson::DateTime,
    pub updated_at: bson::DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemEffect {
    pub effect_type: String,
    pub value: f64,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Item {
    pub name: String,
    pub category: String,
    pub tier: i32,
    pub attack_damage: Option<i32>,
    pub crit_chance: Option<f64>,
    pub effects: Vec<ItemEffect>,
    pub is_radiant: bool,
    pub created_at: bson::DateTime,
    pub updated_at: bson::DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Augment {
    pub name: String,
    pub tier: i32,
    pub effect_type: String,
    pub description: String,
    pub value: f64,
    pub stage: i32,
    pub is_hero_augment: bool,
    pub is_prismatic: bool,
    pub created_at: bson::DateTime,
    pub updated_at: bson::DateTime,
}

pub struct DatabaseSeeder {
    db: Database,
}

impl DatabaseSeeder {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn seed_all(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("🌱 Starting database seeding...");

        // Seed in order of dependencies
        self.seed_sets().await?;
        self.seed_traits().await?;
        self.seed_champions().await?;
        self.seed_items().await?;
        self.seed_augments().await?;

        println!("✅ Database seeding completed successfully!");
        Ok(())
    }

    async fn seed_sets(&self) -> Result<(), Box<dyn std::error::Error>> {
        let sets_collection: Collection<Set> = self.db.collection("sets");

        let set_doc = Set {
            name: "Set 11".to_string(),
            version: "13.19".to_string(),
            release_date: bson::DateTime::now(),
            is_active: true,
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        sets_collection.insert_one(set_doc).await?;

        println!("✅ Seeded sets collection");
        Ok(())
    }

    async fn seed_traits(&self) -> Result<(), Box<dyn std::error::Error>> {
        let traits_collection: Collection<Trait> = self.db.collection("traits");

        let assassin_trait = Trait {
            name: "Assassin".to_string(),
            trait_type: "Assassin".to_string(),
            description: "Assassins leap to the lowest health enemy at the start of combat".to_string(),
            image_url: "https://example.com/assassin-trait.jpg".to_string(),
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        let bruiser_trait = Trait {
            name: "Bruiser".to_string(),
            trait_type: "Bruiser".to_string(),
            description: "Bruisers gain bonus health".to_string(),
            image_url: "https://example.com/bruiser-trait.jpg".to_string(),
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        traits_collection.insert_one(assassin_trait).await?;
        traits_collection.insert_one(bruiser_trait).await?;

        println!("✅ Seeded traits collection");
        Ok(())
    }

    async fn seed_champions(&self) -> Result<(), Box<dyn std::error::Error>> {
        let champions_collection: Collection<Champion> = self.db.collection("champions");

        let ahri = Champion {
            name: "Ahri".to_string(),
            cost: 2,
            traits: vec!["Sorcerer".to_string(), "Assassin".to_string()],
            health: vec![650, 1170, 2106],
            mana: vec![0, 40, 100],
            armor: 20,
            magic_resist: 20,
            attack_damage: vec![40, 72, 129],
            attack_speed: 0.75,
            range: 3,
            ability_name: "Orb of Deception".to_string(),
            ability_description: "Ahri fires an orb that deals magic damage and returns to her, dealing damage again".to_string(),
            mana_cost: 75,
            mana_start: 0,
            rarity: "Common".to_string(),
            is_enabled: true,
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        let sett = Champion {
            name: "Sett".to_string(),
            cost: 3,
            traits: vec!["Bruiser".to_string(), "Duelist".to_string()],
            health: vec![800, 1440, 2592],
            mana: vec![0, 50, 125],
            armor: 40,
            magic_resist: 40,
            attack_damage: vec![60, 108, 194],
            attack_speed: 0.7,
            range: 1,
            ability_name: "Showstopper".to_string(),
            ability_description: "Sett shields himself and pulls the farthest enemy to him, stunning them".to_string(),
            mana_cost: 100,
            mana_start: 0,
            rarity: "Rare".to_string(),
            is_enabled: true,
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        champions_collection.insert_one(ahri).await?;
        champions_collection.insert_one(sett).await?;

        println!("✅ Seeded champions collection");
        Ok(())
    }

    async fn seed_items(&self) -> Result<(), Box<dyn std::error::Error>> {
        let items_collection: Collection<Item> = self.db.collection("items");

        let bloodthirster = Item {
            name: "Bloodthirster".to_string(),
            category: "Fighter".to_string(),
            tier: 3,
            attack_damage: Some(55),
            crit_chance: Some(25.0),
            effects: vec![
                ItemEffect {
                    effect_type: "Lifesteal".to_string(),
                    value: 25.0,
                    description: "Heal for 25% of damage dealt".to_string(),
                }
            ],
            is_radiant: false,
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        let infinity_edge = Item {
            name: "Infinity Edge".to_string(),
            category: "Assassin".to_string(),
            tier: 3,
            attack_damage: Some(75),
            crit_chance: Some(75.0),
            effects: vec![
                ItemEffect {
                    effect_type: "Crit Damage".to_string(),
                    value: 100.0,
                    description: "Critical strikes deal 100% bonus damage".to_string(),
                }
            ],
            is_radiant: false,
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        items_collection.insert_one(bloodthirster).await?;
        items_collection.insert_one(infinity_edge).await?;

        println!("✅ Seeded items collection");
        Ok(())
    }

    async fn seed_augments(&self) -> Result<(), Box<dyn std::error::Error>> {
        let augments_collection: Collection<Augment> = self.db.collection("augments");

        let assassin_heart = Augment {
            name: "Assassin Heart".to_string(),
            tier: 1,
            effect_type: "Trait Bonus".to_string(),
            description: "Your team counts as having 1 additional Assassin".to_string(),
            value: 1.0,
            stage: 1,
            is_hero_augment: false,
            is_prismatic: false,
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        let bruiser_heart = Augment {
            name: "Bruiser Heart".to_string(),
            tier: 1,
            effect_type: "Trait Bonus".to_string(),
            description: "Your team counts as having 1 additional Bruiser".to_string(),
            value: 1.0,
            stage: 1,
            is_hero_augment: false,
            is_prismatic: false,
            created_at: bson::DateTime::now(),
            updated_at: bson::DateTime::now(),
        };

        augments_collection.insert_one(assassin_heart).await?;
        augments_collection.insert_one(bruiser_heart).await?;

        println!("✅ Seeded augments collection");
        Ok(())
    }
}