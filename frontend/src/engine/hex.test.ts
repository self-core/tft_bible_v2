import { describe, expect, it } from 'vitest';
import { hexDistance, toGridPosition, validNeighbors } from './hex';

describe('hex grid', () => {
  it('maps both sides onto facing halves of the battlefield', () => {
    expect(toGridPosition('blue', 3, 0)).toEqual({ row: 3, col: 0 });
    expect(toGridPosition('blue', 0, 0)).toEqual({ row: 0, col: 0 });
    expect(toGridPosition('red', 3, 0)).toEqual({ row: 4, col: 0 });
    expect(toGridPosition('red', 0, 0)).toEqual({ row: 7, col: 0 });
  });

  it('computes front-row distance as one hex', () => {
    expect(hexDistance(toGridPosition('blue', 3, 0), toGridPosition('red', 3, 0))).toBe(1);
  });

  it('computes vertical distance in rows', () => {
    expect(hexDistance(toGridPosition('blue', 0, 0), toGridPosition('red', 0, 0))).toBe(7);
  });

  it('handles odd-row offsets', () => {
    // Neighbor of an odd row to the diagonal is one step away.
    expect(hexDistance({ row: 1, col: 1 }, { row: 0, col: 1 })).toBe(1);
    expect(hexDistance({ row: 1, col: 1 }, { row: 1, col: 2 })).toBe(1);
  });

  it('returns six in-board neighbors for an interior hex', () => {
    expect(validNeighbors({ row: 4, col: 3 })).toHaveLength(6);
  });

  it('clamps neighbors to the board edges', () => {
    expect(validNeighbors({ row: 0, col: 0 }).length).toBeLessThan(6);
    expect(validNeighbors({ row: 7, col: 6 }).length).toBeLessThan(6);
  });

  it('is symmetric', () => {
    const a = { row: 2, col: 5 };
    const b = { row: 5, col: 1 };
    expect(hexDistance(a, b)).toBe(hexDistance(b, a));
  });
});
