import { ISetChampion, ITrait, IItem, IComposition, ISetData } from './interfaces';

// Realistic data based on actual TFT data sources following the new Set-based architecture
const set16Data: ISetData = {
  setId: 16,
  setName: "Lore & Legends",
  champions: [
    {
      id: 'TFT16_Ahri',
      name: 'Ahri',
      cost: 2,
      traits: ['Arcane', 'Sorcerer'],
      stats: { hp: 650, mana: 40, damage: 50 },
      ability: {
        name: 'Orb of Deception',
        variables: {
          Damage: [150, 225, 335],
          Mana: [30, 30, 30]
        }
      },
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103.png',
      splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/103/103000.jpg',
      iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103-square.png'
    },
    {
      id: 'TFT16_Akali',
      name: 'Akali',
      cost: 3,
      traits: ['Ninja', 'Assassin'],
      stats: { hp: 700, mana: 60, damage: 70 },
      ability: {
        name: 'Five Point Strike',
        variables: {
          Damage: [300, 450, 675],
          Mana: [60, 60, 60]
        }
      },
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png',
      splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/84/84000.jpg',
      iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84-square.png'
    },
    {
      id: 'TFT16_Ashe',
      name: 'Ashe',
      cost: 3,
      traits: ['Frost', 'Ranger'],
      stats: { hp: 650, mana: 70, damage: 65 },
      ability: {
        name: 'Enchanted Crystal Arrow',
        variables: {
          Damage: [500, 750, 1125],
          Mana: [70, 70, 70]
        }
      },
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22.png',
      splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/22/22000.jpg',
      iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22-square.png'
    },
    {
      id: 'TFT16_Jinx',
      name: 'Jinx',
      cost: 4,
      traits: ['Arcane', 'Gunner'],
      stats: { hp: 750, mana: 80, damage: 75 },
      ability: {
        name: 'Super Mega Death Rocket!',
        variables: {
          Damage: [400, 600, 900],
          Mana: [80, 80, 80]
        }
      },
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222.png',
      splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/222/222000.jpg',
      iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222-square.png'
    },
    {
      id: 'TFT16_Lux',
      name: 'Lux',
      cost: 3,
      traits: ['Arcane', 'Sorcerer'],
      stats: { hp: 650, mana: 60, damage: 45 },
      ability: {
        name: 'Final Spark',
        variables: {
          Damage: [350, 525, 788],
          Mana: [60, 60, 60]
        }
      },
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png',
      splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/99/99000.jpg',
      iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99-square.png'
    }
  ],
  traits: [
    {
      key: 'Arcane',
      name: 'Arcane',
      description: 'Arcane units gain mana whenever they deal or take damage.',
      breakpoints: [
        { count: 2, bonus: 'Arcane units gain 20 mana on hit' },
        { count: 4, bonus: 'Arcane units gain 40 mana on hit' },
        { count: 6, bonus: 'Arcane units gain 60 mana on hit' }
      ]
    },
    {
      key: 'Sorcerer',
      name: 'Sorcerer',
      description: 'Sorcerers gain bonus Ability Power. All allies have their Magic Resist reduced.',
      breakpoints: [
        { count: 3, bonus: 'Sorcerers gain 40% AP, 10% enemy MR reduction' },
        { count: 6, bonus: 'Sorcerers gain 70% AP, 20% enemy MR reduction' },
        { count: 9, bonus: 'Sorcerers gain 120% AP, 30% enemy MR reduction' }
      ]
    },
    {
      key: 'Ninja',
      name: 'Ninja',
      description: 'Ninjas gain Attack Damage and Ability Power. This trait is only active when you have exactly 1 or 4 unique Ninjas.',
      breakpoints: [
        { count: 1, bonus: 'Ninja gains 50% AD and 50 AP' },
        { count: 4, bonus: 'All Ninjas gain 50% AD and 50 AP' }
      ]
    },
    {
      key: 'Assassin',
      name: 'Assassin',
      description: 'Assassins leap to the enemy backline and gain Critical Strike Chance and Dodge Chance.',
      breakpoints: [
        { count: 2, bonus: 'Assassins gain 10% Crit Chance and Dodge Chance' },
        { count: 4, bonus: 'Assassins gain 25% Crit Chance and Dodge Chance' },
        { count: 6, bonus: 'Assassins gain 40% Crit Chance and Dodge Chance' }
      ]
    },
    {
      key: 'Ranger',
      name: 'Ranger',
      description: 'Rangers have a chance to double their attack speed for the next attack.',
      breakpoints: [
        { count: 2, bonus: 'Rangers have 30% chance to double attack speed' },
        { count: 4, bonus: 'Rangers have 60% chance to double attack speed' },
        { count: 6, bonus: 'Rangers have 90% chance to double attack speed' }
      ]
    }
  ],
  items: [
    {
      id: 'TFT16_BFSword',
      name: 'B.F. Sword',
      description: 'Attack Damage +15',
      components: [],
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/bfsword.png',
      unique: false,
      trait: undefined
    },
    {
      id: 'TFT16_ChainVest',
      name: 'Chain Vest',
      description: 'Armor +25',
      components: [],
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/chainvest.png',
      unique: false,
      trait: undefined
    },
    {
      id: 'TFT16_NeedlesslyLargeRod',
      name: 'Needlessly Large Rod',
      description: 'Ability Power +15',
      components: [],
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/needlesslylargebow.png',
      unique: false,
      trait: undefined
    },
    {
      id: 'TFT16_EdgeOfNight',
      name: 'Edge of Night',
      description: 'Wearer dodges the first attack that would\'ve killed them, and is invulnerable for a short duration.',
      components: ['TFT16_BFSword', 'TFT16_ChainVest'],
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/guardianangel.png',
      unique: true,
      trait: undefined
    },
    {
      id: 'TFT16_InfinityEdge',
      name: 'Infinity Edge',
      description: 'Critical Strikes deal +100% damage. Critical Strike Chance +75%',
      components: ['TFT16_BFSword', 'TFT16_SparringGloves'],
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/infinityedge.png',
      unique: true,
      trait: undefined
    },
    {
      id: 'TFT16_RabadonsDeathcap',
      name: 'Rabadon\'s Deathcap',
      description: 'Ability Power +75%',
      components: ['TFT16_NeedlesslyLargeRod', 'TFT16_NeedlesslyLargeRod'],
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/rabadonsdeathcap.png',
      unique: true,
      trait: undefined
    },
    {
      id: 'TFT16_GiantSlayer',
      name: 'Giant Slayer',
      description: 'Attacks and abilities deal 25% more damage to enemies with more Maximum Health than the wearer.',
      components: ['TFT16_RecurveBow', 'TFT16_BFSword'],
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/giantslayer.png',
      unique: false,
      trait: undefined
    }
  ],
  augments: [
    {
      id: 'arcane-nullifier',
      name: 'Arcane Nullifier',
      description: 'Combat start: Your units purge the enemies at the start of combat, causing them to take 25% more magic damage until they cast their ability.',
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
    },
    {
      id: 'backfoot',
      name: 'Backfoot',
      description: 'Combat start: Your highest-starred unit gains 30% Attack Speed and is immune to crowd control for 10 seconds.',
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
    },
    {
      id: 'balanced-diet',
      name: 'Balanced Diet',
      description: 'Every 4 exp gives 1 temporary item component. Gain 2 exp.',
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
    },
    {
      id: 'big-spear',
      name: 'Big Spear',
      description: 'Your units gain 25% Attack Range and 15% Attack Damage.',
      imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
    }
  ],
  mechanics: {}
};

