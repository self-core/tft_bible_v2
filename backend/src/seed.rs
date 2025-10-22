use mongodb::Database;
use bson::doc;


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
        let sets_collection = self.db.collection::<mongodb::bson::Document>("sets");

        let set_doc = doc! {
            "name": "Set 11",
            "version": "13.19",
            "release_date": bson::DateTime::now(),
            "is_active": true,
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        sets_collection.insert_one(set_doc).await?;

        println!("✅ Seeded sets collection");
        Ok(())
    }

    async fn seed_traits(&self) -> Result<(), Box<dyn std::error::Error>> {
        let traits_collection = self.db.collection::<mongodb::bson::Document>("traits");

        let assassin_trait = doc! {
            "name": "Assassin",
            "trait_type": "Assassin",
            "description": "Assassins leap to the lowest health enemy at the start of combat",
            "image_url": "https://example.com/assassin-trait.jpg",
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        let bruiser_trait = doc! {
            "name": "Bruiser",
            "trait_type": "Bruiser",
            "description": "Bruisers gain bonus health",
            "image_url": "https://example.com/bruiser-trait.jpg",
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        traits_collection.insert_one(assassin_trait).await?;
        traits_collection.insert_one(bruiser_trait).await?;

        println!("✅ Seeded traits collection");
        Ok(())
    }

    async fn seed_champions(&self) -> Result<(), Box<dyn std::error::Error>> {
        let champions_collection = self.db.collection("champions");

        let ahri = doc! {
            "name": "Ahri",
            "cost": 2,
            "traits": ["Sorcerer", "Assassin"],
            "health": [650, 1170, 2106],
            "mana": [0, 40, 100],
            "armor": 20,
            "magic_resist": 20,
            "attack_damage": [40, 72, 129],
            "attack_speed": 0.75,
            "range": 3,
            "ability_name": "Orb of Deception",
            "ability_description": "Ahri fires an orb that deals magic damage and returns to her, dealing damage again",
            "mana_cost": 75,
            "mana_start": 0,
            "rarity": "Common",
            "is_enabled": true,
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        let sett = doc! {
            "name": "Sett",
            "cost": 3,
            "traits": ["Bruiser", "Duelist"],
            "health": [800, 1440, 2592],
            "mana": [0, 50, 125],
            "armor": 40,
            "magic_resist": 40,
            "attack_damage": [60, 108, 194],
            "attack_speed": 0.7,
            "range": 1,
            "ability_name": "Showstopper",
            "ability_description": "Sett shields himself and pulls the farthest enemy to him, stunning them",
            "mana_cost": 100,
            "mana_start": 0,
            "rarity": "Rare",
            "is_enabled": true,
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        champions_collection.insert_one(ahri).await?;
        champions_collection.insert_one(sett).await?;

        println!("✅ Seeded champions collection");
        Ok(())
    }

    async fn seed_items(&self) -> Result<(), Box<dyn std::error::Error>> {
        let items_collection = self.db.collection("items");

        let bloodthirster = doc! {
            "name": "Bloodthirster",
            "category": "Fighter",
            "tier": 3,
            "attack_damage": 55,
            "crit_chance": 25.0,
            "effects": [
                {
                    "effect_type": "Lifesteal",
                    "value": 25.0,
                    "description": "Heal for 25% of damage dealt"
                }
            ],
            "is_radiant": false,
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        let infinity_edge = doc! {
            "name": "Infinity Edge",
            "category": "Assassin",
            "tier": 3,
            "attack_damage": 75,
            "crit_chance": 75.0,
            "effects": [
                {
                    "effect_type": "Crit Damage",
                    "value": 100.0,
                    "description": "Critical strikes deal 100% bonus damage"
                }
            ],
            "is_radiant": false,
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        items_collection.insert_one(bloodthirster).await?;
        items_collection.insert_one(infinity_edge).await?;

        println!("✅ Seeded items collection");
        Ok(())
    }

    async fn seed_augments(&self) -> Result<(), Box<dyn std::error::Error>> {
        let augments_collection = self.db.collection("augments");

        let assassin_heart = doc! {
            "name": "Assassin Heart",
            "tier": 1,
            "effect_type": "Trait Bonus",
            "description": "Your team counts as having 1 additional Assassin",
            "value": 1.0,
            "stage": 1,
            "is_hero_augment": false,
            "is_prismatic": false,
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        let bruiser_heart = doc! {
            "name": "Bruiser Heart",
            "tier": 1,
            "effect_type": "Trait Bonus",
            "description": "Your team counts as having 1 additional Bruiser",
            "value": 1.0,
            "stage": 1,
            "is_hero_augment": false,
            "is_prismatic": false,
            "created_at": bson::DateTime::now(),
            "updated_at": bson::DateTime::now(),
        };

        augments_collection.insert_one(assassin_heart).await?;
        augments_collection.insert_one(bruiser_heart).await?;

        println!("✅ Seeded augments collection");
        Ok(())
    }
}