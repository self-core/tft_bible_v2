import { ENGINE_CONFIG } from './config';
import { hexDistance, hexKey, toGridPosition, validNeighbors } from './hex';
import { mulberry32, rollChance, type Rng } from './rng';
import { buildCoverage, prepareSide } from './stats';
import type {
  CombatUnitInput,
  DamageType,
  FightResult,
  FightWinner,
  PreparedUnit,
  Side,
  SideInput,
  SideSummary,
  SimulateOptions,
  TimelineEvent,
} from './types';
import type { Trait as ApiTrait } from '../lib/api';

interface CombatUnit extends PreparedUnit {
  gridRow: number;
  gridCol: number;
  hp: number;
  mana: number;
  shield: number;
  attackTimer: number;
  moveTimer: number;
  alive: boolean;
  damageDealt: number;
}

function toCombatUnit(unit: PreparedUnit): CombatUnit {
  const grid = toGridPosition(unit.side, unit.row, unit.col);
  return {
    ...unit,
    gridRow: grid.row,
    gridCol: grid.col,
    hp: unit.stats.maxHp,
    mana: unit.stats.startingMana,
    shield: 0,
    attackTimer: 0,
    moveTimer: 0,
    alive: true,
    damageDealt: 0,
  };
}

function position(unit: CombatUnit): { row: number; col: number } {
  return { row: unit.gridRow, col: unit.gridCol };
}

function selectTarget(unit: CombatUnit, units: CombatUnit[]): CombatUnit | null {
  let best: CombatUnit | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of units) {
    if (!candidate.alive || candidate.side === unit.side) continue;
    const distance = hexDistance(position(unit), position(candidate));
    if (
      distance < bestDistance ||
      (distance === bestDistance &&
        (candidate.hp < (best?.hp ?? Number.POSITIVE_INFINITY) ||
          (candidate.hp === best?.hp && candidate.id < best.id)))
    ) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

function nearestTargets(unit: CombatUnit, units: CombatUnit[], count: number): CombatUnit[] {
  return units
    .filter(candidate => candidate.alive && candidate.side !== unit.side)
    .map(candidate => ({ candidate, distance: hexDistance(position(unit), position(candidate)) }))
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.candidate.hp !== b.candidate.hp) return a.candidate.hp - b.candidate.hp;
      return a.candidate.id < b.candidate.id ? -1 : 1;
    })
    .slice(0, count)
    .map(entry => entry.candidate);
}

interface FightLog {
  events: TimelineEvent[];
  push(event: Omit<TimelineEvent, 'tick' | 'atMs'>, tick: number, tickMs: number): void;
}

function createLog(): FightLog {
  const events: TimelineEvent[] = [];
  return {
    events,
    push(event, tick, tickMs) {
      events.push({ ...event, tick, atMs: tick * tickMs });
    },
  };
}

function applyDamage(
  source: CombatUnit,
  target: CombatUnit,
  rawAmount: number,
  damageType: DamageType,
  log: FightLog,
  tick: number
): number {
  if (!target.alive || rawAmount <= 0) return 0;

  let mitigated = rawAmount;
  if (damageType === 'physical') mitigated = rawAmount * (100 / (100 + target.stats.armor));
  if (damageType === 'magic') mitigated = rawAmount * (100 / (100 + target.stats.magicResist));

  if (target.stats.manaCost > 0) {
    target.mana += Math.min(
      rawAmount * ENGINE_CONFIG.manaFromDamageTakenRatio,
      ENGINE_CONFIG.maxManaFromDamageTaken
    );
  }

  let remaining = mitigated;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }
  target.hp -= remaining;
  source.damageDealt += mitigated;

  log.push(
    {
      type: 'damage',
      sourceId: source.id,
      targetId: target.id,
      amount: Math.round(mitigated * 10) / 10,
      damageType,
    },
    tick,
    ENGINE_CONFIG.tickMs
  );

  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    source.mana += ENGINE_CONFIG.manaPerTakedown;
    log.push({ type: 'death', targetId: target.id }, tick, ENGINE_CONFIG.tickMs);
  }
  return mitigated;
}

