import { ISetData, ISetChampion, ITrait, IItem } from '../../interfaces';

export class EmbeddedFallback {
  static getSetData(setId: number): ISetData | null {
    const SET16_DATA: ISetData = {
      setId: 16,
      setName: "Lore & Legends",
      status: 'active',
      champions: EmbeddedFallback.getEmbeddedChampions(),
      traits: EmbeddedFallback.getEmbeddedTraits(),
      items: EmbeddedFallback.getEmbeddedItems(),
      augments: EmbeddedFallback.getAugmentsForSet16(),
      mechanics: {},
    };

    const SET18_DATA: ISetData = {
      setId: 18,
      setName: "Enchanted Wilds",
      status: 'active',
      champions: EmbeddedFallback.getChampionsForSet18(),
      traits: EmbeddedFallback.getTraitsForSet18(),
      items: EmbeddedFallback.getItemsForSet18(),
      augments: EmbeddedFallback.getAugmentsForSet18(),
      mechanics: { wisp: "Wisps mechanic activated" },
    };

    const sets: Record<number, ISetData> = { 16: SET16_DATA, 18: SET18_DATA };
    return sets[setId] ?? null;
  }

  static getChampions(setId: number): ISetChampion[] | null {
    const data = this.getSetData(setId);
    return data?.champions ?? null;
  }

  static getTraits(setId: number): ITrait[] | null {
    const data = this.getSetData(setId);
    return data?.traits ?? null;
  }

  static getItems(setId: number): IItem[] | null {
    const data = this.getSetData(setId);
    return data?.items ?? null;
  }