const compositions: IComposition[] = [
  {
    id: 'hyper-carry',
    title: 'Hyper Carry',
    description: 'A popular hyper carry composition focused on dealing massive damage with multiple carries.',
    setId: 16, // Set ID for this composition
    championIds: ['TFT16_Jinx', 'TFT16_Ashe'],
    traitBonuses: ['Gunner: 4 units', 'Ranger: 2 units'],
    augmentRecommendations: ['arcane-nullifier', 'balanced-diet'],
    difficulty: 'Advanced',
    region: 'Runeterra'
  },
  {
    id: 'sorcerer-control',
    title: 'Sorcerer Control',
    description: 'A control composition utilizing sorcerer units for mana manipulation and crowd control.',
    setId: 16, // Set ID for this composition
    championIds: ['TFT16_Ahri', 'TFT16_Lux'],
    traitBonuses: ['Sorcerer: 4 units', 'Arcane: 2 units'],
    augmentRecommendations: ['backfoot', 'big-spear'],
    difficulty: 'Intermediate',
    region: 'Runeterra'
  },
  {
    id: 'ninja-assassin',
    title: 'Ninja Assassin',
    description: 'A burst damage composition combining Ninja and Assassin units for high damage and mobility.',
    setId: 16, // Set ID for this composition
    championIds: ['TFT16_Akali'],
    traitBonuses: ['Ninja: 1 unit', 'Assassin: 4 units'],
    augmentRecommendations: ['arcane-nullifier', 'backfoot'],
    difficulty: 'Intermediate',
    region: 'Runeterra'
  }
];