function applyHeal(unit: CombatUnit, amount: number, log: FightLog, tick: number): void {
  if (!unit.alive || amount <= 0) return;
  const healed = Math.min(amount, unit.stats.maxHp - unit.hp);
  if (healed <= 0) return;
  unit.hp += healed;
  log.push(
    { type: 'heal', sourceId: unit.id, targetId: unit.id, amount: Math.round(healed * 10) / 10 },
    tick,
    ENGINE_CONFIG.tickMs
  );
}

function castAbility(
  caster: CombatUnit,
  units: CombatUnit[],
  log: FightLog,
  tick: number
): void {
  const ability = caster.ability;
  caster.mana = Math.max(0, caster.mana - caster.stats.manaCost);
  log.push({ type: 'cast', sourceId: caster.id, text: ability.name }, tick, ENGINE_CONFIG.tickMs);

  const apMultiplier = 1 + caster.stats.abilityPower * ENGINE_CONFIG.apDamageScale;

  if (ability.shield > 0) {
    const shield = ability.shield * apMultiplier;
    caster.shield += shield;
    log.push(
      { type: 'shield', targetId: caster.id, amount: Math.round(shield * 10) / 10 },
      tick,
      ENGINE_CONFIG.tickMs
    );
  }

  if (ability.heal > 0) {
    const heal = ability.heal < 1 ? ability.heal * caster.stats.maxHp : ability.heal;
    applyHeal(caster, heal, log, tick);
  }

  if (ability.flatDamage > 0) {
    let amount = ability.flatDamage;
    if (ability.damageType === 'magic') amount *= apMultiplier;
    if (ability.damageType === 'physical' && ability.adRatio > 1) {
      amount += ability.adRatio * caster.stats.attackDamage;
    }
    amount *= 1 + caster.stats.damageAmp;
    for (const target of nearestTargets(caster, units, ability.targets)) {
      applyDamage(caster, target, amount, ability.damageType, log, tick);
    }
  }
}

function tryMove(attacker: CombatUnit, target: CombatUnit, units: CombatUnit[], log: FightLog, tick: number): void {
  const occupied = new Set(
    units.filter(unit => unit.alive && unit !== attacker).map(unit => hexKey(position(unit)))
  );
  const currentDistance = hexDistance(position(attacker), position(target));
  let best: { row: number; col: number; distance: number } | null = null;

  for (const neighbor of validNeighbors(position(attacker))) {
    if (occupied.has(hexKey(neighbor))) continue;
    const distance = hexDistance(neighbor, position(target));
    if (distance >= currentDistance) continue;
    if (!best || distance < best.distance) {
      best = { ...neighbor, distance };
    }
  }

  if (!best) return;
  const from = position(attacker);
  attacker.gridRow = best.row;
  attacker.gridCol = best.col;
  log.push(
    {
      type: 'move',
      sourceId: attacker.id,
      from,
      to: { row: best.row, col: best.col },
    },
    tick,
    ENGINE_CONFIG.tickMs
  );
}

function summarize(units: CombatUnit[], side: Side): SideSummary {
  const sideUnits = units.filter(unit => unit.side === side);
  return {
    survivors: sideUnits.filter(unit => unit.alive).length,
    totalHpRemaining: sideUnits.reduce((sum, unit) => sum + (unit.alive ? unit.hp : 0), 0),
    totalDamageDealt: Math.round(sideUnits.reduce((sum, unit) => sum + unit.damageDealt, 0)),
    units: sideUnits.map(unit => ({
      id: unit.id,
      name: unit.name,
      stars: unit.stars,
      hp: Math.round(unit.hp * 10) / 10,
      maxHp: Math.round(unit.stats.maxHp * 10) / 10,
      mana: Math.round(unit.mana * 10) / 10,
      manaCost: unit.stats.manaCost,
      damageDealt: Math.round(unit.damageDealt * 10) / 10,
      alive: unit.alive,
    })),
  };
}

