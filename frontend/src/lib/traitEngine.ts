import { Champion, Trait, BoardUnit } from './api';

export interface TraitState {
  traitKey: string;
  name: string;
  currentCount: number;
  activeBreakpoints: Breakpoint[];
  nextBreakpoint: Breakpoint | null;
  isActive: boolean;
  unitsContributing: string[];
}

export interface Breakpoint {
  count: number;
  bonus: string;
  variables?: Array<{ name: string; value: number }>;
}

export function formatBreakpointBonus(bp: Breakpoint): string {
  if (!bp.variables || bp.variables.length === 0) return bp.bonus;
  return bp.variables
    .map((v) => {
      const display = v.value > 0 && v.value <= 1 ? `${Math.round(v.value * 100)}%` : String(v.value);
      return `${v.name}: ${display}`;
    })
    .join(', ');
}

export interface ActiveBonus {
  traitName: string;
  breakpoint: Breakpoint;
  description: string;
}

export interface PredictedBreakpoint {
  traitKey: string;
  name: string;
  currentCount: number;
  nextBreakpoint: number | null;
  unitsNeeded: number;
}

export interface TraitResolutionUnit {
  id?: string;
  traitNames: string[];
  emblemTraits?: string[];
}

export interface ResolvedTrait {
  key: string;
  name: string;
  count: number;
  activeBreakpoint: Breakpoint | null;
  nextBreakpoint: Breakpoint | null;
  trait: Trait | null;
  unitIndexes: number[];
}

/**
 * Single source of truth for trait counting.
 *
 * Counts unique units per trait (a unit contributes once even with a native
 * trait plus an emblem), matches champion trait names against trait.key or
 * trait.name (PBE trait keys differ from display names, e.g. DA_18_Slayer
 * vs "Ravager"), and resolves the highest active breakpoint.
 */
export function resolveTraitStates(
  units: TraitResolutionUnit[],
  traits: Trait[]
): ResolvedTrait[] {
  const contributors = new Map<string, number[]>();

  units.forEach((unit, index) => {
    const names = new Set<string>([
      ...unit.traitNames,
      ...(unit.emblemTraits ?? []),
    ]);
    for (const name of names) {
      const list = contributors.get(name) ?? [];
      list.push(index);
      contributors.set(name, list);
    }
  });

  const resolved: ResolvedTrait[] = [];
  const matchedNames = new Set<string>();

  for (const trait of traits) {
    const name = trait.name || trait.key;
    const unitIndexes = contributors.get(name) ?? contributors.get(trait.key) ?? [];
    matchedNames.add(name);
    matchedNames.add(trait.key);

    const sorted = [...trait.breakpoints].sort((a, b) => a.count - b.count);
    const activeBreakpoint = [...sorted].reverse().find(bp => unitIndexes.length >= bp.count) ?? null;
    const nextBreakpoint = sorted.find(bp => bp.count > unitIndexes.length) ?? null;

    resolved.push({
      key: trait.key,
      name,
      count: unitIndexes.length,
      activeBreakpoint,
      nextBreakpoint,
      trait,
      unitIndexes,
    });
  }

  for (const [name, unitIndexes] of contributors) {
    if (matchedNames.has(name)) continue;
    resolved.push({
      key: name,
      name,
      count: unitIndexes.length,
      activeBreakpoint: null,
      nextBreakpoint: null,
      trait: null,
      unitIndexes,
    });
  }

  return resolved;
}

/**
 * Calculates trait states for a given board
 */
export function calculateTraitStates(
  board: BoardUnit[],
  traits: Trait[],
  championMap: Map<string, Champion>
): TraitState[] {
  const units: TraitResolutionUnit[] = board.map(unit => ({
    id: unit.championId,
    traitNames: championMap.get(unit.championId)?.traits ?? [],
  }));

  return resolveTraitStates(units, traits).map(resolved => {
    const activeBreakpoints = resolved.trait
      ? [...resolved.trait.breakpoints]
        .sort((a, b) => a.count - b.count)
        .filter(bp => resolved.count >= bp.count)
      : [];

    return {
      traitKey: resolved.key,
      name: resolved.name,
      currentCount: resolved.count,
      activeBreakpoints,
      nextBreakpoint: resolved.nextBreakpoint,
      isActive: activeBreakpoints.length > 0,
      unitsContributing: resolved.unitIndexes
        .map(index => units[index].id)
        .filter((id): id is string => Boolean(id)),
    };
  });
}

/**
 * Gets all active bonuses formatted for display
 */
export function getActiveBonuses(traitStates: TraitState[]): ActiveBonus[] {
  const bonuses: ActiveBonus[] = [];
  
  for (const state of traitStates) {
    for (const bp of state.activeBreakpoints) {
      bonuses.push({
        traitName: state.name,
        breakpoint: bp,
        description: `${state.name} (${bp.count}): ${formatBreakpointBonus(bp)}`,
      });
    }
  }
  
  return bonuses;
}

/**
 * Calculates a synergy score for the board (higher = more synergies)
 */
export function getSynergyScore(traitStates: TraitState[]): number {
  let score = 0;
  
  for (const state of traitStates) {
    if (state.isActive) {
      // Base score for active trait
      score += 10;
      // Bonus for each active breakpoint
      score += state.activeBreakpoints.length * 5;
      // Bonus for higher breakpoint tiers
      score += state.activeBreakpoints.reduce((sum, bp) => sum + bp.count, 0);
    }
  }
  
  return score;
}

/**
 * Predicts next breakpoints for current trait counts
 */
export function predictBreakpoints(
  currentCounts: Map<string, number>,
  traits: Trait[]
): PredictedBreakpoint[] {
  return traits.map(trait => {
    const currentCount = currentCounts.get(trait.key) || 0;
    const sortedBreakpoints = [...trait.breakpoints].sort((a, b) => a.count - b.count);
    const nextBreakpoint = sortedBreakpoints.find(bp => bp.count > currentCount);

    return {
      traitKey: trait.key,
      name: trait.name || trait.key,
      currentCount,
      nextBreakpoint: nextBreakpoint?.count || null,
      unitsNeeded: nextBreakpoint ? nextBreakpoint.count - currentCount : 0,
    };
  });
}

/**
 * Gets trait count map from board
 */
export function getTraitCounts(
  board: BoardUnit[],
  championMap: Map<string, Champion>
): Map<string, number> {
  const counts = new Map<string, number>();
  
  for (const unit of board) {
    const champion = championMap.get(unit.championId);
    if (!champion) continue;
    
    for (const trait of champion.traits) {
      counts.set(trait, (counts.get(trait) || 0) + 1);
    }
  }
  
  return counts;
}

/**
 * Checks if a specific trait is active at a given count
 */
export function isTraitActive(trait: Trait, count: number): boolean {
  return trait.breakpoints.some(bp => count >= bp.count);
}

/**
 * Gets the highest active breakpoint for a trait at a given count
 */
export function getHighestActiveBreakpoint(trait: Trait, count: number): Breakpoint | null {
  const active = trait.breakpoints
    .filter(bp => count >= bp.count)
    .sort((a, b) => b.count - a.count);
  return active[0] || null;
}