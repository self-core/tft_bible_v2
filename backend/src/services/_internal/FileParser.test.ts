import { describe, it, expect } from 'vitest';
import { FileParser } from './FileParser';

describe('FileParser', () => {
  describe('parseChampionFile', () => {
    it('should parse champions from nested dragontail format', () => {
      const json = {
        type: 'champion',
        version: '16.0.0',
        data: {
          'TFTSet16_Ahri': { id: 'TFT16_Ahri', name: 'Ahri', cost: 4, traits: ['Arcane'], stats: { hp: 800, mana: 40, damage: 45 }, ability: { name: 'Orb', variables: { Damage: [200, 350] } } },
        },
      };
      const champions = FileParser.parseChampionFile(json, 16);
      expect(champions).toHaveLength(1);
      expect(champions[0].id).toBe('TFT16_Ahri');
    });

    it('should return empty array for null input', () => {
      expect(FileParser.parseChampionFile(null, 16)).toEqual([]);
    });
  });

  describe('parseTraitFile', () => {
    it('should parse traits with effects as breakpoints', () => {
      const json = {
        type: 'trait',
        version: '16.0.0',
        data: {
          'TFTSet16_Arcane': { id: 'TFT16_Arcane', key: 'Arcane', name: 'Arcane', description: 'AP bonus', effects: [{ numUnits: 2, effect: '+20 AP' }] },
        },
      };
      const traits = FileParser.parseTraitFile(json, 16);
      expect(traits).toHaveLength(1);
      expect(traits[0].key).toBe('Arcane');
      expect(traits[0].breakpoints[0].count).toBe(2);
    });
  });

  describe('parseItemFile', () => {
    it('should parse items with from array', () => {
      const json = {
        type: 'item',
        version: '16.0.0',
        data: {
          'Set16_BFSword': { id: 'TFT16_BFSword', name: 'B.F. Sword', description: 'AD', from: [] },
        },
      };
      const items = FileParser.parseItemFile(json, 16);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('TFT16_BFSword');
    });
  });

  describe('readJsonFile', () => {
    it('should return null for non-existent file', () => {
      const result = FileParser.readJsonFile('/nonexistent/path.json');
      expect(result).toBeNull();
    });
  });
});
