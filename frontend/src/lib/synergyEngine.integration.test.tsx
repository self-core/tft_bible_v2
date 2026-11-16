import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  scoreCandidate, 
  getTopRecommendations, 
  greedyFill, 
  computeActiveTraits 
} from '../lib/synergyEngine';
import { Champion, Trait } from '../lib/api';

const mockChampions: Champion[] = [
  { id: 'TFT18_Akali', name: 'Akali', cost: 1, traits: ['Inferno', 'Adaptor', 'Ravager'], stats: { hp: 600, mana: 50, damage: 55 }, ability: { name: 'Kunai Strike', variables: [] }, imageUrl: '', splashUrl: '', iconUrl: '' },
  { id: 'TFT18_Camille', name: 'Camille', cost: 1, traits: ['Coven', 'Ravager'], stats: { hp: 650, mana: 60, damage: 60 }, ability: { name: 'Defensive Sweep', variables: [] }, imageUrl: '', splashUrl: '', iconUrl: '' },
  { id: 'TFT18_Taric', name: 'Taric', cost: 5, traits: ['Emerald Aspect', 'Vanguard'], stats: { hp: 900, mana: 100, damage: 70 }, ability: { name: 'Emerald Radiance', variables: [] }, imageUrl: '', splashUrl: '', iconUrl: '' },
  { id: 'TFT18_Varus', name: 'Varus', cost: 4, traits: ['Inferno', 'Ravager'], stats: { hp: 700, mana: 80, damage: 65 }, ability: { name: 'Piercing Arrow', variables: [] }, imageUrl: '', splashUrl: '', iconUrl: '' },
];

const mockTraits: Trait[] = [
  { key: 'Inferno', name: 'Inferno', description: '', breakpoints: [{ count: 2, bonus: '10%' }, { count: 4, bonus: '25%' }, { count: 6, bonus: '50%' }] },
  { key: 'Ravager', name: 'Ravager', description: '', breakpoints: [{ count: 2, bonus: '15%' }, { count: 4, bonus: '30%' }] },
  { key: 'Coven', name: 'Coven', description: '', breakpoints: [{ count: 2, bonus: 'AP' }, { count: 4, bonus: 'More AP' }] },
  { key: 'Adaptor', name: 'Adaptor', description: '', breakpoints: [{ count: 2, bonus: 'Adapt' }] },
  { key: 'Emerald Aspect', name: 'Emerald Aspect', description: '', breakpoints: [{ count: 2, bonus: 'Shield' }] },
  { key: 'Vanguard', name: 'Vanguard', description: '', breakpoints: [{ count: 2, bonus: 'Armor' }] },
];

describe('SynergyEngine Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scoreCandidate returns correct score breakdown', () => {
    const result = scoreCandidate(mockChampions[0], [], mockTraits, {});
    
    expect(result).toHaveProperty('totalScore');
    expect(result).toHaveProperty('breakdown');
    expect(result.breakdown).toHaveProperty('breakpointProximity');
    expect(result.breakdown).toHaveProperty('traitOverlap');
    expect(result.breakdown).toHaveProperty('uniqueTrait');
    expect(result.breakdown).toHaveProperty('costPenalty');
    expect(typeof result.totalScore).toBe('number');
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
  });

  it('scoreCandidate scores unique traits positively', () => {
    const result = scoreCandidate(mockChampions[0], [], mockTraits, {});
    // Akali has 3 unique traits on empty board: uniqueTrait = 3 * 5 = 15
    // costPenalty = 1 * 0.5 = 0.5
    // totalScore should be positive
    expect(result.breakdown.uniqueTrait).toBe(15);
    expect(result.totalScore).toBeGreaterThan(0);
  });

  it('scoreCandidate scores trait overlap positively', () => {
    // Board already has Akali (Inferno, Adaptor, Ravager)
    const board = [mockChampions[0]];
    const result = scoreCandidate(mockChampions[3], board, mockTraits, {}); // Varus has Inferno, Ravager
    
    // Varus has 2 traits overlapping with board (Inferno, Ravager): traitOverlap = 2 * 3 = 6
    expect(result.breakdown.traitOverlap).toBe(6);
  });

  it('getTopRecommendations returns sorted champions', () => {
    const result = getTopRecommendations([], mockChampions, mockTraits, {}, 3);
    
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0].totalScore).toBeGreaterThanOrEqual(result[1]?.totalScore || 0);
    if (result[1]) {
      expect(result[1].totalScore).toBeGreaterThanOrEqual(result[2]?.totalScore || 0);
    }
  });

  it('getTopRecommendations excludes champions already on board', () => {
    const board = [mockChampions[0]]; // Akali on board
    const result = getTopRecommendations(board, mockChampions, mockTraits, {}, 3);
    
    // Akali should not be in recommendations
    const akaliInResults = result.some(r => r.champion.id === 'TFT18_Akali');
    expect(akaliInResults).toBe(false);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('greedyFill fills board to specified size', () => {
    const result = greedyFill([], mockChampions, 4, mockTraits, {});
    
    expect(result.length).toBe(4);
    expect(result[0].id).toBeDefined();
  });

  it('greedyFill respects existing board units', () => {
    const board = [mockChampions[0]]; // Akali already on board
    const result = greedyFill(board, mockChampions, 4, mockTraits, {});
    
    expect(result.length).toBe(4);
    expect(result[0].id).toBe('TFT18_Akali'); // First unit should be the existing one
  });

  it('greedyFill does not exceed available pool size', () => {
    const smallPool = [mockChampions[0]];
    const result = greedyFill([], smallPool, 5, mockTraits, {});
    
    expect(result.length).toBe(1);
  });

  it('computeActiveTraits returns active status for each trait', () => {
    const board = [mockChampions[0], mockChampions[1]]; // 2 Inferno, 2 Ravager
    const result = computeActiveTraits(board, mockTraits, {});
    
    expect(result.length).toBe(mockTraits.length);
    expect(result[0]).toHaveProperty('isActive');
    expect(result[0]).toHaveProperty('currentCount');
    expect(result[0]).toHaveProperty('nextBreakpoint');
    expect(result[0]).toHaveProperty('trait');
  });

  it('computeActiveTraits correctly identifies active traits', () => {
    const board = [mockChampions[0], mockChampions[1]]; // 1 Inferno, 2 Ravager, 1 Coven, 1 Adaptor
    const result = computeActiveTraits(board, mockTraits, {});
    
    const inferno = result.find(t => t.trait.key === 'Inferno');
    const ravager = result.find(t => t.trait.key === 'Ravager');
    const coven = result.find(t => t.trait.key === 'Coven');
    
    // Inferno has 1 unit, needs 2 for first breakpoint - not active
    expect(inferno?.isActive).toBe(false);
    expect(inferno?.currentCount).toBe(1);
    // Ravager has 2 units, meets first breakpoint (2) - active
    expect(ravager?.isActive).toBe(true);
    expect(ravager?.currentCount).toBe(2);
    // Coven has 1 unit, needs 2 for first breakpoint - not active
    expect(coven?.isActive).toBe(false);
    expect(coven?.currentCount).toBe(1);
  });

  it('computeActiveTraits handles emblems correctly', () => {
    const board = [mockChampions[0]]; // 1 Inferno
    const emblems = { Inferno: 1 }; // +1 emblem
    const result = computeActiveTraits(board, mockTraits, emblems);
    
    const inferno = result.find(t => t.trait.key === 'Inferno');
    expect(inferno?.currentCount).toBe(2); // 1 from board + 1 from emblem
    expect(inferno?.isActive).toBe(true);
  });
});