// src/interfaces/ISetChampion.ts
export interface ISetChampion {
  id: string;         // Unique ID (e.g., TFT12_Ahri)
  name: string;
  cost: number;
  traits: string[];
  stats: {
    hp: number;
    mana: number;
    damage: number;
  };
  ability: {
    name: string;
    variables: Record<string, number[]>; // Values for 1, 2, and 3 stars
  };
  imageUrl?: string | null;
  splashUrl?: string | null;
  iconUrl?: string | null;
}

// src/interfaces/ITrait.ts
export interface ITrait {
  key: string;
  name?: string;
  description?: string;
  breakpoints: Array<{
    count: number;
    bonus: string;
  }>;
}

// src/interfaces/IItem.ts
export interface IItem {
  id: string;
  name: string;
  description: string;
  components: string[];
  imageUrl?: string | null;
  unique?: boolean;
  trait?: string | null;
}

// src/interfaces/ISetData.ts
export interface ISetData {
  setId: number;
  setName: string;
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