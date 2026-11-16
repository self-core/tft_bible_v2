/**
 * Combat engine constants. Every tunable lives here so calibration can adjust
 * one file without touching the simulation.
 */
export const ENGINE_CONFIG = {
  tickMs: 100,
  maxFightSeconds: 30,

  boardRows: 8,
  boardCols: 7,
  rowsPerSide: 4,

  /** Multiplicative per-star scaling applied relative to the previous star. */
  hpPerStar: 1.8,
  adPerStar: 1.5,

  baseCritChance: 0.25,
  baseCritMultiplier: 1.4,

  manaPerAttack: 10,
  manaFromDamageTakenRatio: 0.01,
  maxManaFromDamageTaken: 42.5,
  manaPerTakedown: 2,
  defaultManaCost: 100,

  defaultHp: 600,
  defaultAd: 50,
  defaultArmor: 20,
  defaultMagicResist: 20,
  defaultAttackSpeed: 0.7,
  defaultRange: 1,

  moveIntervalMs: 500,
  maxAbilityTargets: 4,

  /** Damage multiplier applied by ability power: 1 + AP / 100. */
  apDamageScale: 0.01,
} as const;

export type EngineConfig = typeof ENGINE_CONFIG;
