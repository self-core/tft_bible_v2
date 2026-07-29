import { describe, it, expect } from 'vitest';
import { CDragonTransformer } from './CDragonTransformer';
import { TftRawData, RawCDragonChampion, RawCDragonTrait, RawCDragonItem } from './CDragonService';

const MOCK_CDN_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1';

describe('CDragonTransformer', () => {
  describe('transformChampion', () => {
    it('maps champion fields correctly', () => {
      const raw: RawCDragonChampion = {
        apiName: 'TFT17_Vex',
        name: 'Vex',
        cost: 3,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 700, mana: 60, initialMana: 0, armor: 25, magicResist: 25, attackSpeed: 0.7, damage: 50, range: 3, critChance: 0.25, critMultiplier: 1.4 },
        ability: { name: 'Shadow Burst', desc: 'Deals magic damage', variables: [{ name: 'Damage', value: [200, 300, 450] }] },
        icon: 'ASSETS/UX/TFT/ChampionSplashes/TFT17_Vex.tex',
        squareIcon: 'ASSETS/UX/TFT/ChampionSplashes/TFT17_Vex_Mobile.tex',
      };

      const result = CDragonTransformer.transformChampion(raw, MOCK_CDN_BASE);

      expect(result.id).toBe('TFT17_Vex');
      expect(result.name).toBe('Vex');
      expect(result.cost).toBe(3);
      expect(result.traits).toEqual(['Arcane', 'Sorcerer']);
      expect(result.stats).toEqual({ hp: 700, mana: 60, damage: 50 });
      expect(result.ability.name).toBe('Shadow Burst');
      expect(result.ability.variables).toEqual([{ name: 'Damage', values: [200, 300, 450] }]);
      expect(result.imageUrl).toBe(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/assets/ux/tft/championsplashes/tft17_vex_mobile.png'
      );
    });

    it('handles missing stats gracefully', () => {
      const raw = {
        apiName: 'TFT17_Test',
        name: 'Test',
        cost: 1,
        traits: [],
        stats: undefined,
        ability: undefined,
        icon: '',
        squareIcon: '',
      } as unknown as RawCDragonChampion;

      const result = CDragonTransformer.transformChampion(raw, MOCK_CDN_BASE);

      expect(result.stats).toEqual({ hp: 600, mana: 40, damage: 50 });
      expect(result.ability).toEqual({ name: '', variables: [] });
    });
  });

  describe('transformTrait', () => {
    it('maps trait with effects to breakpoints', () => {
      const raw: RawCDragonTrait = {
        apiName: 'TFT17_Arcane',
        name: 'Arcane',
        desc: 'Arcane units gain mana',
        effects: [
          { minUnits: 2, maxUnits: 3, style: null, variables: [{ name: 'Mana', value: [20] }] },
          { minUnits: 4, maxUnits: 5, style: null, variables: [{ name: 'Mana', value: [50] }] },
        ],
        icon: '',
      };

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.key).toBe('TFT17_Arcane');
      expect(result.name).toBe('Arcane');
      expect(result.description).toBe('Arcane units gain mana');
      expect(result.breakpoints).toHaveLength(2);
      expect(result.breakpoints[0]).toEqual({ count: 2, bonus: 'Mana: 20' });
      expect(result.breakpoints[1]).toEqual({ count: 4, bonus: 'Mana: 50' });
    });

    it('handles missing effects and description', () => {
      const raw = {
        apiName: 'TFT17_Test',
        name: '',
        desc: '',
        effects: null,
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.key).toBe('TFT17_Test');
      expect(result.name).toBe('TFT17_Test');
      expect(result.description).toBe('');
      expect(result.breakpoints).toEqual([]);
    });
  });

  describe('transformItem', () => {
    it('maps item fields', () => {
      const raw: RawCDragonItem = {
        apiName: 'TFT17_BFSword',
        name: 'B.F. Sword',
        description: '+15 Attack Damage',
        icon: '',
      };

      const result = CDragonTransformer.transformItem(raw, MOCK_CDN_BASE);

      expect(result.id).toBe('TFT17_BFSword');
      expect(result.name).toBe('B.F. Sword');
      expect(result.description).toBe('+15 Attack Damage');
      expect(result.components).toEqual([]);
      expect(result.imageUrl).toBeNull();
    });

    it('builds imageUrl from icon field', () => {
      const raw: RawCDragonItem = {
        apiName: 'TFT17_BFSword',
        name: 'B.F. Sword',
        description: 'AD',
        icon: 'ASSETS/UX/TFT/ItemIcons/BFSword.tex',
      };

      const result = CDragonTransformer.transformItem(raw, MOCK_CDN_BASE);

      expect(result.imageUrl).toBe(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/assets/ux/tft/itemicons/bfsword.png'
      );
    });
  });

  describe('transformAugment', () => {
    it('maps raw CDragon augment to GraphQL shape', () => {
      const raw = {
        apiName: 'TFT17_Aug1',
        name: 'Arcane Empowerment',
        desc: 'Your Arcane units gain 30 AP',
        icon: 'ASSETS/UX/TFT/Augments/Arcane.tex',
      };

      const result = CDragonTransformer.transformAugment(raw, MOCK_CDN_BASE);

      expect(result.id).toBe('TFT17_Aug1');
      expect(result.name).toBe('Arcane Empowerment');
      expect(result.description).toBe('Your Arcane units gain 30 AP');
      expect(result.imageUrl).toContain('arcane.png');
    });

    it('handles missing fields', () => {
      const result = CDragonTransformer.transformAugment({}, MOCK_CDN_BASE);

      expect(result.id).toBe('');
      expect(result.name).toBe('');
      expect(result.description).toBe('');
      expect(result.imageUrl).toBeNull();
    });
  });

  describe('transformSet', () => {
    it('aggregates champions/traits across all setData categories by TFT prefix', () => {
      const raw: TftRawData = {
        setData: {
          '0': {
            name: 'Category0',
            champions: [
              {
                apiName: 'TFT17_Ahri',
                name: 'Ahri',
                cost: 4,
                traits: ['Arcane', 'Sorcerer'],
                stats: { hp: 800, mana: 40, initialMana: 0, armor: 20, magicResist: 20, attackSpeed: 0.75, damage: 55, range: 3, critChance: 0.25, critMultiplier: 1.4 },
                ability: { name: 'Orb', desc: '', variables: [{ name: 'Dmg', value: [300, 450, 675] }] },
                icon: '',
                squareIcon: '',
              } as RawCDragonChampion,
            ],
            traits: [
              {
                apiName: 'TFT17_Arcane',
                name: 'Arcane',
                desc: 'Mana on cast',
                effects: [{ minUnits: 2, maxUnits: 3, style: null, variables: [{ name: 'Mana', value: [20] }] }],
                icon: '',
              } as RawCDragonTrait,
            ],
          },
          '5': {
            name: 'Category5',
            champions: [
              {
                apiName: 'TFT17_Garen',
                name: 'Garen',
                cost: 1,
                traits: ['Fortress'],
                stats: { hp: 650, mana: 50, initialMana: 0, armor: 35, magicResist: 25, attackSpeed: 0.6, damage: 45, range: 1, critChance: 0.25, critMultiplier: 1.4 },
                ability: { name: 'Spin', desc: '', variables: [] },
                icon: '',
                squareIcon: '',
              } as RawCDragonChampion,
              {
                apiName: 'TFT16_Renekton',
                name: 'Renekton',
                cost: 1,
                traits: [],
                stats: { hp: 600, mana: 0, initialMana: 0, armor: 25, magicResist: 25, attackSpeed: 0.65, damage: 50, range: 1, critChance: 0.25, critMultiplier: 1.4 },
                ability: { name: '', desc: '', variables: [] },
                icon: '',
                squareIcon: '',
              } as unknown as RawCDragonChampion,
            ],
            traits: [
              {
                apiName: 'TFT17_Fortress',
                name: 'Fortress',
                desc: 'Bonus defenses',
                effects: [],
                icon: '',
              } as RawCDragonTrait,
            ],
          },
        },
        items: [
          { apiName: 'TFT17_BFSword', name: 'B.F. Sword', description: 'AD', icon: '' } as RawCDragonItem,
          { apiName: 'TFT17_Rabadon', name: 'Rabadon', description: 'AP', icon: '' } as RawCDragonItem,
          { apiName: 'TFT16_BFSword', name: 'B.F. Sword', description: 'AD', icon: '' } as RawCDragonItem,
        ],
        augments: [
          { apiName: 'TFT17_Aug1', name: 'Augment 1', desc: 'Test augment', icon: '' },
          { apiName: 'TFT16_AugOld', name: 'Old Aug', desc: '', icon: '' },
        ],
      };

      const result = CDragonTransformer.transformSet(raw, 17, MOCK_CDN_BASE);

      expect(result.setName).toBe('Set 17');
      expect(result.champions).toHaveLength(2);
      expect(result.champions.map((c) => c.id)).toEqual(['TFT17_Ahri', 'TFT17_Garen']);
      expect(result.traits).toHaveLength(2);
      expect(result.traits.map((t) => t.key)).toEqual(['TFT17_Arcane', 'TFT17_Fortress']);
      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.id)).toEqual(['TFT17_BFSword', 'TFT17_Rabadon']);
      expect(result.augments).toHaveLength(1);
      expect(result.augments[0]).toMatchObject({ id: 'TFT17_Aug1', name: 'Augment 1', description: 'Test augment' });
    });

    it('returns empty arrays when no setData exists', () => {
      const raw: TftRawData = { setData: {}, items: [], augments: [] };

      const result = CDragonTransformer.transformSet(raw, 99, MOCK_CDN_BASE);

      expect(result.champions).toEqual([]);
      expect(result.traits).toEqual([]);
      expect(result.items).toEqual([]);
      expect(result.augments).toEqual([]);
    });
  });
});
