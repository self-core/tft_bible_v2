// src/types.ts

export interface Champion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  stats: ChampionStats;
  ability: ChampionAbility;
  imageUrl?: string;
  splashUrl?: string;
  iconUrl?: string;
}

export interface ChampionStats {
  hp: number;
  mana: number;
  damage: number;
}

export interface ChampionAbility {
  name: string;
  variables: AbilityVariable[]; // Changed to match GraphQL schema
}

export interface AbilityVariable {
  name: string;
  values: number[]; // Changed to match GraphQL schema
}

export interface Trait {
  key: string; // Changed from id to key to match GraphQL schema
  name?: string;
  description?: string;
  breakpoints: TraitBreakpoint[];
}

export interface TraitBreakpoint {
  count: number;
  bonus: string; // Changed from description to bonus to match GraphQL schema
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
  setId: number; // Changed to match GraphQL schema
  setName: string; // Changed to match GraphQL schema
  champions: Champion[];
  traits: Trait[];
  items: Item[];
  augments: any[]; // Added to match GraphQL schema
  mechanics: any; // Added to match GraphQL schema
}

export interface TraitRequirement {
  trait_name: string;
  required_count: number;
}

export interface CurrentTrait {
  name: string;
  count: number;
}

export interface TraitTrackerResponse {
  path: Champion[];
  efficiency: number;
}