use bson::{oid::ObjectId, DateTime};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono;

// Custom serialization for ObjectId and DateTime to handle serde issues
pub mod serde_helpers {
    use bson::oid::ObjectId;
    use serde::Serializer;

    pub fn serialize_object_id<S>(oid: &ObjectId, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&oid.to_hex())
    }

    pub fn serialize_object_id_vec<S>(oids: &Vec<ObjectId>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let hex_strings: Vec<String> = oids.iter().map(|oid| oid.to_hex()).collect();
        serializer.collect_seq(hex_strings)
    }

    pub fn deserialize_object_id<'de, D>(deserializer: D) -> Result<ObjectId, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::Deserialize;
        let hex_string = String::deserialize(deserializer)?;
        ObjectId::parse_str(&hex_string).map_err(serde::de::Error::custom)
    }

    pub fn deserialize_object_id_vec<'de, D>(deserializer: D) -> Result<Vec<ObjectId>, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::Deserialize;
        let hex_strings: Vec<String> = Vec::deserialize(deserializer)?;
        hex_strings.into_iter()
            .map(|hex| ObjectId::parse_str(&hex).map_err(serde::de::Error::custom))
            .collect()
    }

    pub fn serialize_datetime<S>(dt: &chrono::DateTime<chrono::Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&dt.to_rfc3339())
    }

    pub fn serialize_chrono_datetime<S>(dt: &chrono::DateTime<chrono::Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&dt.to_rfc3339())
    }
}

