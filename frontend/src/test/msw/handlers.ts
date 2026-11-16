import { http, HttpResponse } from 'msw';
import { graphql } from 'msw';

const mockChampions = [
  {
    id: 'TFT18_Akali',
    name: 'Akali',
    cost: 1,
    traits: ['Inferno', 'Adaptor', 'Ravager'],
    stats: { hp: 600, mana: 50, damage: 55 },
    ability: { name: 'Kunai Strike', variables: [{ name: 'Damage', values: [150, 225, 335] }] },
    imageUrl: 'https://example.com/akali.png',
    splashUrl: 'https://example.com/akali-splash.png',
    iconUrl: 'https://example.com/akali-icon.png',
  },
  {
    id: 'TFT18_Camille',
    name: 'Camille',
    cost: 1,
    traits: ['Coven', 'Ravager'],
    stats: { hp: 650, mana: 60, damage: 60 },
    ability: { name: 'Defensive Sweep', variables: [{ name: 'Damage', values: [180, 270, 400] }] },
    imageUrl: 'https://example.com/camille.png',
    splashUrl: 'https://example.com/camille-splash.png',
    iconUrl: 'https://example.com/camille-icon.png',
  },
  {
    id: 'TFT18_Taric',
    name: 'Taric',
    cost: 5,
    traits: ['Emerald Aspect', 'Vanguard'],
    stats: { hp: 900, mana: 100, damage: 70 },
    ability: { name: 'Emerald Radiance', variables: [{ name: 'Shield', values: [400, 600, 2000] }] },
    imageUrl: 'https://example.com/taric.png',
    splashUrl: 'https://example.com/taric-splash.png',
    iconUrl: 'https://example.com/taric-icon.png',
  },
  {
    id: 'TFT18_Varus',
    name: 'Varus',
    cost: 4,
    traits: ['Inferno', 'Ravager'],
    stats: { hp: 700, mana: 80, damage: 65 },
    ability: { name: 'Piercing Arrow', variables: [{ name: 'Damage', values: [350, 550, 1500] }] },
    imageUrl: 'https://example.com/varus.png',
    splashUrl: 'https://example.com/varus-splash.png',
    iconUrl: 'https://example.com/varus-icon.png',
  },
];

const mockTraits = [
  {
    key: 'Blossom',
    name: 'Blossom',
    description: 'Blossom units empower your Wisps and gain AD, AP, and Health.',
    breakpoints: [
      { count: 3, bonus: 'Wisps are upgraded' },
      { count: 5, bonus: 'Wisps appear in every shop' },
      { count: 7, bonus: 'Gain gold after buying a Wisp' },
      { count: 9, bonus: 'You can buy 2 Wisps per round' },
      { count: 11, bonus: 'Wisps overflow with power' },
    ],
  },
  {
    key: 'Riftbeast',
    name: 'Riftbeast',
    description: 'Summon powerful jungle creatures onto the battlefield.',
    breakpoints: [
      { count: 2, bonus: 'Summon Murkwolf' },
      { count: 4, bonus: 'Summon Krug' },
      { count: 6, bonus: 'Summon Gromp' },
      { count: 8, bonus: 'Summon Elder Dragon (2-slot)' },
    ],
  },
  {
    key: 'Inferno',
    name: 'Inferno',
    description: 'Inferno units burn enemies for a percentage of the damage dealt.',
    breakpoints: [
      { count: 2, bonus: 'Burns enemies for 10% of damage dealt' },
      { count: 4, bonus: 'Burns enemies for 25% of damage dealt' },
      { count: 6, bonus: 'Burns enemies for 50% of damage dealt' },
    ],
  },
  {
    key: 'Coven',
    name: 'Coven',
    description: 'Elect a Coven Leader who gains Ability Power and Mana.',
    breakpoints: [
      { count: 2, bonus: 'Elects a Coven Leader to gain bonus AP' },
      { count: 4, bonus: 'Coven Leader gains more AP and starting mana' },
    ],
  },
  {
    key: 'Ravager',
    name: 'Ravager',
    description: 'Ravagers gain Omnivamp and bonus damage.',
    breakpoints: [
      { count: 2, bonus: 'Ravagers gain 15% omnivamp and 10% bonus damage' },
      { count: 4, bonus: 'Ravagers gain 30% omnivamp and 25% bonus damage' },
    ],
  },
];

const mockItems = [
  {
    id: 'TFT18_BFSword',
    name: 'B.F. Sword',
    description: 'Attack Damage +15',
    components: [],
    effects: [{ name: 'AD', value: 0.15 }],
    imageUrl: 'https://example.com/bfsword.png',
    unique: false,
    trait: null,
  },
  {
    id: 'TFT18_ChainVest',
    name: 'Chain Vest',
    description: 'Armor +25',
    components: [],
    effects: [{ name: 'Armor', value: 25 }],
    imageUrl: 'https://example.com/chainvest.png',
    unique: false,
    trait: null,
  },
  {
    id: 'TFT18_EdgeOfNight',
    name: 'Edge of Night',
    description: 'Wearer dodges the first attack that would\'ve killed them.',
    components: ['TFT18_BFSword', 'TFT18_ChainVest'],
    effects: [],
    imageUrl: 'https://example.com/edgeofnight.png',
    unique: true,
    trait: null,
  },
];

