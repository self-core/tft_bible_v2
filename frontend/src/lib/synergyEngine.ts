import { Champion, Trait } from './api';

export interface ScoreBreakdown {
  breakpointProximity: number;
  traitOverlap: number;
  uniqueTrait: number;
  costPenalty: number;
}

export interface ChampScore {
  champion: Champion;
  totalScore: number;
  breakdown: ScoreBreakdown;
}

export interface ActiveTraitInfo {
  trait: Trait;
  currentCount: number;
  nextBreakpoint: { count: number; bonus: string } | null;
  isActive: boolean;
}

function countTraitsOnBoard(board: Champion[], emblems: Record<string, number>): Record<string, number> {
  const counts: Record<string, number> = { ...emblems };
  for (const champ of board) {
    for (const t of champ.traits) {
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  return counts;
}

export function scoreCandidate(
  champion: Champion,
  board: Champion[],
  traits: Trait[],
  emblems: Record<string, number>,
): ChampScore {
  const counts = countTraitsOnBoard(board, emblems);
  const traitMap = new Map(traits.map(t => [t.name, t]));

  let breakpointProximity = 0;
  let traitOverlap = 0;
  let uniqueTrait = 0;

  for (const traitName of champion.traits) {
    const current = counts[traitName] || 0;
    if (current > 0) {
      traitOverlap += 3;
    } else {
      uniqueTrait += 5;
    }
    const traitDef = traitMap.get(traitName);
    if (traitDef?.breakpoints?.length) {
      const sorted = [...traitDef.breakpoints].sort((a, b) => a.count - b.count);
      const nextBP = sorted.find(bp => bp.count > current);
      if (nextBP) {
        breakpointProximity += 10 * (current / nextBP.count);
      }
    }
  }

  const costPenalty = champion.cost * 0.5;

  const totalScore = breakpointProximity + traitOverlap + uniqueTrait - costPenalty;

  return {
    champion,
    totalScore: Math.max(0, Math.round(totalScore * 10) / 10),
    breakdown: {
      breakpointProximity: Math.round(breakpointProximity * 10) / 10,
      traitOverlap,
      uniqueTrait,
      costPenalty,
    },
  };
}

export function getTopRecommendations(
  board: Champion[],
  pool: Champion[],
  traits: Trait[],
  emblems: Record<string, number>,
  count = 5,
): ChampScore[] {
  const boardIds = new Set(board.map(c => c.id));
  const candidates = pool.filter(c => !boardIds.has(c.id));
  const scored = candidates
    .map(c => scoreCandidate(c, board, traits, emblems))
    .sort((a, b) => b.totalScore - a.totalScore);
  return scored.slice(0, count);
}

export function greedyFill(
  board: Champion[],
  pool: Champion[],
  boardSize: number,
  traits: Trait[],
  emblems: Record<string, number>,
): Champion[] {
  const result = [...board];
  const usedIds = new Set(result.map(c => c.id));

  while (result.length < boardSize && usedIds.size < pool.length) {
    const available = pool.filter(c => !usedIds.has(c.id));
    const scored = available.map(c => ({ champ: c, score: scoreCandidate(c, result, traits, emblems).totalScore }));
    scored.sort((a, b) => b.score - a.score);
    if (scored.length === 0) break;
    const pick = scored[0].champ;
    result.push(pick);
    usedIds.add(pick.id);
  }

  return result;
}

export function computeActiveTraits(
  board: Champion[],
  traits: Trait[],
  emblems: Record<string, number>,
): ActiveTraitInfo[] {
  const counts = countTraitsOnBoard(board, emblems);
  return traits.map(trait => {
    const currentCount = counts[trait.name] || counts[trait.key] || 0;
    const sorted = [...(trait.breakpoints || [])].sort((a, b) => a.count - b.count);
    const activeBP = sorted.filter(bp => currentCount >= bp.count);
    const nextBP = sorted.find(bp => bp.count > currentCount) || null;
    return {
      trait,
      currentCount,
      nextBreakpoint: nextBP,
      isActive: activeBP.length > 0,
    };
  });
}
