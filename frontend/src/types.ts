// src/types.ts

export interface Champion {
  id: string;
  name: string;
  display_name?: string;
  cost: number;
  traits: string[];
  stats: ChampionStats;
  ability: ChampionAbility;
  image: string;
  splash_url?: string;
  rarity: string;
  release_version?: string;
  set?: string; // Which set the champion belongs to
  is_enabled: boolean;
}

export interface ChampionStats {
  health: number;
  mana: number;
  starting_mana: number;
  armor: number;
  magic_resist: number;
  attack_damage: number;
  attack_speed: number;
  attack_range: number;
  crit_chance: number;
  crit_multiplier: number;
}

export interface ChampionAbility {
  name: string;
  description: string;
  type: string; // "Active", "Passive", "Transform"
  targeting: string; // "Enemies", "Allies", "Self"
  damage_type: string; // "Physical", "Magic", "True"
  scaling: AbilityScaling[];
}

export interface AbilityScaling {
  star_level: number;
  damage: number;
  additional_effects: Record<string, number>;
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  trait_type: string; // "Region", "Story", "Class", etc.
  set?: string; // Which set the trait belongs to
  breakpoints: TraitBreakpoint[];
}

export interface TraitBreakpoint {
  count: number;
  description: string;
  bonuses: Record<string, number>;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  set?: string; // Which set the item belongs to
}

export interface Unit {
  id: string;
  name: string;
  rarity: number;
  tier: number;
  itemNames: string[];
}

export interface Set {
  id: string;
  name: string;
  version: string;
  releaseDate: string;
  champions: Champion[];
  traits: Trait[];
  items: Item[];
}