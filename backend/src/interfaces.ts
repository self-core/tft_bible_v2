// src/interfaces/ISetChampion.ts
export interface IChampionStats {
  hp: number;
  mana: number;
  damage: number;
  armor: number;
  magicResist: number;
  attackSpeed: number;
  range: number;
  initialMana: number;
  critChance: number;
  critMultiplier: number;
}

export interface ISetChampion {
  id: string;         // Unique ID (e.g., TFT12_Ahri)
  name: string;
  cost: number;
  traits: string[];
  stats: IChampionStats;
  ability: {
    name: string;
    description?: string;
    variables: Array<{ name: string; values: number[] }>; // GraphQL shape
  };
  imageUrl?: string | null;
  splashUrl?: string | null;
  iconUrl?: string | null;
}

// src/interfaces/ITrait.ts
export interface ITraitVariable {
  name: string;
  value: number;
}

/** Hash-keyed values with no in-file name mapping; engine-only, never displayed. */
export interface ITraitRawVariable {
  key: string;
  value: number;
}

export interface ITraitBreakpoint {
  count: number;
  bonus: string;
  variables: ITraitVariable[];
  rawVariables: ITraitRawVariable[];
}

export interface ITrait {
  key: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  breakpoints: ITraitBreakpoint[];
}

// src/interfaces/IItem.ts
export interface IItemEffect {
  name: string;
  value: number;
}

export interface IItem {
  id: string;
  name: string;
  description: string;
  components: string[];
  effects: IItemEffect[];
  rawEffects: ITraitRawVariable[];
  imageUrl?: string | null;
  unique?: boolean;
  trait?: string | null;
}

// src/interfaces/ISetData.ts
export interface ISetData {
  setId: number;
  setName: string;
  status: 'upcoming' | 'active' | 'archived';
  champions: ISetChampion[];
  traits: ITrait[];
  items: IItem[];
  augments: any[]; // Can be expanded later
  mechanics: Record<string, any>;
}

// src/interfaces/IBoardUnit.ts
export interface IBoardUnit {
  championId: string;
  position: { row: number; col: number };
  starLevel: number;
  items: string[];
}

// src/interfaces/IComposition.ts
export interface IComposition {
  id: string;
  title: string;
  description: string;
  setId: number; // Reference to the set this composition is for
  championIds: string[];
  units?: IBoardUnit[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
  createdAt?: string;
  updatedAt?: string;
}