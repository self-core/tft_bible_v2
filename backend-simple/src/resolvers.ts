import { Resolvers } from 'apollo-server-express';
import { IChampion, ITrait, IItem, IAugment, IComposition } from './interfaces';

// Realistic data based on actual TFT data sources
const champions: IChampion[] = [
  {
    id: 'ahri',
    name: 'Ahri',
    cost: 2,
    traits: ['Arcane', 'Sorcerer'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103.png',
    splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/103/103000.jpg',
    iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103-square.png',
    abilityName: 'Orb of Deception',
    abilityDescription: 'Ahri sends out an orb that deals damage and returns to her, dealing damage again',
    abilityImageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/character-icons/spells/ahri/orbofdeception.png'
  },
  {
    id: 'akali',
    name: 'Akali',
    cost: 3,
    traits: ['Ninja', 'Assassin'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png',
    splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/84/84000.jpg',
    iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84-square.png',
    abilityName: 'Five Point Strike',
    abilityDescription: 'Akali dashes to enemies and strikes them multiple times',
    abilityImageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/character-icons/spells/akali/fivepointstrike.png'
  },
  {
    id: 'ashe',
    name: 'Ashe',
    cost: 3,
    traits: ['Frost', 'Ranger'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22.png',
    splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/22/22000.jpg',
    iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22-square.png',
    abilityName: 'Enchanted Crystal Arrow',
    abilityDescription: 'Ashe fires a crystal arrow that stuns the first enemy hit',
    abilityImageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/character-icons/spells/ashe/enchantedcrystalarrow.png'
  },
  {
    id: 'jinx',
    name: 'Jinx',
    cost: 4,
    traits: ['Arcane', 'Gunner'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222.png',
    splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/222/222000.jpg',
    iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222-square.png',
    abilityName: 'Super Mega Death Rocket!',
    abilityDescription: 'Jinx launches a rocket at the enemy with the most HP',
    abilityImageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/character-icons/spells/jinx/supermegadeathrocket.png'
  },
  {
    id: 'lux',
    name: 'Lux',
    cost: 3,
    traits: ['Arcane', 'Sorcerer'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png',
    splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/99/99000.jpg',
    iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99-square.png',
    abilityName: 'Final Spark',
    abilityDescription: 'Lux unleashes a beam of light that damages all enemies in a line',
    abilityImageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/character-icons/spells/lux/finalspark.png'
  }
];

const traits: ITrait[] = [
  {
    id: 'arcane',
    name: 'Arcane',
    description: 'Arcane units gain mana whenever they deal or take damage.',
    activeUnits: [2, 4, 6],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/trait-icons/TFT-Trait-Icon-Arcane.png',
    tiers: [
      { units: 2, effect: 'Arcane units gain 20 mana on hit' },
      { units: 4, effect: 'Arcane units gain 40 mana on hit' },
      { units: 6, effect: 'Arcane units gain 60 mana on hit' }
    ]
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    description: 'Sorcerers gain bonus Ability Power. All allies have their Magic Resist reduced.',
    activeUnits: [3, 6, 9],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/trait-icons/TFT-Trait-Icon-Sorcerer.png',
    tiers: [
      { units: 3, effect: 'Sorcerers gain 40% AP, 10% enemy MR reduction' },
      { units: 6, effect: 'Sorcerers gain 70% AP, 20% enemy MR reduction' },
      { units: 9, effect: 'Sorcerers gain 120% AP, 30% enemy MR reduction' }
    ]
  },
  {
    id: 'ninja',
    name: 'Ninja',
    description: 'Ninjas gain Attack Damage and Ability Power. This trait is only active when you have exactly 1 or 4 unique Ninjas.',
    activeUnits: [1, 4],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/trait-icons/TFT-Trait-Icon-Ninja.png',
    tiers: [
      { units: 1, effect: 'Ninja gains 50% AD and 50 AP' },
      { units: 4, effect: 'All Ninjas gain 50% AD and 50 AP' }
    ]
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Assassins leap to the enemy backline and gain Critical Strike Chance and Dodge Chance.',
    activeUnits: [2, 4, 6],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/trait-icons/TFT-Trait-Icon-Assassin.png',
    tiers: [
      { units: 2, effect: 'Assassins gain 10% Crit Chance and Dodge Chance' },
      { units: 4, effect: 'Assassins gain 25% Crit Chance and Dodge Chance' },
      { units: 6, effect: 'Assassins gain 40% Crit Chance and Dodge Chance' }
    ]
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Rangers have a chance to double their attack speed for the next attack.',
    activeUnits: [2, 4, 6],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/trait-icons/TFT-Trait-Icon-Ranger.png',
    tiers: [
      { units: 2, effect: 'Rangers have 30% chance to double attack speed' },
      { units: 4, effect: 'Rangers have 60% chance to double attack speed' },
      { units: 6, effect: 'Rangers have 90% chance to double attack speed' }
    ]
  }
];

const items: IItem[] = [
  {
    id: 'bf-sword',
    name: 'B.F. Sword',
    description: 'Attack Damage +15',
    components: [],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/bfsword.png',
    unique: false,
    trait: null
  },
  {
    id: 'chain-vest',
    name: 'Chain Vest',
    description: 'Armor +25',
    components: [],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/chainvest.png',
    unique: false,
    trait: null
  },
  {
    id: 'needlessly-large-rod',
    name: 'Needlessly Large Rod',
    description: 'Ability Power +15',
    components: [],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/needlesslylargebow.png',
    unique: false,
    trait: null
  },
  {
    id: 'guardian-angel',
    name: 'Edge of Night',
    description: 'Wearer dodges the first attack that would\'ve killed them, and is invulnerable for a short duration.',
    components: ['bf-sword', 'chain-vest'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/guardianangel.png',
    unique: true,
    trait: null
  },
  {
    id: 'infinity-edge',
    name: 'Infinity Edge',
    description: 'Critical Strikes deal +100% damage. Critical Strike Chance +75%',
    components: ['bf-sword', 'sparring-gloves'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/infinityedge.png',
    unique: true,
    trait: null
  },
  {
    id: 'rabadons-deathcap',
    name: 'Rabadon\'s Deathcap',
    description: 'Ability Power +75%',
    components: ['needlessly-large-rod', 'needlessly-large-rod'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/rabadonsdeathcap.png',
    unique: true,
    trait: null
  },
  {
    id: 'giant-slayer',
    name: 'Giant Slayer',
    description: 'Attacks and abilities deal 25% more damage to enemies with more Maximum Health than the wearer.',
    components: ['recurve-bow', 'bf-sword'],
    imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/giantslayer.png',
    unique: false,
    trait: null
  }
];

const augments: IAugment[] = [
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
];

const compositions: IComposition[] = [
  {
    id: 'hyper-carry',
    title: 'Hyper Carry',
    description: 'A popular hyper carry composition focused on dealing massive damage with multiple carries.',
    championIds: ['jinx', 'ashe'],
    traitBonuses: ['Gunner: 4 units', 'Ranger: 2 units'],
    augmentRecommendations: ['arcane-nullifier', 'balanced-diet'],
    difficulty: 'Advanced',
    region: 'Runeterra'
  },
  {
    id: 'sorcerer-control',
    title: 'Sorcerer Control',
    description: 'A control composition utilizing sorcerer units for mana manipulation and crowd control.',
    championIds: ['ahri', 'lux'],
    traitBonuses: ['Sorcerer: 4 units', 'Arcane: 2 units'],
    augmentRecommendations: ['backfoot', 'big-spear'],
    difficulty: 'Intermediate',
    region: 'Runeterra'
  },
  {
    id: 'ninja-assassin',
    title: 'Ninja Assassin',
    description: 'A burst damage composition combining Ninja and Assassin units for high damage and mobility.',
    championIds: ['akali'],
    traitBonuses: ['Ninja: 1 unit', 'Assassin: 4 units'],
    augmentRecommendations: ['arcane-nullifier', 'backfoot'],
    difficulty: 'Intermediate',
    region: 'Runeterra'
  }
];

export const resolvers: Resolvers = {
  Query: {
    champions: () => champions,
    champion: (_, { id }) => champions.find(champ => champ.id === id),
    traits: () => traits,
    trait: (_, { id }) => traits.find(trait => trait.id === id),
    items: () => items,
    item: (_, { id }) => items.find(item => item.id === id),
    augments: () => augments,
    augment: (_, { id }) => augments.find(augment => augment.id === id),
    compositions: () => compositions,
    composition: (_, { id }) => compositions.find(comp => comp.id === id),
    search: (_, { searchTerm }) => {
      const term = searchTerm.toLowerCase();

      const filteredChampions = champions.filter(champ =>
        champ.name.toLowerCase().includes(term) ||
        champ.traits.some(trait => trait.toLowerCase().includes(term))
      );

      const filteredTraits = traits.filter(trait =>
        trait.name.toLowerCase().includes(term) ||
        trait.description.toLowerCase().includes(term)
      );

      const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );

      const filteredCompositions = compositions.filter(comp =>
        comp.title.toLowerCase().includes(term) ||
        comp.description.toLowerCase().includes(term) ||
        comp.traitBonuses.some(bonus => bonus.toLowerCase().includes(term))
      );

      return {
        champions: filteredChampions,
        traits: filteredTraits,
        items: filteredItems,
        compositions: filteredCompositions
      };
    }
  }
};