const mockAugments = [
  {
    id: 'TFT9_Augment_CyberneticBulk3',
    name: 'Cybernetic Bulk III',
    description: 'Your team gains Health.',
    imageUrl: 'https://example.com/augment-cybernetic.png',
  },
  {
    id: 'TFT18_UnknownBehaviorAugment',
    name: 'Unknown Behavior Augment',
    description: 'A behavioral augment the engine does not model yet.',
    imageUrl: 'https://example.com/augment-unknown.png',
  },
];

const mockSets = [
  {
    setId: 18,
    setName: 'Enchanted Wilds',
    status: 'active',
    champions: mockChampions.map(c => c.id),
    traits: mockTraits.map(t => t.key),
    items: mockItems.map(i => i.id),
    augments: [],
    mechanics: { wisp: 'Wisps mechanic activated' },
  },
  {
    setId: 17,
    setName: 'Set 17',
    status: 'archived',
    champions: [],
    traits: [],
    items: [],
    augments: [],
    mechanics: {},
  },
];

const mockCompositions = [
  {
    id: 'test-comp-1',
    title: 'Blossom Ravagers',
    description: 'A strong Blossom Ravager composition',
    setId: 18,
    championIds: ['TFT18_Akali', 'TFT18_Camille', 'TFT18_Taric'],
    traitBonuses: ['Blossom: 3', 'Ravager: 2'],
    augmentRecommendations: ['Wisp Catalyst', 'Beast Tamer'],
    difficulty: 'Intermediate',
    region: 'Runeterra',
    meta: {
      winrate: 52.3,
      avg_placement: 3.8,
      playrate: 0.05,
      contest_rate: 0.12,
      difficulty: 3,
      playstyle: 'Standard',
      patch: '14.18',
      cost: 28,
    },
    champions: [
      { id: 'TFT18_Akali', name: 'Akali', star_level: 2, position: { x: 2, y: 1 }, items: ['TFT18_EdgeOfNight'], is_core: true, priority: 'High', cost: 1, traits: ['Inferno', 'Adaptor', 'Ravager'], health: 600, attack_damage: 55, ability_name: 'Kunai Strike', icon_url: 'https://example.com/akali.png' },
      { id: 'TFT18_Camille', name: 'Camille', star_level: 2, position: { x: 3, y: 1 }, items: ['TFT18_BFSword'], is_core: true, priority: 'High', cost: 1, traits: ['Coven', 'Ravager'], health: 650, attack_damage: 60, ability_name: 'Defensive Sweep', icon_url: 'https://example.com/camille.png' },
      { id: 'TFT18_Taric', name: 'Taric', star_level: 3, position: { x: 1, y: 2 }, items: ['TFT18_ChainVest'], is_core: true, priority: 'High', cost: 5, traits: ['Emerald Aspect', 'Vanguard'], health: 900, attack_damage: 70, ability_name: 'Emerald Radiance', icon_url: 'https://example.com/taric.png' },
    ],
    augments: {
      preferred: ['Wisp Catalyst', 'Beast Tamer'],
    },
    tags: ['Blossom', 'Ravager', 'Carry'],
  },
];

export const handlers = [
  graphql.query('GetChampions', () => {
    return HttpResponse.json({ data: { champions: mockChampions } });
  }),
  graphql.query('GetTraits', () => {
    return HttpResponse.json({ data: { traits: mockTraits } });
  }),
  graphql.query('GetItems', () => {
    return HttpResponse.json({ data: { items: mockItems } });
  }),
  graphql.query('GetSets', () => {
    return HttpResponse.json({ data: { sets: mockSets } });
  }),
  graphql.query('GetCompositions', () => {
    return HttpResponse.json({ data: { compositions: mockCompositions } });
  }),
  graphql.query('GetComposition', ({ variables }) => {
    const comp = mockCompositions.find(c => c.id === variables.id);
    if (!comp) {
      return HttpResponse.json({ data: { composition: null } });
    }
    return HttpResponse.json({ data: { composition: comp } });
  }),
  graphql.query('GetSet', ({ variables }) => {
    const set = mockSets.find(s => s.setId === variables.setId);
    if (!set) {
      return HttpResponse.json({ data: { set: null } });
    }
    return HttpResponse.json({ data: { set: { ...set, champions: mockChampions, traits: mockTraits, items: mockItems } } });
  }),
  graphql.query('GetActiveSet', () => {
    return HttpResponse.json({
      data: {
        activeSet: {
          setId: 18,
          setName: 'Enchanted Wilds',
          status: 'active',
          champions: mockChampions,
          traits: mockTraits,
          items: mockItems,
          augments: mockAugments,
        },
      },
    });
  }),
  graphql.mutation('CreateComposition', ({ variables }) => {
    const newComp = {
      id: `test-comp-${Date.now()}`,
      ...variables.input,
    };
    mockCompositions.push(newComp);
    return HttpResponse.json({ data: { createComposition: newComp } });
  }),
];