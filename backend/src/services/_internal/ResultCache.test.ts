import { describe, it, expect, beforeEach } from 'vitest';
import { ResultCache } from './ResultCache';
import { ISetData } from '../../interfaces';

describe('ResultCache', () => {
  let cache: ResultCache;

  beforeEach(() => {
    cache = new ResultCache();
  });

  it('should return null on first get', () => {
    expect(cache.get(16)).toBeNull();
  });

  it('should return data after set', () => {
    const data = { setId: 16, champions: [] } as ISetData;
    cache.set(16, data);
    expect(cache.get(16)).toBe(data);
  });

  it('should return null for uncached set after other sets cached', () => {
    cache.set(16, { setId: 16 } as ISetData);
    expect(cache.get(17)).toBeNull();
  });

  it('should clear a specific set', () => {
    cache.set(16, { setId: 16 } as ISetData);
    cache.clear(16);
    expect(cache.get(16)).toBeNull();
  });

  it('should clear all sets', () => {
    cache.set(16, { setId: 16 } as ISetData);
    cache.set(17, { setId: 17 } as ISetData);
    cache.clearAll();
    expect(cache.get(16)).toBeNull();
    expect(cache.get(17)).toBeNull();
  });
});
