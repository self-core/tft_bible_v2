// src/graphql/schema.rs
use async_graphql::*;
use crate::models::{Champion, Trait, Item, TraitBreakpoint};

#[derive(SimpleObject)]
pub struct TraitCount {
    name: String,
    current: i32,
    target: i32,
    active_breakpoints: Vec<i32>,
    upcoming_breakpoint: Option<i32>,
}

#[derive(SimpleObject)]
pub struct TraitRequirement {
    trait_name: String,
    required_count: i32,
}

#[derive(SimpleObject)]
pub struct TraitPath {
    champion: ChampionType,
    traits_gained: Vec<String>,
    cost: i32,
    efficiency: f64,
}

#[derive(SimpleObject)]
pub struct TraitTrackerResponse {
    path: Vec<TraitPath>,
    efficiency: f64,
}

#[derive(SimpleObject)]
pub struct ChampionType {
    id: String,
    name: String,
    cost: i32,
    traits: Vec<String>,
    stats: ChampionStatsType,
    ability: ChampionAbilityType,
    image: Option<String>,
}

#[derive(SimpleObject)]
pub struct ChampionStatsType {
    health: f64,
    mana: f64,
    starting_mana: f64,
    armor: f64,
    magic_resist: f64,
    attack_damage: f64,
    attack_speed: f64,
    attack_range: f64,
    crit_chance: f64,
    crit_multiplier: f64,
}

#[derive(SimpleObject)]
pub struct ChampionAbilityType {
    name: String,
    description: String,
    ability_type: String,
    targeting: String,
    damage_type: String,
}

#[derive(SimpleObject)]
pub struct TraitType {
    id: String,
    name: String,
    description: String,
    trait_type: String,
    breakpoints: Vec<TraitBreakpointType>,
}

#[derive(SimpleObject)]
pub struct TraitBreakpointType {
    count: i32,
    description: String,
    bonuses: serde_json::Value,
}

#[derive(SimpleObject)]
pub struct ItemType {
    id: String,
    name: String,
    description: String,
    item_type: String,
    category: String,
}

#[derive(SimpleObject)]
pub struct SetType {
    id: String,
    name: String,
    version: String,
    is_active: bool,
    champions: Vec<ChampionType>,
    traits: Vec<TraitType>,
    items: Vec<ItemType>,
}

#[derive(SimpleObject)]
pub struct CompositionType {
    id: String,
    name: String,
    description: String,
    category: String,
    champions: Vec<CompositionChampionType>,
    augments: Vec<String>,
}

#[derive(SimpleObject)]
pub struct CompositionChampionType {
    champion: ChampionType,
    star_level: i32,
    items: Vec<String>,
    position: PositionType,
    is_core: bool,
}

#[derive(SimpleObject)]
pub struct PositionType {
    x: i32,
    y: i32,
}

#[derive(InputObject)]
pub struct TraitTrackerInput {
    target_traits: Vec<TraitRequirement>,
    current_traits: Option<Vec<CurrentTraitInput>>,
}

#[derive(InputObject)]
pub struct CurrentTraitInput {
    name: String,
    count: i32,
}