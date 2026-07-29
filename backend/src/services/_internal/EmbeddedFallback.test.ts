import { describe, it, expect } from 'vitest';
import { EmbeddedFallback } from './EmbeddedFallback';

describe('EmbeddedFallback', () => {
  it('should return set 16 data with champions, traits, items, augments', () => {
    const data = EmbeddedFallback.getSetData(16);
    expect(data).not.toBeNull();
    expect(data!.champions.length).toBeGreaterThan(0);
    expect(data!.traits.length).toBeGreaterThan(0);
    expect(data!.items.length).toBeGreaterThan(0);
    expect(data!.augments.length).toBeGreaterThan(0);
  });

  it('should return null for unknown set', () => {
    const data = EmbeddedFallback.getSetData(99);
    expect(data).toBeNull();
  });

  it('each champion should have required fields', () => {
    const champions = EmbeddedFallback.getChampions(16);
    expect(champions!.length).toBe(5);
    for (const c of champions!) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('cost');
      expect(c).toHaveProperty('traits');
      expect(c).toHaveProperty('stats');
      expect(c).toHaveProperty('ability');
    }
  });

  it('each trait should have required fields', () => {
    const traits = EmbeddedFallback.getTraits(16);
    expect(traits!.length).toBe(5);
    for (const t of traits!) {
      expect(t).toHaveProperty('key');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('breakpoints');
    }
  });

  it('each item should have required fields', () => {
    const items = EmbeddedFallback.getItems(16);
    expect(items!.length).toBe(7);
    for (const i of items!) {
      expect(i).toHaveProperty('id');
      expect(i).toHaveProperty('name');
      expect(i).toHaveProperty('components');
    }
  });

  it('should return null for unknown set champions', () => {
    expect(EmbeddedFallback.getChampions(99)).toBeNull();
  });
});