  private static getEmbeddedChampions(): ISetChampion[] {
    return [
      {
        id: 'TFT16_Ahri',
        name: 'Ahri',
        cost: 2,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 650, mana: 40, damage: 50 },
        ability: {
          name: 'Orb of Deception',
          variables: [
            { name: 'Damage', values: [150, 225, 335] },
            { name: 'Mana', values: [30, 30, 30] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103.png',
        splashUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_ahri.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103.png'
      },
      {
        id: 'TFT16_Akali',
        name: 'Akali',
        cost: 3,
        traits: ['Ninja', 'Assassin'],
        stats: { hp: 700, mana: 60, damage: 70 },
        ability: {
          name: 'Five Point Strike',
          variables: [
            { name: 'Damage', values: [300, 450, 675] },
            { name: 'Mana', values: [60, 60, 60] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png',
        splashUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_akali.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png'
      },
      {
        id: 'TFT16_Ashe',
        name: 'Ashe',
        cost: 3,
        traits: ['Frost', 'Ranger'],
        stats: { hp: 650, mana: 70, damage: 65 },
        ability: {
          name: 'Enchanted Crystal Arrow',
          variables: [
            { name: 'Damage', values: [500, 750, 1125] },
            { name: 'Mana', values: [70, 70, 70] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22.png',
        splashUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_ashe.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22.png'
      },
      {
        id: 'TFT16_Jinx',
        name: 'Jinx',
        cost: 4,
        traits: ['Arcane', 'Gunner'],
        stats: { hp: 750, mana: 80, damage: 75 },
        ability: {
          name: 'Super Mega Death Rocket!',
          variables: [
            { name: 'Damage', values: [400, 600, 900] },
            { name: 'Mana', values: [80, 80, 80] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222.png',
        splashUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_jinx.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222.png'
      },
      {
        id: 'TFT16_Lux',
        name: 'Lux',
        cost: 3,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 650, mana: 60, damage: 45 },
        ability: {
          name: 'Final Spark',
          variables: [
            { name: 'Damage', values: [350, 525, 788] },
            { name: 'Mana', values: [60, 60, 60] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png',
        splashUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_lux.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png'
      }
    ];
  }

  private static getEmbeddedTraits(): ITrait[] {
    return [
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
    ];
  }

  private static getEmbeddedItems(): IItem[] {
    return [
      {
        id: 'TFT16_BFSword',
        name: 'B.F. Sword',
        description: 'Attack Damage +15',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_bfsword.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT16_ChainVest',
        name: 'Chain Vest',
        description: 'Armor +25',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_chainvest.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT16_NeedlesslyLargeRod',
        name: 'Needlessly Large Rod',
        description: 'Ability Power +15',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_needlesslylargerod.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT16_EdgeOfNight',
        name: 'Edge of Night',
        description: 'Wearer dodges the first attack that would\'ve killed them, and is invulnerable for a short duration.',
        components: ['TFT16_BFSword', 'TFT16_ChainVest'],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_bfsword.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT16_InfinityEdge',
        name: 'Infinity Edge',
        description: 'Critical Strikes deal +100% damage. Critical Strike Chance +75%',
        components: ['TFT16_BFSword', 'TFT16_SparringGloves'],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_sparringgloves.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT16_RabadonsDeathcap',
        name: 'Rabadon\'s Deathcap',
        description: 'Ability Power +75%',
        components: ['TFT16_NeedlesslyLargeRod', 'TFT16_NeedlesslyLargeRod'],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_needlesslylargerod.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT16_GiantSlayer',
        name: 'Giant Slayer',
        description: 'Attacks and abilities deal 25% more damage to enemies with more Maximum Health than the wearer.',
        components: ['TFT16_RecurveBow', 'TFT16_BFSword'],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_recurvebow.png',
        unique: false,
        trait: undefined
      }
    ];
  }

  private static getAugmentsForSet16(): any[] {
    return [
      {
        id: 'arcane-nullifier',
        name: 'Arcane Nullifier',
        description: 'Combat start: Your units purge the enemies at the start of combat, causing them to take 25% more magic damage until they cast their ability.',
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/hextechaugments/tft-hexaug-choicecard_base.png'
      },
      {
        id: 'backfoot',
        name: 'Backfoot',
        description: 'Combat start: Your highest-starred unit gains 30% Attack Speed and is immune to crowd control for 10 seconds.',
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/hextechaugments/tft-hexaug-choicecard_base.png'
      },
      {
        id: 'balanced-diet',
        name: 'Balanced Diet',
        description: 'Every 4 exp gives 1 temporary item component. Gain 2 exp.',
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/hextechaugments/tft-hexaug-choicecard_base.png'
      },
      {
        id: 'big-spear',
        name: 'Big Spear',
        description: 'Your units gain 25% Attack Range and 15% Attack Damage.',
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/hextechaugments/tft-hexaug-choicecard_base.png'
      }
    ];
  }

  private static getChampionsForSet18(): ISetChampion[] {
    return [
      {
        id: 'TFT18_Akali',
        name: 'Akali',
        cost: 1,
        traits: ['Inferno', 'Adaptor', 'Ravager'],
        stats: { hp: 600, mana: 50, damage: 55 },
        ability: {
          name: 'Kunai Strike',
          variables: [
            { name: 'Damage', values: [150, 225, 335] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png'
      },
      {
        id: 'TFT18_Camille',
        name: 'Camille',
        cost: 1,
        traits: ['Coven', 'Ravager'],
        stats: { hp: 650, mana: 60, damage: 60 },
        ability: {
          name: 'Defensive Sweep',
          variables: [
            { name: 'Damage', values: [180, 270, 400] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/164.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/164.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/164.png'
      },
      {
        id: 'TFT18_Cinderling',
        name: 'Cinderling',
        cost: 1,
        traits: ['Riftbeast', 'Hunter'],
        stats: { hp: 550, mana: 40, damage: 50 },
        ability: {
          name: 'Razor Leaves',
          variables: [
            { name: 'Damage', values: [120, 180, 270] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/cinderling.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/cinderling.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/cinderling.png'
      },
      {
        id: 'TFT18_Taric',
        name: 'Taric',
        cost: 5,
        traits: ['Emerald Aspect', 'Vanguard'],
        stats: { hp: 900, mana: 100, damage: 70 },
        ability: {
          name: 'Emerald Radiance',
          variables: [
            { name: 'Shield', values: [400, 600, 2000] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/44.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/44.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/44.png'
      },
      {
        id: 'TFT18_Varus',
        name: 'Varus',
        cost: 4,
        traits: ['Inferno', 'Rapidfire'],
        stats: { hp: 700, mana: 80, damage: 65 },
        ability: {
          name: 'Piercing Arrow',
          variables: [
            { name: 'Damage', values: [350, 550, 1500] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/110.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/110.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/110.png'
      },
      {
        id: 'TFT18_Karma',
        name: 'Karma',
        cost: 3,
        traits: ['Blossom', 'Spellweaver'],
        stats: { hp: 650, mana: 60, damage: 45 },
        ability: {
          name: 'Karma Spell',
          variables: [
            { name: 'Damage', values: [220, 330, 500] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/43.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/43.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/43.png'
      },
      {
        id: 'TFT18_Kobuko',
        name: 'Kobuko',
        cost: 2,
        traits: ['Sprykin', 'Brawler'],
        stats: { hp: 750, mana: 70, damage: 50 },
        ability: {
          name: 'Kobuko Shield',
          variables: [
            { name: 'Heal', values: [200, 250, 300] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/901.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/901.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/901.png'
      },
      {
        id: 'TFT18_Ornn',
        name: 'Ornn',
        cost: 4,
        traits: ['Elderwood', 'Defender'],
        stats: { hp: 850, mana: 90, damage: 65 },
        ability: {
          name: 'Elderwood Ram',
          variables: [
            { name: 'StunDuration', values: [1.5, 2, 8] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/516.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/516.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/516.png'
      },
      {
        id: 'TFT18_Leona',
        name: 'Leona',
        cost: 2,
        traits: ['Solar', 'Defender'],
        stats: { hp: 700, mana: 60, damage: 50 },
        ability: {
          name: 'Solar Shield',
          variables: [
            { name: 'ArmorBonus', values: [30, 45, 75] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/89.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/89.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/89.png'
      },
      {
        id: 'TFT18_Lux',
        name: 'Lux',
        cost: 3,
        traits: ['Avatar', 'Blossom'],
        stats: { hp: 600, mana: 50, damage: 40 },
        ability: {
          name: 'Final Spark',
          variables: [
            { name: 'Damage', values: [300, 450, 675] }
          ]
        },
        imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png',
        splashUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png',
        iconUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png'
      }
    ];
  }

  private static getTraitsForSet18(): ITrait[] {
    return [
      {
        key: 'Blossom',
        name: 'Blossom',
        description: 'Blossom units empower your Wisps and gain AD, AP, and Health.',
        breakpoints: [
          { count: 3, bonus: 'Wisps are upgraded' },
          { count: 5, bonus: 'Wisps appear in every shop' },
          { count: 7, bonus: 'Gain gold after buying a Wisp' },
          { count: 9, bonus: 'You can buy 2 Wisps per round' },
          { count: 11, bonus: 'Wisps overflow with power' }
        ]
      },
      {
        key: 'Riftbeast',
        name: 'Riftbeast',
        description: 'Summon powerful jungle creatures onto the battlefield.',
        breakpoints: [
          { count: 2, bonus: 'Summon Murkwolf' },
          { count: 4, bonus: 'Summon Krug' },
          { count: 6, bonus: 'Summon Gromp' },
          { count: 8, bonus: 'Summon Elder Dragon (2-slot)' }
        ]
      },
      {
        key: 'Inferno',
        name: 'Inferno',
        description: 'Inferno units burn enemies for a percentage of the damage dealt.',
        breakpoints: [
          { count: 2, bonus: 'Burns enemies for 10% of damage dealt' },
          { count: 4, bonus: 'Burns enemies for 25% of damage dealt' },
          { count: 6, bonus: 'Burns enemies for 50% of damage dealt' }
        ]
      },
      {
        key: 'Coven',
        name: 'Coven',
        description: 'Elect a Coven Leader who gains Ability Power and Mana.',
        breakpoints: [
          { count: 2, bonus: 'Elects a Coven Leader to gain bonus AP' },
          { count: 4, bonus: 'Coven Leader gains more AP and starting mana' }
        ]
      },
      {
        key: 'Ravager',
        name: 'Ravager',
        description: 'Ravagers gain Omnivamp and bonus damage.',
        breakpoints: [
          { count: 2, bonus: 'Ravagers gain 15% omnivamp and 10% bonus damage' },
          { count: 4, bonus: 'Ravagers gain 30% omnivamp and 25% bonus damage' }
        ]
      }
    ];
  }

  private static getItemsForSet18(): IItem[] {
    return [
      {
        id: 'TFT18_BFSword',
        name: 'B.F. Sword',
        description: 'Attack Damage +15',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_bfsword.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT18_ChainVest',
        name: 'Chain Vest',
        description: 'Armor +25',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_chainvest.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT18_NeedlesslyLargeRod',
        name: 'Needlessly Large Rod',
        description: 'Ability Power +15',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_needlesslylargerod.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT18_EdgeOfNight',
        name: 'Edge of Night',
        description: 'Wearer dodges the first attack that would\'ve killed them, and is invulnerable for a short duration.',
        components: ['TFT18_BFSword', 'TFT18_ChainVest'],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_bfsword.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT18_InfinityEdge',
        name: 'Infinity Edge',
        description: 'Critical Strikes deal +100% damage. Critical Strike Chance +75%',
        components: ['TFT18_BFSword', 'TFT18_SparringGloves'],
        imageUrl: 'https://raw.communitydragon.org/latest/game/assets/ux/tft/championsplashes/tft_shopitem_sparringgloves.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT18_RabadonsDeathcap',
        name: 'Rabadon\'s Deathcap',
        description: 'Ability Power +75%',
        components: ['TFT18_NeedlesslyLargeRod', 'TFT18_NeedlesslyLargeRod'],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/rabadonsdeathcap.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT18_GiantSlayer',
        name: 'Giant Slayer',
        description: 'Attacks and abilities deal 25% more damage to enemies with more Maximum Health than the wearer.',
        components: ['TFT18_RecurveBow', 'TFT18_BFSword'],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/giantslayer.png',
        unique: false,
        trait: undefined
      }
    ];
  }

  private static getAugmentsForSet18(): any[] {
    return [
      {
        id: 'wisp-catalyst',
        name: 'Wisp Catalyst',
        description: 'Your Blossom units gain extra stats whenever you buy a Wisp.',
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
      },
      {
        id: 'beast-tamer',
        name: 'Beast Tamer',
        description: 'Riftbeasts gain extra health and attack speed.',
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
      },
      {
        id: 'solar-eclipse',
        name: 'Solar Eclipse',
        description: 'Solar and Lunar units combine to deal massive damage.',
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
      }
    ];
  }
}