export function simulate(
  blue: SideInput,
  red: SideInput,
  traits: Array<ApiTrait>,
  options: SimulateOptions = {}
): FightResult {
  const seed = options.seed ?? 1;
  const rng: Rng = mulberry32(seed);
  const tickMs = ENGINE_CONFIG.tickMs;
  const maxMs = (options.maxFightSeconds ?? ENGINE_CONFIG.maxFightSeconds) * 1000;

  const blueSide = prepareSide('blue', blue, traits);
  const redSide = prepareSide('red', red, traits);
  const units: CombatUnit[] = [
    ...blueSide.units.map(toCombatUnit),
    ...redSide.units.map(toCombatUnit),
  ];

  const log = createLog();
  let tick = 0;
  let elimination = false;

  const aliveCount = (side: Side) => units.filter(unit => unit.alive && unit.side === side).length;

  while (tick * tickMs <= maxMs) {
    if (aliveCount('blue') === 0 || aliveCount('red') === 0) {
      elimination = true;
      break;
    }

    for (const unit of units) {
      if (!unit.alive) continue;

      if (unit.stats.manaRegenPerSecond > 0) {
        unit.mana += unit.stats.manaRegenPerSecond * (tickMs / 1000);
      }

      if (unit.ability.modeled && unit.stats.manaCost > 0 && unit.mana >= unit.stats.manaCost) {
        castAbility(unit, units, log, tick);
        if (!unit.alive) continue;
      }

      let target = selectTarget(unit, units);
      if (!target) continue;

      const distance = hexDistance(position(unit), position(target));
      if (distance <= unit.stats.range) {
        unit.moveTimer = 0;
        const interval = 1000 / Math.max(0.1, unit.stats.attackSpeed);
        unit.attackTimer += tickMs;
        while (unit.attackTimer >= interval) {
          unit.attackTimer -= interval;
          if (!target.alive) {
            const next = selectTarget(unit, units);
            if (!next) break;
            target = next;
          }
          attack(unit, target, rng, log, tick);
        }
      } else {
        unit.moveTimer += tickMs;
        if (unit.moveTimer >= ENGINE_CONFIG.moveIntervalMs) {
          unit.moveTimer -= ENGINE_CONFIG.moveIntervalMs;
          tryMove(unit, target, units, log, tick);
        }
      }
    }

    tick += 1;
  }

  const blueAlive = aliveCount('blue');
  const redAlive = aliveCount('red');
  let winner: FightWinner = 'draw';
  let reason: FightResult['reason'] = elimination ? 'elimination' : 'timeout';
  if (blueAlive > 0 && redAlive === 0) winner = 'blue';
  else if (redAlive > 0 && blueAlive === 0) winner = 'red';
  else if (blueAlive > 0 && redAlive > 0) {
    winner = 'draw';
    reason = 'timeout';
  }

  const durationMs = Math.min(tick * tickMs, maxMs);
  log.push(
    {
      type: 'end',
      text: winner === 'draw' ? `draw (${reason})` : `${winner} wins (${reason})`,
    },
    tick,
    tickMs
  );

  return {
    seed,
    winner,
    reason,
    durationMs,
    ticks: tick,
    blue: summarize(units, 'blue'),
    red: summarize(units, 'red'),
    events: log.events,
    coverage: buildCoverage(blueSide, redSide),
  };
}

function attack(
  attacker: CombatUnit,
  target: CombatUnit,
  rng: Rng,
  log: FightLog,
  tick: number
): void {
  const crit = rollChance(rng, attacker.stats.critChance);
  let raw = attacker.stats.attackDamage * (1 + attacker.stats.damageAmp);
  if (crit) raw *= attacker.stats.critMultiplier;

  log.push(
    {
      type: 'attack',
      sourceId: attacker.id,
      targetId: target.id,
      amount: Math.round(raw * 10) / 10,
    },
    tick,
    ENGINE_CONFIG.tickMs
  );

  const dealt = applyDamage(attacker, target, raw, 'physical', log, tick);
  attacker.mana += ENGINE_CONFIG.manaPerAttack;

  if (attacker.stats.omnivamp > 0) {
    applyHeal(attacker, dealt * attacker.stats.omnivamp, log, tick);
  }
}

/** Convenience wrapper for callers that only need one placement id built consistently. */
export function makeUnitId(side: Side, unit: CombatUnitInput, index: number): string {
  return `${side}-${unit.championId}-${index}`;
}
