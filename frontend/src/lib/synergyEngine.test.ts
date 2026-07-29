import { describe, it, expect } from 'vitest';
import {
  scoreCandidate,
  getTopRecommendations,
  greedyFill,
  computeActiveTraits,
} from './synergyEngine';
import { Champion, Trait } from './api';

const makeChamp = (overrides: Partial<Champion> = {}): Champion => ({
  id: 'test',
  name: 'Test',
  cost: 3,
  traits: [],
  stats: { hp: 600, mana: 40, damage: 50 },
  ability: { name: '', variables: [] },
  imageUrl: undefined,
  splashUrl: undefined,
  iconUrl: undefined,
  ...overrides,
});

const makeTrait = (overrides: Partial<Trait> = {}): Trait => ({
  key: 'test',
  name: 'Test',
  description: '',
  breakpoints: [{ count: 2, bonus: 'bonus' }],
  ...overrides,
});

describe('scoreCandidate', () => {
  it('scores a unique-trait champion positively on empty board', () => {
    const champ = makeChamp({ id: 'TFT18_Akali', name: 'Akali', traits: ['Blossom'] });
    const result = scoreCandidate(champ, [], [], {});
    expect(result.totalScore).toBe(3.5);
    expect(result.breakdown.uniqueTrait).toBe(5);
  });
});

describe('getTopRecommendations', () => {
  it('returns top N champions sorted by score descending', () => {
    const pool = [
      makeChamp({ id: '1', name: 'A', cost: 1, traits: ['X'] }),
      makeChamp({ id: '2', name: 'B', cost: 2, traits: ['Y'] }),
      makeChamp({ id: '3', name: 'C', cost: 3, traits: ['Z'] }),
    ];
    const result = getTopRecommendations([], pool, [], {}, 2);
    expect(result).toHaveLength(2);
  });
});

describe('greedyFill', () => {
  it('fills board to specified size', () => {
    const pool = [
      makeChamp({ id: '1', name: 'A', cost: 1, traits: ['Blossom'] }),
      makeChamp({ id: '2', name: 'B', cost: 2, traits: ['Inferno'] }),
      makeChamp({ id: '3', name: 'C', cost: 3, traits: ['Ravager'] }),
    ];
    const result = greedyFill([], pool, 2, [], {});
    expect(result).toHaveLength(2);
  });

  it('fills remaining slots when board is non-empty', () => {
    const board = [makeChamp({ id: 'existing', name: 'Existing', cost: 1, traits: ['Blossom'] })];
    const pool = [
      makeChamp({ id: 'A', name: 'A', cost: 1, traits: ['Inferno'] }),
      makeChamp({ id: 'B', name: 'B', cost: 2, traits: ['Ravager'] }),
    ];
    const result = greedyFill(board, pool, 3, [], {});
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('existing');
  });

  it('does not exceed available pool size', () => {
    const pool = [makeChamp({ id: '1', name: 'A', cost: 1, traits: ['Blossom'] })];
    const result = greedyFill([], pool, 5, [], {});
    expect(result).toHaveLength(1);
  });
});

describe('computeActiveTraits', () => {
  it('returns active status for each trait', () => {
    const traits = [
      makeTrait({ key: 'Blossom', name: 'Blossom', breakpoints: [{ count: 2, bonus: 'x2' }, { count: 3, bonus: 'x3' }] }),
    ];
    const board = [makeChamp({ traits: ['Blossom'] })];
    const result = computeActiveTraits(board, traits, {});
    expect(result).toHaveLength(1);
    expect(result[0].currentCount).toBe(1);
    expect(result[0].nextBreakpoint?.count).toBe(2);
  });
});
