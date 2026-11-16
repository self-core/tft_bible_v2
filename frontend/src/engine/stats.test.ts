import { describe, expect, it } from 'vitest';
import { makeChampion, makeItem, makeTrait, makeUnit, abilityVariable } from './testFixtures';
import { buildAbilityPlan, pickStarValue, prepareSide } from './stats';

describe('pickStarValue', () => {
  it('uses indices 1-3 for seven-length cdragon tables', () => {
    const values = [3.3, 120, 180, 285, 485, 120, 120];
    expect(pickStarValue(values, 1)).toBe(120);
    expect(pickStarValue(values, 2)).toBe(180);
    expect(pickStarValue(values, 3)).toBe(285);
  });

  it('uses positional indices for three-length tables', () => {
    expect(pickStarValue([10, 20, 30], 2)).toBe(20);
  });

  it('handles single and missing values', () => {
    expect(pickStarValue([7], 3)).toBe(7);
    expect(pickStarValue([], 1)).toBeNull();
    expect(pickStarValue(undefined, 1)).toBeNull();
  });
});

describe('prepareSide stats', () => {
  it('applies multiplicative star scaling for HP and AD', () => {
    const champion = makeChampion();
    const side = prepareSide('blue', {
      units: [
        makeUnit('blue', 0, { champion, stars: 2 }),
        makeUnit('blue', 1, { champion, stars: 3, col: 1 }),
      ],
    }, []);

    expect(side.units[0].stats.maxHp).toBeCloseTo(600 * 1.8);
    expect(side.units[1].stats.maxHp).toBeCloseTo(600 * 1.8 * 1.8);
    expect(side.units[0].stats.attackDamage).toBeCloseTo(50 * 1.5);
  });

  it('interprets item stat effects', () => {
    const bfSword = makeItem({
      id: 'TFT_Item_BFSword',
      name: 'B.F. Sword',
      effects: [{ name: 'AD', value: 0.1 }],
    });
    const warmog = makeItem({
      id: 'TFT_Item_WarmogsArmor',
      name: "Warmog's Armor",
      effects: [{ name: 'Health', value: 500 }],
    });
    const bow = makeItem({
      id: 'TFT_Item_RecurveBow',
      name: 'Recurve Bow',
      effects: [{ name: 'AS', value: 10 }],
    });

    const side = prepareSide('blue', {
      units: [makeUnit('blue', 0, { items: [bfSword, warmog, bow] })],
    }, []);

    const stats = side.units[0].stats;
    expect(stats.attackDamage).toBeCloseTo(55);
    expect(stats.maxHp).toBeCloseTo(1100);
    expect(stats.attackSpeed).toBeCloseTo(0.77);
  });

  it('flags unmodeled items instead of dropping them silently', () => {
    const item = makeItem({
      id: 'TFT_Item_Mystery',
      name: 'Mystery Item',
      effects: [{ name: 'ExecuteThreshold', value: 0.2 }],
    });
    const side = prepareSide('blue', {
      units: [makeUnit('blue', 0, { items: [item] })],
    }, []);

    expect(side.units[0].unmodeledItems).toContain('Mystery Item');
    expect(side.unmodeledItemEffects[0]).toContain('ExecuteThreshold');
  });

  it('counts emblems as trait membership and applies trait effects', () => {
    const champion = makeChampion({ id: 'TFT18_Plain', name: 'Plain', traits: [] });
    const emblem = makeItem({
      id: 'DA_18_EmblemSlayer',
      name: 'Ravager Emblem',
      effects: [],
    });
    const ravager = makeTrait({
      key: 'DA_18_Slayer',
      name: 'Ravager',
      breakpoints: [
        { count: 1, bonus: 'Omnivamp', variables: [{ name: 'Omnivamp', value: 0.1 }] },
      ],
    });

    const side = prepareSide('blue', {
      units: [
        makeUnit('blue', 0, { champion, items: [emblem] }),
        makeUnit('blue', 1, { champion, col: 1 }),
      ],
    }, [ravager]);

    expect(side.units[0].traits).toContain('Ravager');
    expect(side.units[0].stats.omnivamp).toBeCloseTo(0.1);
    expect(side.units[1].stats.omnivamp).toBe(0);
    expect(side.traitVariablesApplied).toBe(1);
  });

  it('matches trait documents by key when champion traits use display names', () => {
    const champion = makeChampion({ traits: ['Ravager'] });
    const trait = makeTrait({
      key: 'DA_18_Slayer',
      name: 'Ravager',
      breakpoints: [
        { count: 2, bonus: '', variables: [{ name: 'HealthIncrease', value: 0.15 }] },
      ],
    });

    const side = prepareSide('blue', {
      units: [
        makeUnit('blue', 0, { champion }),
        makeUnit('blue', 1, { champion, col: 1 }),
      ],
    }, [trait]);

    expect(side.units[0].stats.maxHp).toBeCloseTo(600 * 1.15);
    expect(side.traitVariablesApplied).toBe(1);
  });

  it('applies curated augments to the whole side', () => {
    const side = prepareSide('blue', {
      units: [makeUnit('blue', 0)],
      augments: [{
        id: 'TFT9_Augment_CyberneticBulk3',
        name: 'Cybernetic Bulk III',
        description: '',
      }],
    }, []);

    expect(side.units[0].stats.maxHp).toBeCloseTo(1100);
    expect(side.unmodeledAugments).toHaveLength(0);
  });

  it('reports unknown augments as unmodeled', () => {
    const side = prepareSide('blue', {
      units: [makeUnit('blue', 0)],
      augments: [{ id: 'DA_18_Unknown', name: 'Unknown', description: '' }],
    }, []);

    expect(side.unmodeledAugments).toEqual(['DA_18_Unknown']);
  });
});

describe('buildAbilityPlan', () => {
  it('sums AD and AP damage variables at the chosen star', () => {
    const champion = makeChampion({
      ability: {
        name: 'Fish Frenzy',
        variables: [
          abilityVariable('ADDamage', [3.3, 120, 180, 285, 485, 120, 120]),
          abilityVariable('APDamage', [0, 10, 15, 25, 45, 0, 0]),
          abilityVariable('NumEnemies', [1, 2, 2, 2, 2, 2, 2]),
        ],
      },
    });

    const oneStar = buildAbilityPlan(champion, 1);
    expect(oneStar.modeled).toBe(true);
    expect(oneStar.flatDamage).toBe(130);
    expect(oneStar.damageType).toBe('physical');
    expect(oneStar.adRatio).toBeCloseTo(3.3);
    expect(oneStar.targets).toBe(2);

    const twoStar = buildAbilityPlan(champion, 2);
    expect(twoStar.flatDamage).toBe(195);
  });

  it('reads shields and heals', () => {
    const champion = makeChampion({
      ability: {
        name: 'Test of Spirit',
        variables: [
          abilityVariable('Shield', [250, 450, 525, 650, 775, 400, 400]),
          abilityVariable('PercentHealing', [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15]),
        ],
      },
    });

    const plan = buildAbilityPlan(champion, 2);
    expect(plan.shield).toBe(525);
    expect(plan.heal).toBeCloseTo(0.15);
    expect(plan.modeled).toBe(true);
  });

  it('marks abilities without numeric variables as unmodeled', () => {
    const plan = buildAbilityPlan(makeChampion(), 1);
    expect(plan.modeled).toBe(false);
    expect(plan.note).toContain('No numeric ability variables');
  });
});
