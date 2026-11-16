import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTraitStates,
  getActiveBonuses,
  getSynergyScore,
  predictBreakpoints,
  resolveTraitStates,
  formatBreakpointBonus,
} from './traitEngine';
import { Champion, Trait, BoardUnit } from './api';

// Test data factories
const createMockChampion = (overrides: Partial<Champion> = {}): Champion => ({
  id: 'TFT18_Test',
  name: 'Test',
  cost: 1,
  traits: [],
  stats: { hp: 600, mana: 40, damage: 50 },
  ability: { name: 'Test', variables: [] },
  imageUrl: '',
  splashUrl: '',
  iconUrl: '',
  ...overrides,
});

const createMockTrait = (overrides: Partial<Trait> = {}): Trait => ({
  key: 'Test',
  name: 'Test',
  description: 'Test trait',
  breakpoints: [
    { count: 2, bonus: 'Bonus at 2' },
    { count: 4, bonus: 'Bonus at 4' },
    { count: 6, bonus: 'Bonus at 6' },
  ],
  ...overrides,
});

const createMockBoardUnit = (overrides: Partial<BoardUnit> = {}): BoardUnit => ({
  championId: 'TFT18_Test',
  position: { row: 0, col: 0 },
  starLevel: 1,
  items: [],
  ...overrides,
});

