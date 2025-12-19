// src/interfaces/IChampion.ts
export interface IChampion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  imageUrl?: string;
  splashUrl?: string;
  iconUrl?: string;
  abilityName?: string;
  abilityDescription?: string;
  abilityImageUrl?: string;
}

// src/interfaces/ITrait.ts
export interface ITrait {
  id: string;
  name: string;
  description: string;
  activeUnits: number[];
  imageUrl?: string;
  tiers: ITraitTier[];
}

export interface ITraitTier {
  units: number;
  effect: string;
}

// src/interfaces/IItem.ts
export interface IItem {
  id: string;
  name: string;
  description: string;
  components: string[];
  imageUrl?: string;
  unique?: boolean;
  trait?: string;
}

// src/interfaces/IAugment.ts
export interface IAugment {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

// src/interfaces/IComposition.ts
export interface IComposition {
  id: string;
  title: string;
  description: string;
  championIds: string[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
}