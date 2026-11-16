import { describe, expect, it } from 'vitest';
import { simulate } from './simulate';
import { predict } from './predict';
import { makeChampion, makeUnit } from './testFixtures';
import type { SideInput } from './types';

function side(units: SideInput['units']): SideInput {
  return { units };
}

describe('simulate', () => {
  it('is deterministic for the same seed', () => {
    const blue = side([
      makeUnit('blue', 0), 
      makeUnit('blue', 1, { col: 1 }),
    ]);
    const red = side([
      makeUnit('red', 0, { champion: makeChampion({ id: 'TFT18_Red', name: 'Red' }) }),
    ]);

    const first = simulate(blue, red, [], { seed: 99 });
    const second = simulate(blue, red, [], { seed: 99 });

    expect(first.events).toEqual(second.events);
    expect(first.winner).toBe(second.winner);
    expect(first.durationMs).toBe(second.durationMs);
  });

  it('wins with a numerically stronger board', () => {
    const champion = makeChampion({ id: 'TFT18_Same', name: 'Same' });
    const blue = side([
      makeUnit('blue', 0, { champion }),
      makeUnit('blue', 1, { champion, col: 1 }),
      makeUnit('blue', 2, { champion, col: 2 }),
    ]);
    const red = side([makeUnit('red', 0, { champion })]);

    const result = simulate(blue, red, [], { seed: 5 });
    expect(result.winner).toBe('blue');
    expect(result.red.survivors).toBe(0);
  });

  it('wins with star and item advantages', () => {
    const champion = makeChampion({ id: 'TFT18_Same', name: 'Same' });
    const sword = {
      id: 'TFT_Item_BFSword',
      name: 'B.F. Sword',
      description: '',
      components: [],
      effects: [{ name: 'AD', value: 0.5 }],
    };
    const blue = side([makeUnit('blue', 0, { champion, stars: 3, items: [sword] })]);
    const red = side([makeUnit('red', 0, { champion })]);

    const result = simulate(blue, red, [], { seed: 11 });
    expect(result.winner).toBe('blue');
  });

  it('moves melee units toward distant targets', () => {
    const blue = side([makeUnit('blue', 0, { row: 0, col: 3 })]);
    const red = side([makeUnit('red', 0, { row: 0, col: 3 })]);

    const result = simulate(blue, red, [], { seed: 1, maxFightSeconds: 3 });
    const moves = result.events.filter(event => event.type === 'move');
    expect(moves.length).toBeGreaterThan(0);
    expect(moves[0].sourceId).toBe('blue-0');
  });

  it('mitigates physical damage with armor', () => {
    const attacker = makeChampion({
      id: 'TFT18_Attacker',
      name: 'Attacker',
      stats: {
        hp: 500,
        mana: 100,
        damage: 100,
        armor: 20,
        magicResist: 20,
        attackSpeed: 1,
        range: 1,
        initialMana: 0,
        critChance: 0,
        critMultiplier: 1.4,
      },
    });
    const tank = makeChampion({
      id: 'TFT18_Tank',
      name: 'Tank',
      stats: {
        hp: 10000,
        mana: 100,
        damage: 1,
        armor: 100,
        magicResist: 20,
        attackSpeed: 0.1,
        range: 1,
        initialMana: 0,
        critChance: 0,
        critMultiplier: 1.4,
      },
    });

    const result = simulate(
      side([makeUnit('blue', 0, { champion: attacker })]),
      side([makeUnit('red', 0, { champion: tank })]),
      [],
      { seed: 4, maxFightSeconds: 3 }
    );

    const firstHit = result.events.find(
      event => event.type === 'damage' && event.sourceId === 'blue-0'
    );
    expect(firstHit?.amount).toBeCloseTo(50, 1);
  });

  it('reports a draw on timeout', () => {
    const champion = makeChampion({
      id: 'TFT18_Tank',
      name: 'Tank',
      stats: {
        hp: 100000,
        mana: 100,
        damage: 1,
        armor: 20,
        magicResist: 20,
        attackSpeed: 0.5,
        range: 1,
        initialMana: 0,
        critChance: 0.25,
        critMultiplier: 1.4,
      },
    });

    const result = simulate(
      side([makeUnit('blue', 0, { champion })]),
      side([makeUnit('red', 0, { champion })]),
      [],
      { seed: 2, maxFightSeconds: 2 }
    );

    expect(result.winner).toBe('draw');
    expect(result.reason).toBe('timeout');
    expect(result.durationMs).toBeLessThanOrEqual(2000);
  });

  it('resolves empty boards immediately', () => {
    const red = side([makeUnit('red', 0)]);

    const blueEmpty = simulate(side([]), red, [], { seed: 1 });
    expect(blueEmpty.winner).toBe('red');
    expect(blueEmpty.red.survivors).toBe(1);

    const bothEmpty = simulate(side([]), side([]), [], { seed: 1 });
    expect(bothEmpty.winner).toBe('draw');
    expect(bothEmpty.durationMs).toBe(0);
  });

  it('emits a monotonic timeline that ends with an end event', () => {
    const result = simulate(
      side([makeUnit('blue', 0)]),
      side([makeUnit('red', 0)]),
      [],
      { seed: 3 }
    );

    const times = result.events.map(event => event.atMs);
    for (let i = 1; i < times.length; i += 1) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    }
    expect(result.events[result.events.length - 1].type).toBe('end');
    expect(result.coverage.units).toHaveLength(2);
  });

  it('simulates a full 8v8 fight quickly', () => {
    const blueUnits = Array.from({ length: 8 }, (_, index) =>
      makeUnit('blue', index, { row: 2 + (index % 2), col: index % 7 })
    );
    const redUnits = Array.from({ length: 8 }, (_, index) =>
      makeUnit('red', index, {
        row: 2 + (index % 2),
        col: index % 7,
        champion: makeChampion({ id: `TFT18_Red${index}`, name: `Red${index}` }),
      })
    );

    const started = performance.now();
    const result = simulate(side(blueUnits), side(redUnits), [], { seed: 7 });
    const elapsed = performance.now() - started;

    expect(result.winner).not.toBeUndefined();
    expect(elapsed).toBeLessThan(250);
  });
});

describe('predict', () => {
  it('aggregates seeded runs into win rates', () => {
    const champion = makeChampion({ id: 'TFT18_Mirror', name: 'Mirror' });
    const blue = side([makeUnit('blue', 0, { champion }), makeUnit('blue', 1, { champion, col: 1 })]);
    const red = side([makeUnit('red', 0, { champion }), makeUnit('red', 1, { champion, col: 1 })]);

    const prediction = predict(blue, red, [], { runs: 64, seed: 100 });

    expect(prediction.runs).toBe(64);
    expect(prediction.blueWins + prediction.redWins + prediction.draws).toBe(64);
    expect(
      prediction.blueWinRate + prediction.redWinRate + prediction.drawRate
    ).toBeCloseTo(1);
    expect(prediction.blueWinRate).toBeGreaterThan(0.15);
    expect(prediction.blueWinRate).toBeLessThan(0.85);
    expect(prediction.averageDurationMs).toBeGreaterThan(0);
  });
});