// Define the resolvers following the new Set-based architecture
export const resolvers = {
  Query: {
    champions: () => set16Data.champions,
    championsBySet: (_: any, { setId }: { setId: number }) => {
      // In a real implementation, we'd look up the set by ID
      // For now, just return set 16 champions if setId is 16
      if (setId === 16) return set16Data.champions;
      return []; // Return empty array for other sets
    },
    champion: (_: any, { id }: { id: string }) => set16Data.champions.find((champ: ISetChampion) => champ.id === id),
    traits: () => set16Data.traits,
    trait: (_: any, { id }: { id: string }) => set16Data.traits.find((trait: ITrait) => trait.key === id),
    items: () => set16Data.items,
    item: (_: any, { id }: { id: string }) => set16Data.items.find((item: IItem) => item.id === id),
    sets: () => [set16Data], // Return all available sets
    set: (_: any, { setId }: { setId: number }) => {
      // In a real implementation, we'd look up the set by ID
      if (setId === 16) return set16Data;
      return null; // Return null if set is not found
    },
    augments: () => set16Data.augments,
    augment: (_: any, { id }: { id: string }) => set16Data.augments.find((augment: any) => augment.id === id),
    compositions: () => compositions,
    compositionsBySet: (_: any, { setId }: { setId: number }) => {
      return compositions.filter((comp: IComposition) => comp.setId === setId);
    },
    composition: (_: any, { id }: { id: string }) => compositions.find((comp: IComposition) => comp.id === id),
    search: (_: any, { searchTerm }: { searchTerm: string }) => {
      const term = searchTerm.toLowerCase();

      const filteredChampions = set16Data.champions.filter((champ: ISetChampion) =>
        champ.name.toLowerCase().includes(term) ||
        champ.traits.some((trait: string) => trait.toLowerCase().includes(term))
      );

      const filteredTraits = set16Data.traits.filter((trait: ITrait) =>
        trait.name?.toLowerCase().includes(term) ||
        trait.description?.toLowerCase().includes(term) ||
        trait.key.toLowerCase().includes(term)
      );

      const filteredItems = set16Data.items.filter((item: IItem) =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );

      const filteredSets = [set16Data].filter((set: ISetData) =>
        set.setName.toLowerCase().includes(term)
      );

      const filteredCompositions = compositions.filter((comp: IComposition) =>
        comp.title.toLowerCase().includes(term) ||
        comp.description.toLowerCase().includes(term) ||
        comp.traitBonuses.some((bonus: string) => bonus.toLowerCase().includes(term))
      );

      return {
        champions: filteredChampions,
        traits: filteredTraits,
        items: filteredItems,
        sets: filteredSets,
        compositions: filteredCompositions
      };
    }
  }
};