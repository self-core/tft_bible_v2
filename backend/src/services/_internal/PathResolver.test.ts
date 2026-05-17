import { describe, it, expect } from 'vitest';
import { PathResolver } from './PathResolver';

describe('PathResolver', () => {
  const resolver = new PathResolver();

  it('should construct champion file path', () => {
    const path = resolver.getChampionPath('/dragontail-data/');
    expect(path).toMatch(/tft-champion/);
  });

  it('should construct trait file path', () => {
    const path = resolver.getTraitPath('/dragontail-data/');
    expect(path).toMatch(/tft-trait/);
  });

  it('should construct item file path', () => {
    const path = resolver.getItemPath('/dragontail-data/');
    expect(path).toMatch(/tft-item/);
  });

  it('should try Docker path first', () => {
    expect(() => resolver.findDragontailDir()).not.toThrow();
  });
});
