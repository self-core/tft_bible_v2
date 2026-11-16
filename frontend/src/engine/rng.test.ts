import { describe, expect, it } from 'vitest';
import { mulberry32, rollChance } from './rng';

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const first = Array.from({ length: 10 }, () => a());
    const second = Array.from({ length: 10 }, () => b());
    expect(first).toEqual(second);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(Array.from({ length: 5 }, () => a())).not.toEqual(
      Array.from({ length: 5 }, () => b())
    );
  });

  it('stays within [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('rollChance is deterministic per seed', () => {
    const a = Array.from({ length: 20 }, () => rollChance(mulberry32(3), 0.5));
    const b = Array.from({ length: 20 }, () => rollChance(mulberry32(3), 0.5));
    expect(a).toEqual(b);
  });
});