describe('Trait Engine', () => {
  let mockTraits: Trait[];
  let mockChampions: Champion[];

  beforeEach(() => {
    mockTraits = [
      createMockTrait({
        key: 'Blossom',
        name: 'Blossom',
        breakpoints: [
          { count: 3, bonus: 'Wisps are upgraded' },
          { count: 5, bonus: 'Wisps appear in every shop' },
          { count: 7, bonus: 'Gain gold after buying a Wisp' },
          { count: 9, bonus: 'You can buy 2 Wisps per round' },
          { count: 11, bonus: 'Wisps overflow with power' },
        ],
      }),
      createMockTrait({
        key: 'Riftbeast',
        name: 'Riftbeast',
        breakpoints: [
          { count: 2, bonus: 'Summon Murkwolf' },
          { count: 4, bonus: 'Summon Krug' },
          { count: 6, bonus: 'Summon Gromp' },
          { count: 8, bonus: 'Summon Elder Dragon (2-slot)' },
        ],
      }),
      createMockTrait({
        key: 'Inferno',
        name: 'Inferno',
        breakpoints: [
          { count: 2, bonus: 'Burns enemies for 10% of damage dealt' },
          { count: 4, bonus: 'Burns enemies for 25% of damage dealt' },
          { count: 6, bonus: 'Burns enemies for 50% of damage dealt' },
        ],
      }),
      createMockTrait({
        key: 'Coven',
        name: 'Coven',
        breakpoints: [
          { count: 2, bonus: 'Elects a Coven Leader to gain bonus AP' },
          { count: 4, bonus: 'Coven Leader gains more AP and starting mana' },
        ],
      }),
      createMockTrait({
        key: 'Ravager',
        name: 'Ravager',
        breakpoints: [
          { count: 2, bonus: 'Ravagers gain 15% omnivamp and 10% bonus damage' },
          { count: 4, bonus: 'Ravagers gain 30% omnivamp and 25% bonus damage' },
        ],
      }),
    ];

    mockChampions = [
      createMockChampion({ id: 'TFT18_Akali', name: 'Akali', traits: ['Inferno', 'Ravager'], cost: 1 }),
      createMockChampion({ id: 'TFT18_Camille', name: 'Camille', traits: ['Coven', 'Ravager'], cost: 1 }),
      createMockChampion({ id: 'TFT18_Taric', name: 'Taric', traits: ['Blossom', 'Coven'], cost: 5 }),
      createMockChampion({ id: 'TFT18_Varus', name: 'Varus', traits: ['Inferno', 'Ravager'], cost: 4 }),
      createMockChampion({ id: 'TFT18_Karma', name: 'Karma', traits: ['Blossom', 'Riftbeast'], cost: 3 }),
      createMockChampion({ id: 'TFT18_Kobuko', name: 'Kobuko', traits: ['Riftbeast', 'Coven'], cost: 2 }),
    ];
  });

  describe('calculateTraitStates', () => {
    it('returns all traits with zero counts for empty board', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const result = calculateTraitStates([], mockTraits, championMap);
      expect(result).toHaveLength(mockTraits.length);
      result.forEach(trait => {
        expect(trait.currentCount).toBe(0);
        expect(trait.isActive).toBe(false);
      });
    });

    it('calculates correct counts for single trait', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }),
        createMockBoardUnit({ championId: 'TFT18_Varus' }),
      ];
      const result = calculateTraitStates(board, mockTraits, championMap);
      
      const inferno = result.find(t => t.traitKey === 'Inferno');
      expect(inferno).toBeDefined();
      expect(inferno!.currentCount).toBe(2);
      expect(inferno!.isActive).toBe(true);
    });

    it('activates trait at first breakpoint', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }),
        createMockBoardUnit({ championId: 'TFT18_Varus' }),
      ];
      const result = calculateTraitStates(board, mockTraits, championMap);
      
      const inferno = result.find(t => t.traitKey === 'Inferno');
      expect(inferno!.activeBreakpoints.length).toBe(1);
      expect(inferno!.activeBreakpoints[0].count).toBe(2);
      expect(inferno!.nextBreakpoint?.count).toBe(4);
    });

    it('activates multiple breakpoints when count exceeds thresholds', () => {
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }),
        createMockBoardUnit({ championId: 'TFT18_Varus' }),
        createMockBoardUnit({ championId: 'TFT18_Test3' }),
        createMockBoardUnit({ championId: 'TFT18_Test4' }),
      ];
      
      // Add test champions to map
      const testChampions = [
        createMockChampion({ id: 'TFT18_Test3', name: 'Test3', traits: ['Inferno'] }),
        createMockChampion({ id: 'TFT18_Test4', name: 'Test4', traits: ['Inferno'] }),
      ];
      const extendedChampionMap = new Map([...mockChampions, ...testChampions].map(c => [c.id, c]));
      
      const result = calculateTraitStates(board, mockTraits, extendedChampionMap);
      const inferno = result.find(t => t.traitKey === 'Inferno');
      
      expect(inferno!.currentCount).toBe(4);
      expect(inferno!.activeBreakpoints.length).toBe(2);
      expect(inferno!.activeBreakpoints.map(b => b.count)).toEqual([2, 4]);
      expect(inferno!.nextBreakpoint?.count).toBe(6);
    });

    it('handles multiple traits on same unit', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }), // Inferno + Ravager
        createMockBoardUnit({ championId: 'TFT18_Camille' }), // Coven + Ravager
      ];
      const result = calculateTraitStates(board, mockTraits, championMap);
      
      const inferno = result.find(t => t.traitKey === 'Inferno');
      const ravager = result.find(t => t.traitKey === 'Ravager');
      const coven = result.find(t => t.traitKey === 'Coven');
      
      expect(inferno!.currentCount).toBe(1);
      expect(ravager!.currentCount).toBe(2);
      expect(coven!.currentCount).toBe(1);
    });

    it('tracks units contributing to each trait', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }),
        createMockBoardUnit({ championId: 'TFT18_Varus' }),
      ];
      const result = calculateTraitStates(board, mockTraits, championMap);
      
      const inferno = result.find(t => t.traitKey === 'Inferno');
      expect(inferno!.unitsContributing).toContain('TFT18_Akali');
      expect(inferno!.unitsContributing).toContain('TFT18_Varus');
      expect(inferno!.unitsContributing).toHaveLength(2);
    });

    it('returns inactive traits with zero count', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [createMockBoardUnit({ championId: 'TFT18_Akali' })];
      const result = calculateTraitStates(board, mockTraits, championMap);
      
      const riftbeast = result.find(t => t.traitKey === 'Riftbeast');
      expect(riftbeast!.currentCount).toBe(0);
      expect(riftbeast!.isActive).toBe(false);
      expect(riftbeast!.activeBreakpoints).toHaveLength(0);
    });
  });

  describe('getActiveBonuses', () => {
    it('returns formatted active bonuses', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }),
        createMockBoardUnit({ championId: 'TFT18_Varus' }),
        createMockBoardUnit({ championId: 'TFT18_Camille' }),
        createMockBoardUnit({ championId: 'TFT18_Kobuko' }),
      ];
      const traitStates = calculateTraitStates(board, mockTraits, championMap);
      const bonuses = getActiveBonuses(traitStates);
      
      expect(bonuses.length).toBeGreaterThan(0);
      bonuses.forEach(bonus => {
        expect(bonus).toHaveProperty('traitName');
        expect(bonus).toHaveProperty('breakpoint');
        expect(bonus).toHaveProperty('description');
      });
    });

    it('includes all active breakpoints', () => {
      const testChampions = Array(6).fill(null).map((_, i) => 
        createMockChampion({ id: `TFT18_Test${i}`, name: `Test${i}`, traits: ['Inferno'] })
      );
      const championMap = new Map([...mockChampions, ...testChampions].map(c => [c.id, c]));
      const board = testChampions.map(c => createMockBoardUnit({ championId: c.id }));
      const traitStates = calculateTraitStates(board, mockTraits, championMap);
      const bonuses = getActiveBonuses(traitStates);
      
      const infernoBonuses = bonuses.filter(b => b.traitName === 'Inferno');
      expect(infernoBonuses.length).toBe(3); // 2, 4, 6 breakpoints
    });
  });

  describe('getSynergyScore', () => {
    it('returns higher score for more active traits', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board1 = [createMockBoardUnit({ championId: 'TFT18_Akali' })];
      const board2 = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }),
        createMockBoardUnit({ championId: 'TFT18_Varus' }),
        createMockBoardUnit({ championId: 'TFT18_Camille' }),
        createMockBoardUnit({ championId: 'TFT18_Kobuko' }),
      ];
      
      const score1 = getSynergyScore(calculateTraitStates(board1, mockTraits, championMap));
      const score2 = getSynergyScore(calculateTraitStates(board2, mockTraits, championMap));
      
      expect(score2).toBeGreaterThan(score1);
    });

    it('returns zero for empty board', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const score = getSynergyScore(calculateTraitStates([], mockTraits, championMap));
      expect(score).toBe(0);
    });
  });

  describe('predictBreakpoints', () => {
    it('predicts next breakpoints for current counts', () => {
      const currentCounts = new Map([
        ['Inferno', 2],
        ['Ravager', 1],
        ['Blossom', 3],
      ]);
      const predictions = predictBreakpoints(currentCounts, mockTraits);
      
      const infernoPred = predictions.find(p => p.traitKey === 'Inferno');
      expect(infernoPred).toBeDefined();
      expect(infernoPred!.currentCount).toBe(2);
      expect(infernoPred!.nextBreakpoint).toBe(4);
      expect(infernoPred!.unitsNeeded).toBe(2);
    });

    it('returns null nextBreakpoint when all breakpoints reached', () => {
      const currentCounts = new Map([
        ['Inferno', 6], // Max breakpoint
      ]);
      const predictions = predictBreakpoints(currentCounts, mockTraits);
      
      const infernoPred = predictions.find(p => p.traitKey === 'Inferno');
      expect(infernoPred!.nextBreakpoint).toBeNull();
      expect(infernoPred!.unitsNeeded).toBe(0);
    });

    it('handles traits not in current counts', () => {
      const currentCounts = new Map([['Inferno', 2]]);
      const predictions = predictBreakpoints(currentCounts, mockTraits);
      
      const ravagerPred = predictions.find(p => p.traitKey === 'Ravager');
      expect(ravagerPred).toBeDefined();
      expect(ravagerPred!.currentCount).toBe(0);
      expect(ravagerPred!.nextBreakpoint).toBe(2);
      expect(ravagerPred!.unitsNeeded).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('handles unique trait counts (at least N behavior)', () => {
      const uniqueTraits = [
        createMockTrait({
          key: 'Ninja',
          name: 'Ninja',
          breakpoints: [
            { count: 1, bonus: 'Ninja gains 50% AD and 50 AP' },
            { count: 4, bonus: 'All Ninjas gain 50% AD and 50 AP' },
          ],
        }),
      ];
      const ninjaChampions = [
        createMockChampion({ id: 'TFT18_Ninja1', name: 'Ninja1', traits: ['Ninja'] }),
        createMockChampion({ id: 'TFT18_Ninja2', name: 'Ninja2', traits: ['Ninja'] }),
      ];
      
      const championMap = new Map(ninjaChampions.map(c => [c.id, c]));
      const board = ninjaChampions.map(c => createMockBoardUnit({ championId: c.id }));
      const result = calculateTraitStates(board, uniqueTraits, championMap);
      
      const ninja = result.find(t => t.traitKey === 'Ninja');
      expect(ninja!.currentCount).toBe(2);
      // Standard TFT behavior: traits activate at "at least N"
      // With 2 units, first breakpoint (1) is active
      expect(ninja!.isActive).toBe(true);
      expect(ninja!.activeBreakpoints.length).toBe(1);
      expect(ninja!.activeBreakpoints[0].count).toBe(1);
      expect(ninja!.nextBreakpoint?.count).toBe(4);
    });

    it('handles emblems (extra trait counts)', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Akali' }), // 1 Inferno
      ];
      // Emblem would add +1 to Inferno count
      // This is handled by the caller adding emblem units
      const result = calculateTraitStates(board, mockTraits, championMap);
      const inferno = result.find(t => t.traitKey === 'Inferno');
      expect(inferno!.currentCount).toBe(1);
    });

    it('handles units with no traits', () => {
      const noTraitChamp = createMockChampion({ id: 'TFT18_NoTrait', name: 'NoTrait', traits: [] });
      const championMap = new Map([noTraitChamp].map(c => [c.id, c]));
      const board = [createMockBoardUnit({ championId: 'TFT18_NoTrait' })];
      const result = calculateTraitStates(board, mockTraits, championMap);
      
      // Should not crash, all traits should have 0 count
      result.forEach(trait => {
        expect(trait.currentCount).toBe(0);
      });
    });

    it('handles missing champion gracefully', () => {
      const championMap = new Map(mockChampions.map(c => [c.id, c]));
      const board = [
        createMockBoardUnit({ championId: 'TFT18_Unknown' }), // Not in mockChampions
      ];
      // Should not crash, just skip unknown champions
      const result = calculateTraitStates(board, mockTraits, championMap);
      expect(result).toBeDefined();
    });
  });
});
describe('resolveTraitStates', () => {
  const traitDoc = (key: string, name: string): Trait =>
    createMockTrait({
      key,
      name,
      breakpoints: [
        { count: 2, bonus: 'First' },
        { count: 4, bonus: 'Second' },
      ],
    });

  it('matches champion trait names to trait documents by name when keys differ', () => {
    // Set 18: champion traits store display names, trait docs use DA_18_* keys
    const traits = [traitDoc('DA_18_Slayer', 'Ravager')];
    const resolved = resolveTraitStates(
      [{ traitNames: ['Ravager'] }, { traitNames: ['Ravager'] }],
      traits,
    );

    expect(resolved).toHaveLength(1);
    expect(resolved[0].key).toBe('DA_18_Slayer');
    expect(resolved[0].name).toBe('Ravager');
    expect(resolved[0].count).toBe(2);
    expect(resolved[0].activeBreakpoint?.count).toBe(2);
    expect(resolved[0].nextBreakpoint?.count).toBe(4);
  });

  it('falls back to matching by trait key', () => {
    const traits = [traitDoc('Inferno', 'Inferno')];
    const resolved = resolveTraitStates([{ traitNames: ['Inferno'] }], traits);
    expect(resolved[0].count).toBe(1);
    expect(resolved[0].activeBreakpoint).toBeNull();
  });

  it('counts emblem traits once per unit even when duplicated with native traits', () => {
    const traits = [traitDoc('Coven', 'Coven')];
    const resolved = resolveTraitStates(
      [{ traitNames: ['Coven'], emblemTraits: ['Coven'] }],
      traits,
    );

    expect(resolved[0].count).toBe(1);
    expect(resolved[0].unitIndexes).toEqual([0]);
  });

  it('keeps unmatched trait names as count-only entries', () => {
    const resolved = resolveTraitStates([{ traitNames: ['Mystery'] }], []);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].trait).toBeNull();
    expect(resolved[0].name).toBe('Mystery');
    expect(resolved[0].count).toBe(1);
  });
});

describe('formatBreakpointBonus', () => {
  it('formats numeric variables with percent scaling', () => {
    expect(formatBreakpointBonus({ count: 2, bonus: '', variables: [{ name: 'AttackSpeedPercent', value: 0.15 }] }))
      .toBe('AttackSpeedPercent: 15%');
  });

  it('keeps values above 1 as raw numbers', () => {
    expect(formatBreakpointBonus({ count: 4, bonus: '', variables: [{ name: 'AP', value: 20 }] }))
      .toBe('AP: 20');
  });

  it('falls back to the display bonus when no variables exist', () => {
    expect(formatBreakpointBonus({ count: 2, bonus: '+20 AP', variables: [] })).toBe('+20 AP');
  });
});
