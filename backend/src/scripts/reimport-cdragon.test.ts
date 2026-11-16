import { describe, it, expect } from 'vitest';
import { parseJsonWithBom, selectAndTransform } from './reimport-cdragon';

const fixture = JSON.stringify({
  sets: {
    '17': {
      name: 'Set 17',
      champions: [
        {
          apiName: 'TFT_BlueGolem',
          name: 'Blue Golem',
          cost: 1,
          traits: [],
          stats: { hp: 600, mana: 100, initialMana: 30, damage: 55, attackSpeed: 0.55, range: 1, armor: 40, magicResist: 40, critChance: 0.25, critMultiplier: 1.4 },
          ability: { name: 'Smash', desc: 'Slam', variables: [{ name: 'Damage', value: [100, 300, 480] }] },
          icon: '',
          squareIcon: '',
        },
      ],
      traits: [],
    },
  },
  setData: {
    '4': {
      name: 'Set 17',
      number: 17,
      champions: [],
      traits: [],
      items: [{ apiName: 'TFT17_BFSword', name: 'B.F. Sword', description: 'AD', icon: '' }],
      augments: ['TFT17_Aug1'],
    },
  },
  items: [],
});

describe('reimport-cdragon', () => {
  it('parses JSON with a UTF-8 BOM', () => {
    const raw = parseJsonWithBom('\uFEFF' + fixture);
    expect(Object.keys(raw.setData)).toHaveLength(1);
  });

  it('selects the requested set and transforms full stats', () => {
    const out = selectAndTransform(parseJsonWithBom(fixture), 17, 'https://cdn');
    expect(out.champions).toHaveLength(1);
    expect(out.champions[0].id).toBe('TFT_BlueGolem');
    expect(out.champions[0].stats.armor).toBe(40);
    expect(out.champions[0].stats.attackSpeed).toBeCloseTo(0.55);
    expect(out.items.map((i) => i.id)).toEqual(['TFT17_BFSword']);
    expect(out.augments.map((a) => a.id)).toEqual(['TFT17_Aug1']);
  });

  it('returns empty champions for an unknown set', () => {
    const out = selectAndTransform(parseJsonWithBom(fixture), 99, 'https://cdn');
    expect(out.champions).toHaveLength(0);
  });
});
