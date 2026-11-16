import type { Augment, Champion, Item } from '../lib/api';

export type Side = 'blue' | 'red';
export type FightWinner = Side | 'draw';
export type FightEndReason = 'elimination' | 'timeout';
export type DamageType = 'physical' | 'magic' | 'true';

export interface CombatUnitInput {
  /** Unique placement id used in the timeline (e.g. `blue-3`). */
  id: string;
  championId: string;
  champion: Champion;
  stars: number;
  /** Input row 0 = back row, row 3 = front row. */
  row: number;
  col: number;
  items: Item[];
}

export interface SideInput {
  units: CombatUnitInput[];
  augments?: Augment[];
  level?: number;
}

export interface UnitStats {
  maxHp: number;
  attackDamage: number;
  abilityPower: number;
  armor: number;
  magicResist: number;
  /** Attacks per second. */
  attackSpeed: number;
  /** 0..1 */
  critChance: number;
  critMultiplier: number;
  range: number;
  manaCost: number;
  startingMana: number;
  manaRegenPerSecond: number;
  omnivamp: number;
  damageAmp: number;
}

export interface StatModifier {
  hpFlat?: number;
  hpPercent?: number;
  adFlat?: number;
  adPercent?: number;
  apFlat?: number;
  apPercent?: number;
  armor?: number;
  magicResist?: number;
  asPercent?: number;
  critChance?: number;
  critMultiplier?: number;
  startingMana?: number;
  manaRegen?: number;
  omnivamp?: number;
  damageAmp?: number;
  range?: number;
}

export interface AbilityPlan {
  name: string;
  damageType: DamageType;
  flatDamage: number;
  /** Multiplier of total attack damage contributed by the spell (e.g. 3.3 = 330% AD). */
  adRatio: number;
  shield: number;
  /** Flat heal, or max-HP fraction when below 1. */
  heal: number;
  targets: number;
  modeled: boolean;
  note?: string;
}

export interface PreparedUnit {
  id: string;
  side: Side;
  championId: string;
  name: string;
  stars: number;
  row: number;
  col: number;
  traits: string[];
  stats: UnitStats;
  ability: AbilityPlan;
  unmodeledItems: string[];
}

export interface PreparedSide {
  units: PreparedUnit[];
  unmodeledAugments: string[];
  unmodeledItemEffects: string[];
  traitVariablesApplied: number;
  traitVariablesIgnored: number;
}

export interface UnitCoverage {
  id: string;
  name: string;
  stars: number;
  abilityModeled: boolean;
  abilityNote?: string;
  unmodeledItems: string[];
}

export interface CoverageReport {
  units: UnitCoverage[];
  unmodeledAugments: string[];
  unmodeledItemEffects: string[];
  traitVariablesApplied: number;
  traitVariablesIgnored: number;
  /** Fraction of modeled mechanics across items, augments, traits and abilities. */
  score: number;
}

export interface UnitSummary {
  id: string;
  name: string;
  stars: number;
  hp: number;
  maxHp: number;
  mana: number;
  manaCost: number;
  damageDealt: number;
  alive: boolean;
}

export interface SideSummary {
  survivors: number;
  totalHpRemaining: number;
  totalDamageDealt: number;
  units: UnitSummary[];
}

export type TimelineEventType =
  | 'attack'
  | 'damage'
  | 'heal'
  | 'shield'
  | 'cast'
  | 'death'
  | 'move'
  | 'end';

export interface TimelineEvent {
  atMs: number;
  tick: number;
  type: TimelineEventType;
  sourceId?: string;
  targetId?: string;
  amount?: number;
  damageType?: DamageType;
  from?: { row: number; col: number };
  to?: { row: number; col: number };
  text?: string;
}

export interface FightResult {
  seed: number;
  winner: FightWinner;
  reason: FightEndReason;
  durationMs: number;
  ticks: number;
  blue: SideSummary;
  red: SideSummary;
  events: TimelineEvent[];
  coverage: CoverageReport;
}

export interface PredictionResult {
  runs: number;
  blueWins: number;
  redWins: number;
  draws: number;
  blueWinRate: number;
  redWinRate: number;
  drawRate: number;
  averageDurationMs: number;
  coverage: CoverageReport;
}

export interface SimulateOptions {
  seed?: number;
  /** Override the fight length cap (seconds). */
  maxFightSeconds?: number;
}

export interface PredictOptions {
  runs?: number;
  seed?: number;
  maxFightSeconds?: number;
}