#[derive(Debug, Clone)]
pub struct Set {
    pub id: Option<ObjectId>,
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

#[derive(Debug, Clone)]
pub struct Trait {
    pub id: Option<ObjectId>,
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    pub trait_type: String, // "Origin", "Class", "Unique"
    pub image_url: Option<String>,
    pub breakpoints: Vec<TraitBreakpoint>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TraitBreakpoint {
    pub count: u32,
    pub description: String,
    pub bonuses: HashMap<String, f64>, // Flexible stat bonuses
}

#[derive(Debug, Clone)]
pub struct Champion {
    pub id: Option<ObjectId>,
    pub set_id: ObjectId,
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

#[derive(Debug, Clone)]
pub struct Item {
    pub id: Option<ObjectId>,
    pub set_id: ObjectId,
    pub name: String,
    pub description: String,
    pub item_type: String, // "Component", "Completed", "Radiant", "Artifact"
    pub category: String,  // "AD", "AP", "Tank", "Utility"
    pub stats: ItemStats,
    pub recipe: Option<ItemRecipe>,
    pub builds_into: Vec<ObjectId>,
    pub effects: Vec<ItemEffect>,
    pub priority: u32,
    pub is_unique: bool,
    pub is_radiant: bool,
    pub image_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
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

#[derive(Debug, Clone)]
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

#[derive(Debug, Clone)]
pub struct Augment {
    pub id: Option<ObjectId>,
    pub set_id: ObjectId,
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

#[derive(Debug, Clone)]
pub struct HeroChampion {
    pub champion_id: ObjectId,
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

#[derive(Debug, Clone)]
pub struct Composition {
    pub id: Option<ObjectId>,
    pub set_id: ObjectId,
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
    pub is_public: bool,
    pub is_verified: bool,
    pub is_featured: bool,

    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionChampion {
    #[serde(serialize_with = "serde_helpers::serialize_object_id", deserialize_with = "serde_helpers::deserialize_object_id")]
    pub champion_id: ObjectId,
    pub star_level: u32,
    #[serde(serialize_with = "serde_helpers::serialize_object_id_vec", deserialize_with = "serde_helpers::deserialize_object_id_vec")]
    pub items: Vec<ObjectId>,
    pub position: Position,
    pub priority: u32,
    pub is_core: bool,
    #[serde(serialize_with = "serde_helpers::serialize_object_id_vec", deserialize_with = "serde_helpers::deserialize_object_id_vec")]
    pub alternatives: Vec<ObjectId>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: u32, // 0-6
    pub y: u32, // 0-3
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionAugments {
    #[serde(serialize_with = "serde_helpers::serialize_object_id_vec", deserialize_with = "serde_helpers::deserialize_object_id_vec")]
    pub preferred: Vec<ObjectId>,
    #[serde(serialize_with = "serde_helpers::serialize_object_id_vec", deserialize_with = "serde_helpers::deserialize_object_id_vec")]
    pub acceptable: Vec<ObjectId>,
    #[serde(serialize_with = "serde_helpers::serialize_object_id_vec", deserialize_with = "serde_helpers::deserialize_object_id_vec")]
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
    pub modified_positions: Vec<ModifiedPosition>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModifiedPosition {
    #[serde(serialize_with = "serde_helpers::serialize_object_id", deserialize_with = "serde_helpers::deserialize_object_id")]
    pub champion_id: ObjectId,
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
    pub leveling_pattern: String,
    #[serde(serialize_with = "serde_helpers::serialize_object_id_vec", deserialize_with = "serde_helpers::deserialize_object_id_vec")]
    pub key_items: Vec<ObjectId>,
    pub transition_triggers: Vec<String>,
    #[serde(serialize_with = "serde_helpers::serialize_object_id_vec", deserialize_with = "serde_helpers::deserialize_object_id_vec")]
    pub pivot_options: Vec<ObjectId>,
    pub key_power_spikes: Vec<String>,
    pub win_condition: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompositionMeta {
    pub tier: String,        // "S", "A", "B", "C", "D"
    pub difficulty: u32,     // 1-5 scale
    pub cost: String,        // "Budget", "Expensive", "Flexible"
    pub patch: String,       // "14.23"
    pub playstyle: String,   // "Aggressive", "Greedy", "Flexible"

    // Performance metrics
    pub winrate: f64,        // 0.0 - 1.0
    #[serde(rename = "avgPlacement")]
    pub avg_placement: f64,  // 1.0 - 8.0
    pub playrate: f64,       // How popular the comp is
    #[serde(rename = "contestRate")]
    pub contest_rate: f64,   // How often it's contested
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

#[derive(Debug, Clone)]
pub struct User {
    pub id: Option<ObjectId>,
    pub username: String,
    pub email: String,
    pub password_hash: String,

    pub profile: UserProfile,
    pub stats: UserStats,
    pub preferences: UserPreferences,
    pub roles: Vec<String>,

    pub last_login: Option<chrono::DateTime<chrono::Utc>>,
    pub last_active_set: Option<ObjectId>,

    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct UserProfile {
    pub display_name: String,
    pub avatar: Option<String>,
    pub bio: Option<String>,
    pub region: Option<String>,
    pub rank: Option<String>,
    pub lolpuuid: Option<String>,
}

#[derive(Debug, Clone)]
pub struct UserStats {
    pub compositions_created: u32,
    pub total_views: u32,
    pub total_upvotes: u32,
    pub reputation: i32,
}

#[derive(Debug, Clone)]
pub struct UserPreferences {
    pub favorite_compositions: Vec<ObjectId>,
    pub following_users: Vec<ObjectId>,
    pub preferred_sets: Vec<ObjectId>,
    pub email_notifications: bool,
    pub public_profile: bool,
}

#[derive(Debug, Clone)]
pub struct Comment {
    pub id: Option<ObjectId>,
    pub composition_id: ObjectId,
    pub author_id: ObjectId,
    pub parent_comment_id: Option<ObjectId>,

    pub content: String,
    pub votes: Votes,

    pub is_deleted: bool,
    pub is_edited: bool,
    pub edited_at: Option<chrono::DateTime<chrono::Utc>>,

    pub created_at: chrono::DateTime<chrono::Utc>,
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
    #[serde(serialize_with = "serde_helpers::serialize_datetime")]
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub version: String,
    pub database: String,
    pub uptime: u64,
}

#[derive(Debug, Serialize)]
pub struct CompositionSummary {
    #[serde(serialize_with = "serde_helpers::serialize_object_id")]
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
    #[serde(serialize_with = "serde_helpers::serialize_datetime")]
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct ChampionSummary {
    #[serde(serialize_with = "serde_helpers::serialize_object_id")]
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
    #[serde(serialize_with = "serde_helpers::serialize_object_id")]
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
    #[serde(serialize_with = "serde_helpers::serialize_object_id")]
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

// Riot API Data Models

#[derive(Debug, Clone)]
pub struct RiotSummoner {
    pub id: Option<bson::oid::ObjectId>,
    pub summoner_id: String,      // encrypted summoner ID from Riot
    pub account_id: String,       // encrypted account ID from Riot
    pub puuid: String,            // encrypted PUUID from Riot
    pub name: String,             // summoner name
    pub profile_icon_id: i32,
    pub revision_date: chrono::DateTime<chrono::Utc>,
    pub summoner_level: i64,
    pub region: String,           // region where the data was fetched from
    pub last_updated: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct RiotMatch {
    pub id: Option<bson::oid::ObjectId>,
    pub match_id: String,         // match ID from Riot (e.g., "EUW1_1234567890")
    pub data_version: String,     // version of the metadata
    pub game_datetime: chrono::DateTime<chrono::Utc>,
    pub game_length: f64,         // length of the game in seconds
    pub game_version: String,     // version of the game
    pub queue_id: i32,            // queue type ID
    pub tft_game_type: String,    // type of TFT game
    pub tft_set_core_name: String, // name of the TFT set
    pub tft_set_number: i32,      // number of the TFT set
    pub participants: Vec<RiotMatchParticipant>,
    pub region: String,           // region where the match was played
    pub fetched_at: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct RiotMatchParticipant {
    pub puuid: String,
    pub companion: String,        // companion details as JSON string
    pub gold_left: i32,
    pub last_round: String,
    pub level: i32,
    pub placement: i32,
    pub players_eliminated: i32,
    pub time_eliminated: String,
    pub total_damage_to_players: i32,
    pub traits: Vec<RiotMatchTrait>,  // traits the player used
    pub units: Vec<RiotMatchUnit>,    // units the player had at the end
    pub summoner_id: Option<bson::oid::ObjectId>, // reference to our summoner collection
}

#[derive(Debug, Clone)]
pub struct RiotMatchTrait {
    pub name: String,
    pub num_units: i32,
    pub style: Option<i32>,       // style (bronze, silver, gold, chromatic)
}

#[derive(Debug, Clone)]
pub struct RiotMatchUnit {
    pub character_id: String,
    pub item_names: Vec<String>,  // names of items equipped
    pub name: String,
    pub rarity: i32,              // star level (0-3)
    pub tier: i32,                // unit tier (1-3)
    pub is_alternative: bool,     // for handling alternative units
}

// DTOs for API responses
#[derive(Debug, Serialize)]
pub struct SummonerResponse {
    #[serde(serialize_with = "serde_helpers::serialize_object_id")]
    pub id: bson::oid::ObjectId,
    pub summoner_id: String,
    pub name: String,
    pub summoner_level: i64,
    #[serde(serialize_with = "serde_helpers::serialize_datetime")]
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct MatchResponse {
    #[serde(serialize_with = "serde_helpers::serialize_object_id")]
    pub id: bson::oid::ObjectId,
    pub match_id: String,
    #[serde(serialize_with = "serde_helpers::serialize_datetime")]
    pub game_datetime: chrono::DateTime<chrono::Utc>,
    pub game_length: f64,
    pub game_version: String,
    pub tft_set_core_name: String,
    pub tft_set_number: i32,
    pub participants: Vec<MatchParticipantResponse>,
    #[serde(serialize_with = "serde_helpers::serialize_datetime")]
    pub fetched_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct MatchParticipantResponse {
    pub placement: i32,
    pub summoner_name: String,
    pub level: i32,
    pub total_damage_to_players: i32,
    pub units: Vec<String>,       // simplified unit names for display
    pub traits: Vec<String>,      // simplified trait names for display
}

#[derive(Debug)]
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