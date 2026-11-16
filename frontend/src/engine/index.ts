export { ENGINE_CONFIG } from './config';
export { simulate } from './simulate';
export { predict } from './predict';
export { buildAbilityPlan, buildCoverage, pickStarValue, prepareSide } from './stats';
export { hexDistance, toGridPosition, validNeighbors } from './hex';
export { mulberry32 } from './rng';
export { emblemTraitName } from './data/emblems';
export { augmentModifier, AUGMENT_MODIFIERS } from './data/augments';
export { effectToModifier } from './data/effects';
export type {
  AbilityPlan,
  CombatUnitInput,
  CoverageReport,
  FightResult,
  FightWinner,
  PredictOptions,
  PredictionResult,
  PreparedSide,
  PreparedUnit,
  Side,
  SideInput,
  SideSummary,
  SimulateOptions,
  StatModifier,
  TimelineEvent,
  UnitStats,
} from './types';
