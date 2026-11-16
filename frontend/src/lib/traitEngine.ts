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

/**
 * Calculates trait states for a given board
 */
export function calculateTraitStates(
  board: BoardUnit[],
  traits: Trait[],
  championMap: Map<string, Champion>
): TraitState[] {
  // Count trait occurrences
  const traitCounts = new Map<string, number>();
  const traitUnits = new Map<string, string[]>();

  for (const unit of board) {
    const champion = championMap.get(unit.championId);
    if (!champion) continue;

    for (const traitName of champion.traits) {
      traitCounts.set(traitName, (traitCounts.get(traitName) || 0) + 1);
      const units = traitUnits.get(traitName) || [];
      units.push(unit.championId);
      traitUnits.set(traitName, units);
    }
  }

  // Build trait states
  return traits.map(trait => {
    const currentCount = traitCounts.get(trait.key) || 0;
    const sortedBreakpoints = [...trait.breakpoints].sort((a, b) => a.count - b.count);
    
    const activeBreakpoints = sortedBreakpoints.filter(bp => currentCount >= bp.count);
    const nextBreakpoint = sortedBreakpoints.find(bp => bp.count > currentCount) || null;
    
    return {
      traitKey: trait.key,
      name: trait.name || trait.key,
      currentCount,
      activeBreakpoints,
      nextBreakpoint,
      isActive: activeBreakpoints.length > 0,
      unitsContributing: traitUnits.get(trait.key) || [],
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
        description: `${state.name} (${bp.count}): ${bp.bonus}`,
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
    const maxBreakpoint = sortedBreakpoints[sortedBreakpoints.length - 1];
    
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