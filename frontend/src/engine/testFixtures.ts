import type { AbilityVariable, Augment, Champion, Item, Trait } from '../lib/api';
import type { CombatUnitInput, Side } from './types';

export function makeChampion(overrides: Partial<Champion> = {}): Champion {
  return {
    id: 'TFT18_Test',
    name: 'Test',
    cost: 1,
    traits: [],
    stats: {
      hp: 600,
      mana: 100,
      damage: 50,
      armor: 20,
      magicResist: 20,
      attackSpeed: 0.7,
      range: 1,
      initialMana: 0,
      critChance: 0.25,
      critMultiplier: 1.4,
    },
    ability: { name: 'Test Ability', variables: [] },
    imageUrl: '',
    ...overrides,
  };
}

export function abilityVariable(name: string, values: number[]): AbilityVariable {
  return { name, values };
}

export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'TFT_Item_Test',
    name: 'Test Item',
    description: '',
    components: [],
    effects: [],
    ...overrides,
  };
}

export function makeTrait(overrides: Partial<Trait> = {}): Trait {
  return {
    key: 'Test',
    name: 'Test',
    breakpoints: [],
    ...overrides,
  };
}

export function makeUnit(
  side: Side,
  index: number,
  overrides: Partial<CombatUnitInput> = {}
): CombatUnitInput {
  const champion = overrides.champion ?? makeChampion({ id: `TFT18_Unit${index}` });
  return {
    id: `${side}-${index}`,
    championId: champion.id,
    champion,
    stars: 1,
    row: 3,
    col: index % 7,
    items: [],
    ...overrides,
  };
}

export function makeAugment(overrides: Partial<Augment> = {}): Augment {
  return {
    id: 'TFT_Augment_Test',
    name: 'Test Augment',
    description: '',
    ...overrides,
  };
}
