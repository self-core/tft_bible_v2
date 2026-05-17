import { describe, it, expect, beforeEach } from 'vitest';
import { ResultCache } from './ResultCache';

function makeData(setId: number) {
  return { setId, setName: `Set ${setId}`, champions: [], traits: [], items: [], augments: [], mechanics: {} };
}

describe('ResultCache', () => {
  let cache: ResultCache;

  beforeEach(() => {
    cache = new ResultCache();
  });

  it('should return null on first get', () => {
    expect(cache.get(16)).toBeNull();
  });

  it('should return data after set', () => {
    const data = makeData(16);
    cache.set(16, data);
    expect(cache.get(16)).toBe(data);
  });

  it('should return null for uncached set after other sets cached', () => {
    cache.set(16, makeData(16));
    expect(cache.get(17)).toBeNull();
  });

  it('should clear a specific set', () => {
    cache.set(16, makeData(16));
    cache.clear(16);
    expect(cache.get(16)).toBeNull();
  });

  it('should clear all sets', () => {
    cache.set(16, makeData(16));
    cache.set(17, makeData(17));
    cache.clearAll();
    expect(cache.get(16)).toBeNull();
    expect(cache.get(17)).toBeNull();
  });
});
