import { describe, it, expect } from 'vitest';
import { DataTransformer } from './DataTransformer';

describe('DataTransformer', () => {
  describe('champion URL construction', () => {
    it('should build champion portrait URL from name', () => {
      const url = DataTransformer.buildChampionPortraitUrl('Ahri');
      expect(url).toBe(
        'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/champion-portraits/Ahri.png'
      );
    });

    it('should encode spaces in names', () => {
      const url = DataTransformer.buildChampionPortraitUrl('Lee Sin');
      expect(url).toContain('Lee%20Sin');
    });
  });

  describe('dragontail champion parsing', () => {
    it('should extract champion ID from raw dragontail entry', () => {
      const raw = {
        id: 'TFT16_Ahri',
        name: 'Ahri',
        cost: 2,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 650, mana: 40, damage: 50 },
        ability: { name: 'Orb of Deception', variables: { Damage: [150, 225, 335] } },
      };
      const champion = DataTransformer.parseChampion(raw);
      expect(champion).toHaveProperty('id', 'TFT16_Ahri');
      expect(champion).toHaveProperty('name', 'Ahri');
      expect(champion).toHaveProperty('cost', 2);
      expect(champion.imageUrl).toContain('Ahri.png');
    });

    it('should handle champions with missing fields', () => {
      const raw = { id: 'TFT16_Test', name: 'Test' };
      const champion = DataTransformer.parseChampion(raw);
      expect(champion).toHaveProperty('id', 'TFT16_Test');
      expect(champion.stats).toBeDefined();
      expect(champion.ability).toBeDefined();
    });
  });

  describe('dragontail trait parsing', () => {
    it('should parse a trait with breakpoints', () => {
      const raw = {
        key: 'Arcane',
        name: 'Arcane',
        description: 'Grants Ability Power',
        breakpoints: [{ count: 2, bonus: '+20 AP' }],
      };
      const trait = DataTransformer.parseTrait(raw);
      expect(trait).toHaveProperty('key', 'Arcane');
      expect(trait.breakpoints).toHaveLength(1);
    });

    it('should handle traits without explicit breakpoints', () => {
      const raw = { key: 'TestTrait', name: 'Test' };
      const trait = DataTransformer.parseTrait(raw);
      expect(trait.breakpoints).toEqual([]);
    });
  });

  describe('dragontail item parsing', () => {
    it('should extract item with components', () => {
      const raw = {
        id: 'TFT16_BFSword',
        name: 'B.F. Sword',
        description: 'Attack Damage +15',
        components: [],
      };
      const item = DataTransformer.parseItem(raw);
      expect(item).toHaveProperty('id', 'TFT16_BFSword');
      expect(item.components).toEqual([]);
    });

    it('should handle items with from field as components', () => {
      const raw = {
        id: 'TFT16_EdgeOfNight',
        name: 'Edge of Night',
        from: ['TFT16_BFSword', 'TFT16_ChainVest'],
      };
      const item = DataTransformer.parseItem(raw);
      expect(item.components).toContain('TFT16_BFSword');
    });
  });

  describe('set assembly', () => {
    it('should assemble full set data from parsed pieces', () => {
      const data = DataTransformer.parseSetData(16, 'Test Set', {
        champions: [{ id: 'TFT16_Test', name: 'Test' }],
        traits: [{ key: 'TestTrait' }],
        items: [],
      });
      expect(data.setId).toBe(16);
      expect(data.champions).toHaveLength(1);
      expect(data.traits).toHaveLength(1);
      expect(data.items).toHaveLength(0);
    });
  });
});
