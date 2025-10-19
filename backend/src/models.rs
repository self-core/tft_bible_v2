use bson::{oid::ObjectId, DateTime};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Set {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    #[serde(rename = "shortName")]
    pub short_name: String,
    pub version: String,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "releaseDate")]
    pub release_date: DateTime,
    #[serde(rename = "endDate")]
    pub end_date: Option<DateTime>,
    pub description: Option<String>,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trait {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub trait_type: String, // "Origin", "Class", "Unique"
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    pub breakpoints: Vec<TraitBreakpoint>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TraitBreakpoint {
    pub count: u32,
    pub description: String,
    pub bonuses: HashMap<String, f64>, // Flexible stat bonuses
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Champion {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub cost: u32, // 1-5
    pub traits: Vec<String>,
    pub stats: ChampionStats,
    #[serde(rename = "starScaling")]
    pub star_scaling: StarScaling,
    pub ability: ChampionAbility,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "splashUrl")]
    pub splash_url: Option<String>,
    pub rarity: String,
    #[serde(rename = "releaseVersion")]
    pub release_version: Option<String>,
    #[serde(rename = "isEnabled")]
    pub is_enabled: bool,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChampionStats {
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StarScaling {
    #[serde(rename = "twoStar")]
    pub two_star: StarMultipliers,
    #[serde(rename = "threeStar")]
    pub three_star: StarMultipliers,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StarMultipliers {
    #[serde(rename = "healthMultiplier")]
    pub health_multiplier: f64,
    #[serde(rename = "damageMultiplier")]
    pub damage_multiplier: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChampionAbility {
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub ability_type: String, // "Active", "Passive", "Transform"
    pub targeting: String,     // "Enemies", "Allies", "Self"
    #[serde(rename = "damageType")]
    pub damage_type: String,   // "Physical", "Magic", "True"
    pub scaling: Vec<AbilityScaling>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AbilityScaling {
    #[serde(rename = "starLevel")]
    pub star_level: u32,
    pub damage: f64,
    #[serde(rename = "additionalEffects")]
    pub additional_effects: HashMap<String, f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Item {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub item_type: String, // "Component", "Completed", "Radiant", "Artifact"
    pub category: String,  // "AD", "AP", "Tank", "Utility"
    pub stats: ItemStats,
    pub recipe: Option<ItemRecipe>,
    #[serde(rename = "buildsInto")]
    pub builds_into: Vec<ObjectId>,
    pub effects: Vec<ItemEffect>,
    pub priority: u32,
    #[serde(rename = "isUnique")]
    pub is_unique: bool,
    #[serde(rename = "isRadiant")]
    pub is_radiant: bool,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemStats {
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemRecipe {
    pub component1: ObjectId,
    pub component2: ObjectId,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemEffect {
    #[serde(rename = "type")]
    pub effect_type: String, // "OnAttack", "OnCast", "Passive"
    pub description: String,
    pub value: Option<f64>,
    pub duration: Option<f64>,
    pub cooldown: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Augment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub augment_type: String, // "Silver", "Gold", "Prismatic"
    pub category: String,      // "Combat", "Economy", "Synergy", "Hero"
    pub tier: u32,            // 1 = Silver, 2 = Gold, 3 = Prismatic
    #[serde(rename = "heroChampion")]
    pub hero_champion: Option<HeroChampion>,
    pub effects: Vec<AugmentEffect>,
    #[serde(rename = "winrateImpact")]
    pub winrate_impact: Option<f64>,
    #[serde(rename = "pickRate")]
    pub pick_rate: Option<f64>,
    #[serde(rename = "isEnabled")]
    pub is_enabled: bool,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HeroChampion {
    #[serde(rename = "championId")]
    pub champion_id: ObjectId,
    #[serde(rename = "starLevel")]
    pub star_level: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AugmentEffect {
    #[serde(rename = "type")]
    pub effect_type: String, // "StatBonus", "GoldGain", "ItemGrant"
    pub description: String,
    pub value: Option<f64>,
    #[serde(rename = "isPercentage")]
    pub is_percentage: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Composition {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    #[serde(rename = "authorId")]
    pub author_id: Option<ObjectId>,

    // Basic info
    pub name: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,

    // Champions and items
    pub champions: Vec<CompositionChampion>,
    pub augments: CompositionAugments,
    pub positioning: Option<PositioningStrategy>,
    pub gameplan: Option<GamePlan>,

    // Meta information
    pub meta: CompositionMeta,
    pub matchups: Option<Matchups>,

    // Community features
    pub votes: Votes,
    pub views: u32,
    pub favorites: u32,
    pub comments: Vec<ObjectId>,

    // Moderation
    #[serde(rename = "isPublic")]
    pub is_public: bool,
    #[serde(rename = "isVerified")]
    pub is_verified: bool,
    #[serde(rename = "isFeatured")]
    pub is_featured: bool,

    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionChampion {
    #[serde(rename = "championId")]
    pub champion_id: ObjectId,
    #[serde(rename = "starLevel")]
    pub star_level: u32,
    pub items: Vec<ObjectId>,
    pub position: Position,
    pub priority: u32,
    #[serde(rename = "isCore")]
    pub is_core: bool,
    pub alternatives: Vec<ObjectId>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: u32, // 0-6
    pub y: u32, // 0-3
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionAugments {
    pub preferred: Vec<ObjectId>,
    pub acceptable: Vec<ObjectId>,
    pub avoid: Vec<ObjectId>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PositioningStrategy {
    pub strategy: String,
    pub description: String,
    pub variations: Vec<PositioningVariation>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PositioningVariation {
    pub name: String,
    pub description: String,
    #[serde(rename = "modifiedPositions")]
    pub modified_positions: Vec<ModifiedPosition>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModifiedPosition {
    #[serde(rename = "championId")]
    pub champion_id: ObjectId,
    #[serde(rename = "newPosition")]
    pub new_position: Position,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GamePlan {
    pub early: GamePhase,
    pub mid: GamePhase,
    pub late: GamePhase,
}

//#[derive(Debug, Serialize, Deserialize,
// src/models.rs
use bson::{oid::ObjectId, DateTime};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Custom serialization for ObjectId and DateTime to handle serde issues
mod serde_helpers {
    use bson::{oid::ObjectId, DateTime};
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize_object_id<S>(oid: &Option<ObjectId>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match oid {
            Some(oid) => serializer.serialize_str(&oid.to_hex()),
            None => serializer.serialize_none(),
        }
    }

    pub fn deserialize_object_id<'de, D>(deserializer: D) -> Result<Option<ObjectId>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: Option<String> = Option::deserialize(deserializer)?;
        match s {
            Some(s) => ObjectId::parse_str(&s)
                .map(Some)
                .map_err(serde::de::Error::custom),
            None => Ok(None),
        }
    }

    pub fn serialize_datetime<S>(dt: &DateTime, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i64(dt.timestamp_millis())
    }

    pub fn deserialize_datetime<'de, D>(deserializer: D) -> Result<DateTime, D::Error>
    where
        D: Deserializer<'de>,
    {
        let timestamp: i64 = i64::deserialize(deserializer)?;
        Ok(DateTime::from_millis(timestamp))
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GamePhase {
    pub description: String,
    #[serde(rename = "levelingPattern")]
    pub leveling_pattern: String,
    #[serde(rename = "keyItems")]
    pub key_items: Vec<ObjectId>,
    #[serde(rename = "transitionTriggers")]
    pub transition_triggers: Vec<String>,
    #[serde(rename = "pivotOptions")]
    pub pivot_options: Vec<ObjectId>,
    #[serde(rename = "keyPowerSpikes")]
    pub key_power_spikes: Vec<String>,
    #[serde(rename = "winCondition")]
    pub win_condition: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionMeta {
    pub tier: String,        // "S", "A", "B", "C", "D"
    pub difficulty: u32,     // 1-5 scale
    pub cost: String,        // "Budget", "Expensive", "Flexible"
    pub patch: String,       // "15.23" for Set 15
    pub playstyle: String,   // "Aggressive", "Greedy", "Flexible"

    // Performance metrics
    pub winrate: f64,        // 0.0 - 1.0
    #[serde(rename = "avgPlacement")]
    pub avg_placement: f64,  // 1.0 - 8.0
    pub playrate: f64,       // How popular the comp is
    #[serde(rename = "contestRate")]
    pub contest_rate: f64,   // How often it's contested

    // Set 15 specific fields
    pub set_version: String, // "15" for Set 15
    pub min_round: Option<u32>, // Minimum round this comp becomes viable
    pub max_round: Option<u32>, // Round where comp peaks
    pub econ_type: Option<String>, // "Early", "Mid", "Late", "All"
    pub positioning_style: Option<String>, // "Frontline", "Backline", "Split"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Matchups {
    pub favorable: Vec<Matchup>,
    pub unfavorable: Vec<Matchup>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Matchup {
    #[serde(rename = "compName")]
    pub comp_name: String,
    pub reason: String,
    pub confidence: f64, // 0.0 - 1.0
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Votes {
    pub upvotes: u32,
    pub downvotes: u32,
}



#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Comment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "compositionId")]
    pub composition_id: ObjectId,
    #[serde(rename = "authorId")]
    pub author_id: ObjectId,
    #[serde(rename = "parentCommentId")]
    pub parent_comment_id: Option<ObjectId>,

    pub content: String,
    pub votes: Votes,

    #[serde(rename = "isDeleted")]
    pub is_deleted: bool,
    #[serde(rename = "isEdited")]
    pub is_edited: bool,
    #[serde(rename = "editedAt")]
    pub edited_at: Option<DateTime>,

    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
}

// API Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct CompositionQuery {
    pub set: Option<String>,
    pub tier: Option<String>,
    pub category: Option<String>,
    pub champion: Option<String>,
    pub difficulty: Option<u32>,
    pub patch: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<u64>,
    pub sort_by: Option<String>, // "popularity", "tier", "newest", "winrate"
    pub tags: Option<String>,    // Comma-separated tags
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
    #[serde(rename = "type")]
    pub search_type: Option<String>, // "compositions", "champions", "items"
    pub limit: Option<i64>,
    pub set_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChampionQuery {
    pub set: Option<String>,
    pub cost: Option<u32>,
    pub traits: Option<String>, // Comma-separated traits
    pub limit: Option<i64>,
    pub search: Option<String>, // Name search
}

#[derive(Debug, Deserialize)]
pub struct ItemQuery {
    pub set: Option<String>,
    pub category: Option<String>,
    #[serde(rename = "type")]
    pub item_type: Option<String>,
    pub limit: Option<i64>,
    pub search: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AugmentQuery {
    pub set: Option<String>,
    pub tier: Option<u32>,
    pub category: Option<String>,
    #[serde(rename = "type")]
    pub augment_type: Option<String>,
    pub limit: Option<i64>,
    pub hero_champion: Option<String>,
}

// API Response DTOs
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub errors: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct HealthCheck {
    pub status: String,
    pub timestamp: DateTime,
    pub version: String,
    pub database: String,
    pub uptime: u64,
}

#[derive(Debug, Serialize)]
pub struct CompositionSummary {
    pub id: ObjectId,
    pub name: String,
    pub category: String,
    pub tier: String,
    pub difficulty: u32,
    pub winrate: f64,
    pub views: u32,
    pub upvotes: u32,
    pub author: Option<String>,
    pub champion_count: u32,
    pub main_champions: Vec<String>, // Top 3 champion names
    pub created_at: DateTime,
}

#[derive(Debug, Serialize)]
pub struct ChampionSummary {
    pub id: ObjectId,
    pub name: String,
    pub cost: u32,
    pub traits: Vec<String>,
    pub health: f64,
    pub attack_damage: f64,
    pub ability_name: String,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ItemSummary {
    pub id: ObjectId,
    pub name: String,
    pub category: String,
    pub item_type: String,
    pub description: String,
    pub is_unique: bool,
    pub priority: u32,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TraitSummary {
    pub id: ObjectId,
    pub name: String,
    pub trait_type: String,
    pub description: String,
    pub breakpoints: Vec<u32>, // Just the counts
    pub image_url: Option<String>,
}

// Create/Update DTOs
#[derive(Debug, Deserialize)]
pub struct CreateCompositionRequest {
    pub name: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub champions: Vec<CompositionChampion>,
    pub augments: CompositionAugments,
    pub positioning: Option<PositioningStrategy>,
    pub gameplan: Option<GamePlan>,
    pub meta: CompositionMeta,
    pub is_public: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCompositionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub champions: Option<Vec<CompositionChampion>>,
    pub augments: Option<CompositionAugments>,
    pub positioning: Option<PositioningStrategy>,
    pub gameplan: Option<GamePlan>,
    pub meta: Option<CompositionMeta>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct VoteRequest {
    pub vote_type: String, // "upvote" or "downvote"
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
    pub parent_comment_id: Option<ObjectId>,
}

// Validation traits
impl CreateCompositionRequest {
    pub fn validate(&self) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();

        if self.name.trim().is_empty() {
            errors.push("Name cannot be empty".to_string());
        }

        if self.name.len() > 100 {
            errors.push("Name cannot exceed 100 characters".to_string());
        }

        if self.description.len() > 5000 {
            errors.push("Description cannot exceed 5000 characters".to_string());
        }

        if self.champions.is_empty() {
            errors.push("Composition must have at least one champion".to_string());
        }

        if self.champions.len() > 10 {
            errors.push("Composition cannot have more than 10 champions".to_string());
        }

        // Validate champion positions are within board bounds
        for champ in &self.champions {
            if champ.position.x > 6 || champ.position.y > 3 {
                errors.push(format!("Invalid position for champion: ({}, {})", champ.position.x, champ.position.y));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Set {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none", serialize_with = "serde_helpers::serialize_object_id", deserialize_with = "serde_helpers::deserialize_object_id")]
    pub id: Option<ObjectId>,
    pub name: String,        // "TFT Set 15: Cinder"
    #[serde(rename = "shortName")]
    pub short_name: String,  // "Set 15"
    pub version: String,     // "15.23"
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "releaseDate", serialize_with = "serde_helpers::serialize_datetime", deserialize_with = "serde_helpers::deserialize_datetime")]
    pub release_date: DateTime,
    #[serde(rename = "endDate", serialize_with = "serde_helpers::serialize_datetime", deserialize_with = "serde_helpers::deserialize_datetime")]
    pub end_date: Option<DateTime>,
    pub description: Option<String>,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,

    // Set 15 specific fields
    pub theme: String,       // "K.O Colosseum" for Set 15
    pub total_champions: u32,
    pub total_traits: u32,
    pub total_items: u32,
    pub total_augments: u32,
    pub board_size: (u32, u32), // (7, 4) for standard TFT board, can expand to (8, 4) with items
    pub max_level: u32,      // Usually 10 (corrected from 9)
    pub interest_cap: u32,   // Usually 10
    pub champion_pool: ChampionPool, // Champion availability by tier
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trait {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub trait_type: String, // "Origin", "Class", "Unique"
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    pub breakpoints: Vec<TraitBreakpoint>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,

    // Set 15 specific fields
    pub set_number: u32,           // 15 for Set 15
    pub trait_category: String,    // "Origin", "Class", "Special" (corrected from "Unique")
    pub is_unique_trait: bool,     // Whether this is a special/unique trait
    pub champion_count: u32,       // Total champions with this trait
    pub max_bonus_count: u32,      // Maximum breakpoint count
    pub tier_progression: Vec<String>, // ["Bronze", "Silver", "Gold", "Prismatic"] - mostly origins
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TraitBreakpoint {
    pub count: u32,
    pub description: String,
    pub bonuses: HashMap<String, f64>, // Flexible stat bonuses
    pub style: String, // "Bronze", "Silver", "Gold", "Prismatic"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChampionPool {
    pub tier_1_copies: u32, // 22 copies
    pub tier_2_copies: u32, // 20 copies
    pub tier_3_copies: u32, // 17 copies
    pub tier_4_copies: u32, // 10 copies
    pub tier_5_copies: u32, // 9 copies
    pub shared_pool: bool, // true (shared between 8 players)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChampionUpgrade {
    pub copies_needed: u32, // 3 for 2-star, 9 for 3-star
    pub star_level: u32,    // 2 or 3
    pub gold_cost: u32,     // Cost to upgrade
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Champion {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub cost: u32, // 1-5
    pub traits: Vec<String>,
    pub stats: ChampionStats,
    #[serde(rename = "starScaling")]
    pub star_scaling: StarScaling,
    pub ability: ChampionAbility,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "splashUrl")]
    pub splash_url: Option<String>,
    pub rarity: String,
    #[serde(rename = "releaseVersion")]
    pub release_version: Option<String>,
    #[serde(rename = "isEnabled")]
    pub is_enabled: bool,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,

    // Set 15 specific fields - simplified for composition focus
    pub set_number: u32,           // 15 for Set 15
    pub is_new: bool,              // Whether this champion is new to Set 15
    pub is_rework: bool,           // Whether this champion was reworked
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChampionStats {
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StarScaling {
    #[serde(rename = "twoStar")]
    pub two_star: StarMultipliers,
    #[serde(rename = "threeStar")]
    pub three_star: StarMultipliers,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StarMultipliers {
    #[serde(rename = "healthMultiplier")]
    pub health_multiplier: f64,
    #[serde(rename = "damageMultiplier")]
    pub damage_multiplier: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChampionAbility {
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub ability_type: String, // "Active", "Passive", "Transform"
    pub targeting: String,     // "Enemies", "Allies", "Self"
    #[serde(rename = "damageType")]
    pub damage_type: String,   // "Physical", "Magic", "True"
    pub scaling: Vec<AbilityScaling>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AbilityScaling {
    #[serde(rename = "starLevel")]
    pub star_level: u32,
    pub damage: f64,
    #[serde(rename = "additionalEffects")]
    pub additional_effects: HashMap<String, f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Item {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub item_type: String, // "Component", "Completed", "Radiant", "Artifact"
    pub category: String,  // "AD", "AP", "Tank", "Utility"
    pub stats: ItemStats,
    pub recipe: Option<ItemRecipe>,
    #[serde(rename = "buildsInto")]
    pub builds_into: Vec<ObjectId>,
    pub effects: Vec<ItemEffect>,
    pub priority: u32,
    #[serde(rename = "isUnique")]
    pub is_unique: bool,
    #[serde(rename = "isRadiant")]
    pub is_radiant: bool,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,

    // Set 15 specific fields
    pub set_number: u32,           // 15 for Set 15
    pub is_new: bool,              // Whether this item is new to Set 15
    pub is_artifact: bool,         // Whether this is an artifact item
    pub champion_synergies: Vec<String>, // Champions this item works well with
    pub trait_synergies: Vec<String>,    // Traits this item supports
    pub optimal_cost: Vec<u32>,    // Optimal cost ranges for this item (1-5)
    pub counter_items: Vec<String>, // Items that counter this item
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemStats {
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemRecipe {
    pub component1: ObjectId,
    pub component2: ObjectId,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemEffect {
    #[serde(rename = "type")]
    pub effect_type: String, // "OnAttack", "OnCast", "Passive"
    pub description: String,
    pub value: Option<f64>,
    pub duration: Option<f64>,
    pub cooldown: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Augment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub augment_type: String, // "Silver", "Gold", "Prismatic"
    pub category: String,      // "Combat", "Economy", "Synergy", "Hero"
    pub tier: u32,            // 1 = Silver, 2 = Gold, 3 = Prismatic
    #[serde(rename = "heroChampion")]
    pub hero_champion: Option<HeroChampion>,
    pub effects: Vec<AugmentEffect>,
    #[serde(rename = "winrateImpact")]
    pub winrate_impact: Option<f64>,
    #[serde(rename = "pickRate")]
    pub pick_rate: Option<f64>,
    #[serde(rename = "isEnabled")]
    pub is_enabled: bool,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,

    // Set 15 specific fields
    pub set_number: u32,           // 15 for Set 15
    pub stage_unlocked: u32,       // Stage when this augment becomes available (2, 3, 4)
    pub is_hero_augment: bool,     // Whether this is a hero augment
    pub is_prismatic: bool,        // Whether this is a prismatic augment
    pub synergy_requirements: Vec<String>, // Traits required for this augment
    pub recommended_comps: Vec<String>,    // Recommended compositions for this augment
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HeroChampion {
    #[serde(rename = "championId")]
    pub champion_id: ObjectId,
    #[serde(rename = "starLevel")]
    pub star_level: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AugmentEffect {
    #[serde(rename = "type")]
    pub effect_type: String, // "StatBonus", "GoldGain", "ItemGrant"
    pub description: String,
    pub value: Option<f64>,
    #[serde(rename = "isPercentage")]
    pub is_percentage: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Composition {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "setId")]
    pub set_id: ObjectId,
    #[serde(rename = "authorId")]
    pub author_id: Option<ObjectId>,

    // Basic info
    pub name: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,

    // Champions and items
    pub champions: Vec<CompositionChampion>,
    pub augments: CompositionAugments,
    pub positioning: Option<PositioningStrategy>,
    pub gameplan: Option<GamePlan>,

    // Meta information
    pub meta: CompositionMeta,
    pub matchups: Option<Matchups>,

    // Community features
    pub votes: Votes,
    pub views: u32,
    pub favorites: u32,
    pub comments: Vec<ObjectId>,

    // Moderation
    #[serde(rename = "isPublic")]
    pub is_public: bool,
    #[serde(rename = "isVerified")]
    pub is_verified: bool,
    #[serde(rename = "isFeatured")]
    pub is_featured: bool,

    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionChampion {
    #[serde(rename = "championId")]
    pub champion_id: ObjectId,
    #[serde(rename = "starLevel")]
    pub star_level: u32,
    pub items: Vec<ObjectId>,
    pub position: Position,
    pub priority: u32,
    #[serde(rename = "isCore")]
    pub is_core: bool,
    pub alternatives: Vec<ObjectId>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: u32, // 0-6
    pub y: u32, // 0-3
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionAugments {
    pub preferred: Vec<ObjectId>,
    pub acceptable: Vec<ObjectId>,
    pub avoid: Vec<ObjectId>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PositioningStrategy {
    pub strategy: String,
    pub description: String,
    pub variations: Vec<PositioningVariation>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PositioningVariation {
    pub name: String,
    pub description: String,
    #[serde(rename = "modifiedPositions")]
    pub modified_positions: Vec<ModifiedPosition>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModifiedPosition {
    #[serde(rename = "championId")]
    pub champion_id: ObjectId,
    #[serde(rename = "newPosition")]
    pub new_position: Position,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GamePlan {
    pub early: GamePhase,
    pub mid: GamePhase,
    pub late: GamePhase,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GamePhase {
    pub description: String,
    #[serde(rename = "levelingPattern")]
    pub leveling_pattern: String,
    #[serde(rename = "keyItems")]
    pub key_items: Vec<ObjectId>,
    #[serde(rename = "transitionTriggers")]
    pub transition_triggers: Vec<String>,
    #[serde(rename = "pivotOptions")]
    pub pivot_options: Vec<ObjectId>,
    #[serde(rename = "keyPowerSpikes")]
    pub key_power_spikes: Vec<String>,
    #[serde(rename = "winCondition")]
    pub win_condition: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionMeta {
    pub tier: String,        // "S", "A", "B", "C", "D"
    pub difficulty: u32,     // 1-5 scale
    pub cost: String,        // "Budget", "Expensive", "Flexible"
    pub patch: String,       // "15.23" for Set 15
    pub playstyle: String,   // "Aggressive", "Greedy", "Flexible"

    // Performance metrics
    pub winrate: f64,        // 0.0 - 1.0
    #[serde(rename = "avgPlacement")]
    pub avg_placement: f64,  // 1.0 - 8.0
    pub playrate: f64,       // How popular the comp is
    #[serde(rename = "contestRate")]
    pub contest_rate: f64,   // How often it's contested

    // Set 15 specific fields
    pub set_version: String, // "15" for Set 15
    pub min_round: Option<u32>, // Minimum round this comp becomes viable
    pub max_round: Option<u32>, // Round where comp peaks
    pub econ_type: Option<String>, // "Early", "Mid", "Late", "All"
    pub positioning_style: Option<String>, // "Frontline", "Backline", "Split"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Matchups {
    pub favorable: Vec<Matchup>,
    pub unfavorable: Vec<Matchup>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Matchup {
    #[serde(rename = "compName")]
    pub comp_name: String,
    pub reason: String,
    pub confidence: f64, // 0.0 - 1.0
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Votes {
    pub upvotes: u32,
    pub downvotes: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub username: String,
    pub email: String,
    #[serde(rename = "passwordHash")]
    pub password_hash: String,

    pub profile: UserProfile,
    pub stats: UserStats,
    pub preferences: UserPreferences,
    pub roles: Vec<String>,

    #[serde(rename = "lastLogin")]
    pub last_login: Option<DateTime>,
    #[serde(rename = "lastActiveSet")]
    pub last_active_set: Option<ObjectId>,

    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserProfile {
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub avatar: Option<String>,
    pub bio: Option<String>,
    pub region: Option<String>,
    pub rank: Option<String>,
    pub lolpuuid: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserStats {
    #[serde(rename = "compositionsCreated")]
    pub compositions_created: u32,
    #[serde(rename = "totalViews")]
    pub total_views: u32,
    #[serde(rename = "totalUpvotes")]
    pub total_upvotes: u32,
    pub reputation: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferences {
    #[serde(rename = "favoriteCompositions")]
    pub favorite_compositions: Vec<ObjectId>,
    #[serde(rename = "followingUsers")]
    pub following_users: Vec<ObjectId>,
    #[serde(rename = "preferredSets")]
    pub preferred_sets: Vec<ObjectId>,
    #[serde(rename = "emailNotifications")]
    pub email_notifications: bool,
    #[serde(rename = "publicProfile")]
    pub public_profile: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Comment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "compositionId")]
    pub composition_id: ObjectId,
    #[serde(rename = "authorId")]
    pub author_id: ObjectId,
    #[serde(rename = "parentCommentId")]
    pub parent_comment_id: Option<ObjectId>,

    pub content: String,
    pub votes: Votes,

    #[serde(rename = "isDeleted")]
    pub is_deleted: bool,
    #[serde(rename = "isEdited")]
    pub is_edited: bool,
    #[serde(rename = "editedAt")]
    pub edited_at: Option<DateTime>,

    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
}

// API Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct CompositionQuery {
    pub set: Option<String>,
    pub tier: Option<String>,
    pub category: Option<String>,
    pub champion: Option<String>,
    pub difficulty: Option<u32>,
    pub patch: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<u64>,
    pub sort_by: Option<String>, // "popularity", "tier", "newest", "winrate"
    pub tags: Option<String>,    // Comma-separated tags
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
    #[serde(rename = "type")]
    pub search_type: Option<String>, // "compositions", "champions", "items"
    pub limit: Option<i64>,
    pub set_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChampionQuery {
    pub set: Option<String>,
    pub cost: Option<u32>,
    pub traits: Option<String>, // Comma-separated traits
    pub limit: Option<i64>,
    pub search: Option<String>, // Name search
}

#[derive(Debug, Deserialize)]
pub struct ItemQuery {
    pub set: Option<String>,
    pub category: Option<String>,
    #[serde(rename = "type")]
    pub item_type: Option<String>,
    pub limit: Option<i64>,
    pub search: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AugmentQuery {
    pub set: Option<String>,
    pub tier: Option<u32>,
    pub category: Option<String>,
    #[serde(rename = "type")]
    pub augment_type: Option<String>,
    pub limit: Option<i64>,
    pub hero_champion: Option<String>,
}

// API Response DTOs
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub errors: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct HealthCheck {
    pub status: String,
    pub timestamp: DateTime,
    pub version: String,
    pub database: String,
    pub uptime: u64,
}

#[derive(Debug, Serialize)]
pub struct CompositionSummary {
    pub id: ObjectId,
    pub name: String,
    pub category: String,
    pub tier: String,
    pub difficulty: u32,
    pub winrate: f64,
    pub views: u32,
    pub upvotes: u32,
    pub author: Option<String>,
    pub champion_count: u32,
    pub main_champions: Vec<String>, // Top 3 champion names
    pub created_at: DateTime,
}

#[derive(Debug, Serialize)]
pub struct ChampionSummary {
    pub id: ObjectId,
    pub name: String,
    pub cost: u32,
    pub traits: Vec<String>,
    pub health: f64,
    pub attack_damage: f64,
    pub ability_name: String,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ItemSummary {
    pub id: ObjectId,
    pub name: String,
    pub category: String,
    pub item_type: String,
    pub description: String,
    pub is_unique: bool,
    pub priority: u32,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TraitSummary {
    pub id: ObjectId,
    pub name: String,
    pub trait_type: String,
    pub description: String,
    pub breakpoints: Vec<u32>, // Just the counts
    pub image_url: Option<String>,
}

// Create/Update DTOs
#[derive(Debug, Deserialize)]
pub struct CreateCompositionRequest {
    pub name: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub champions: Vec<CompositionChampion>,
    pub augments: CompositionAugments,
    pub positioning: Option<PositioningStrategy>,
    pub gameplan: Option<GamePlan>,
    pub meta: CompositionMeta,
    pub is_public: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCompositionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub champions: Option<Vec<CompositionChampion>>,
    pub augments: Option<CompositionAugments>,
    pub positioning: Option<PositioningStrategy>,
    pub gameplan: Option<GamePlan>,
    pub meta: Option<CompositionMeta>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct VoteRequest {
    pub vote_type: String, // "upvote" or "downvote"
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
    pub parent_comment_id: Option<ObjectId>,
}

// Validation implementation
impl CreateCompositionRequest {
    pub fn validate(&self) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();

        if self.name.trim().is_empty() {
            errors.push("Name cannot be empty".to_string());
        }

        if self.name.len() > 100 {
            errors.push("Name cannot exceed 100 characters".to_string());
        }

        if self.description.len() > 5000 {
            errors.push("Description cannot exceed 5000 characters".to_string());
        }

        if self.champions.is_empty() {
            errors.push("Composition must have at least one champion".to_string());
        }

        if self.champions.len() > 10 {
            errors.push("Composition cannot have more than 10 champions".to_string());
        }

        // Validate champion positions are within board bounds
        for champ in &self.champions {
            if champ.position.x > 6 || champ.position.y > 3 {
                errors.push(format!("Invalid position for champion: ({}, {})", champ.position.x, champ.position.y));
            }
        }

        // Check for duplicate positions
        let mut positions = std::collections::HashSet::new();
        for champ in &self.champions {
            let pos = (champ.position.x, champ.position.y);
            if !positions.insert(pos) {
                errors.push(format!("Duplicate position found: ({}, {})", pos.0, pos.1));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}