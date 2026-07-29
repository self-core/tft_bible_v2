import { useMemo } from 'react';
import { Champion, Trait } from '../lib/api';
import {
  getTopRecommendations,
  greedyFill,
  computeActiveTraits,
  ChampScore,
  ActiveTraitInfo,
} from '../lib/synergyEngine';

export interface SynergyFilters {
  boardSize: number;
  enabledCosts: number[];
  emblems: Record<string, number>;
}

export function useSynergy(
  champions: Champion[],
  traits: Trait[],
  board: Champion[],
  filters: SynergyFilters,
) {
  const pool = useMemo(() => {
    return champions.filter(c => filters.enabledCosts.includes(c.cost));
  }, [champions, filters.enabledCosts]);

  const recommendations = useMemo<ChampScore[]>(() => {
    return getTopRecommendations(board, pool, traits, filters.emblems);
  }, [board, pool, traits, filters.emblems]);

  const optimizedBoard = useMemo<Champion[]>(() => {
    return greedyFill(board, pool, filters.boardSize, traits, filters.emblems);
  }, [board, pool, filters.boardSize, traits, filters.emblems]);

  const activeTraits = useMemo<ActiveTraitInfo[]>(() => {
    return computeActiveTraits(board, traits, filters.emblems);
  }, [board, traits, filters.emblems]);

  return { recommendations, optimizedBoard, activeTraits };
}
