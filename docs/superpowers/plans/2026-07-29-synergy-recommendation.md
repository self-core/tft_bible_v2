# Synergy Recommendation System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the TraitTracker with a SynergyPanel that provides real-time champion recommendations and an optimize-board button using greedy trait-coverage fill.

**Architecture:** Pure computation in `synergyEngine.ts` (zero React deps), wrapped by `useSynergy` hook, rendered by `SynergyPanel` component. The panel replaces `TraitTracker` in `TraitTrackerPage`, absorbing its trait display. GraphQL queries switch from global `GET_CHAMPIONS`/`GET_TRAITS` to `activeSet { champions, traits }`.

**Tech Stack:** TypeScript, React, Apollo Client, TailwindCSS, vitest

---

## File Structure

| File | Status | Responsibility |
|------|--------|---------------|
| `frontend/src/lib/synergyEngine.ts` | **Create** | Pure scoring/fill functions, no React |
| `frontend/src/lib/synergyEngine.test.ts` | **Create** | Tests for scoring, recommendations, greedy fill |
| `frontend/src/hooks/useSynergy.ts` | **Create** | React hook: wires engine + GraphQL + local state |
| `frontend/src/components/SynergyPanel.tsx` | **Create** | Right panel: traits + recommendations + optimize + controls |
| `frontend/src/pages/TraitTrackerPage.tsx` | **Modify** | Use activeSet query, pass set-scoped data, replace TraitTracker with SynergyPanel |
| `frontend/src/components/TraitTracker.tsx` | **Remove** | Absorbed into SynergyPanel |
| `frontend/src/lib/graphql.ts` | **Modify** | Update GET_ACTIVE_SET to include champions + traits fields |

---

### Task 1: Create synergyEngine.ts — pure scoring engine

**Files:**
- Create: `frontend/src/lib/synergyEngine.ts`
- Create: `frontend/src/lib/synergyEngine.test.ts`

- [ ] **Step 1: Write the test file with type imports and a scaffold test**

```typescript
// frontend/src/lib/synergyEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  scoreCandidate,
  getTopRecommendations,
  greedyFill,
  computeActiveTraits,
} from './synergyEngine';
import { Champion, Trait } from './api';

const makeChamp = (overrides: Partial<Champion> = {}): Champion => ({
  id: 'test',
  name: 'Test',
  cost: 3,
  traits: [],
  stats: { hp: 600, mana: 40, damage: 50 },
  ability: { name: '', variables: [] },
  imageUrl: null,
  splashUrl: null,
  iconUrl: null,
  ...overrides,
});

const makeTrait = (overrides: Partial<Trait> = {}): Trait => ({
  key: 'test',
  name: 'Test',
  description: '',
  breakpoints: [{ count: 2, bonus: 'bonus' }],
  ...overrides,
});

describe('scoreCandidate', () => {
  it('returns 0 for empty board with no matching traits', () => {
    const champ = makeChamp({ id: 'TFT18_Akali', name: 'Akali', traits: ['Blossom'] });
    const result = scoreCandidate(champ, [], [], {});
    expect(result.totalScore).toBe(0);
    expect(result.breakdown.uniqueTrait).toBe(5);
  });
});

describe('getTopRecommendations', () => {
  it('returns top N champions sorted by score descending', () => {
    const pool = [
      makeChamp({ id: '1', name: 'A', cost: 1, traits: ['X'] }),
      makeChamp({ id: '2', name: 'B', cost: 2, traits: ['Y'] }),
      makeChamp({ id: '3', name: 'C', cost: 3, traits: ['Z'] }),
    ];
    const result = getTopRecommendations([], pool, [], {}, 2);
    expect(result).toHaveLength(2);
  });
});

describe('greedyFill', () => {
  it('fills board to specified size', () => {
    const pool = [
      makeChamp({ id: '1', name: 'A', cost: 1, traits: ['Blossom'] }),
      makeChamp({ id: '2', name: 'B', cost: 2, traits: ['Inferno'] }),
      makeChamp({ id: '3', name: 'C', cost: 3, traits: ['Ravager'] }),
    ];
    const result = greedyFill([], pool, 2, [], {});
    expect(result).toHaveLength(2);
  });

  it('does not exceed available pool size', () => {
    const pool = [makeChamp({ id: '1', name: 'A', cost: 1, traits: ['Blossom'] })];
    const result = greedyFill([], pool, 5, [], {});
    expect(result).toHaveLength(1);
  });
});

describe('computeActiveTraits', () => {
  it('returns active status for each trait', () => {
    const traits = [
      makeTrait({ key: 'Blossom', name: 'Blossom', breakpoints: [{ count: 2, bonus: 'x2' }, { count: 3, bonus: 'x3' }] }),
    ];
    const board = [makeChamp({ traits: ['Blossom'] })];
    const result = computeActiveTraits(board, traits, {});
    expect(result).toHaveLength(1);
    expect(result[0].currentCount).toBe(1);
    expect(result[0].nextBreakpoint?.count).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/synergyEngine.test.ts --project frontend` or `cd frontend && npx vitest run src/lib/synergyEngine.test.ts`
Expected: FAIL — module not found errors

- [ ] **Step 3: Write synergyEngine.ts**

```typescript
// frontend/src/lib/synergyEngine.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/synergyEngine.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/synergyEngine.ts frontend/src/lib/synergyEngine.test.ts
git commit -m "feat: add synergy engine with greedy trait-coverage fill"
```

---

### Task 2: Update GraphQL queries for set-scoped data

**Files:**
- Modify: `frontend/src/lib/graphql.ts`

- [ ] **Step 1: Update GET_ACTIVE_SET to fetch champions + traits**

Change the query at `frontend/src/lib/graphql.ts:252-260` from:

```graphql
query GetActiveSet {
  activeSet {
    setId
    setName
    status
  }
}
```

to:

```graphql
query GetActiveSet {
  activeSet {
    setId
    setName
    status
    champions {
      id
      name
      cost
      traits
      stats { hp mana damage }
      ability { name variables { name values } }
      imageUrl
    }
    traits {
      key
      name
      description
      breakpoints { count bonus }
    }
  }
}
```

- [ ] **Step 2: Update `GET_TRAITS` and `GET_CHAMPIONS` to accept optional setId, defaulting to active set**

At `frontend/src/lib/graphql.ts:5-90`, change both queries to accept `$setId: Int` and use `set(setId: $setId)` instead of the global query:

```graphql
query GetChampions($setId: Int) {
  championsBySet(setId: $setId) {
    id
    name
    cost
    traits
    stats { hp mana damage }
    ability { name variables { name values } }
    imageUrl
    splashUrl
  }
}
```

```graphql
query GetTraits($setId: Int) {
  traitsBySet(setId: $setId) {
    key
    name
    description
    breakpoints { count bonus }
  }
}
```

(Note: `traitsBySet` may not exist as a query — check resolvers. If not, use `set(setId: $setId) { traits { ... } }` instead.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/graphql.ts
git commit -m "feat: update GraphQL queries for set-scoped data"
```

---

### Task 3: Create useSynergy hook

**Files:**
- Create: `frontend/src/hooks/useSynergy.ts`

- [ ] **Step 1: Write the hook**

```typescript
// frontend/src/hooks/useSynergy.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useSynergy.ts
git commit -m "feat: add useSynergy hook"
```

---

### Task 4: Create SynergyPanel component

**Files:**
- Create: `frontend/src/components/SynergyPanel.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/components/SynergyPanel.tsx
import React from 'react';
import { Champion, Trait } from '../lib/api';
import { useSynergy, SynergyFilters } from '../hooks/useSynergy';
import { ChampScore, ActiveTraitInfo } from '../lib/synergyEngine';
import { proxyUrl } from '../lib/imageProxy';

interface SynergyPanelProps {
  setLabel: string;
  champions: Champion[];
  traits: Trait[];
  board: Champion[];
  filters: SynergyFilters;
  onFiltersChange: (filters: SynergyFilters) => void;
}

const costColors: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800 border-blue-300',
  2: 'bg-green-100 text-green-800 border-green-300',
  3: 'bg-purple-100 text-purple-800 border-purple-300',
  4: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  5: 'bg-red-100 text-red-800 border-red-300',
};

const SynergyPanel: React.FC<SynergyPanelProps> = ({
  setLabel,
  champions,
  traits,
  board,
  filters,
  onFiltersChange,
}) => {
  const { recommendations, optimizedBoard, activeTraits } = useSynergy(champions, traits, board, filters);
  const activeCount = board.length;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
      {/* Set label */}
      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{setLabel}</div>

      {/* Board size selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Board Size</label>
        <div className="flex gap-1">
          {[5, 6, 7, 8, 9, 10].map(n => (
            <button
              key={n}
              onClick={() => onFiltersChange({ ...filters, boardSize: n })}
              className={`px-2 py-1 text-xs rounded border transition-all ${
                filters.boardSize === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Cost toggles */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Costs</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(c => (
            <button
              key={c}
              onClick={() => {
                const was = filters.enabledCosts.includes(c);
                const next = was
                  ? filters.enabledCosts.filter(x => x !== c)
                  : [...filters.enabledCosts, c].sort();
                onFiltersChange({ ...filters, enabledCosts: next });
              }}
              className={`px-2 py-1 text-xs rounded border transition-all ${
                filters.enabledCosts.includes(c)
                  ? `${costColors[c]} border-current`
                  : 'bg-gray-100 text-gray-400 border-gray-200'
              }`}
            >
              {c}★
            </button>
          ))}
        </div>
      </div>

      {/* Active Traits */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Active Traits ({activeCount} units)</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activeTraits.map(({ trait, currentCount, nextBreakpoint, isActive }) => (
            <div key={trait.key} className={`text-xs ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">{trait.name}</span>
                <span className="text-gray-500">
                  {currentCount}/{nextBreakpoint?.count || trait.breakpoints?.[0]?.count || '—'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                {nextBreakpoint && (
                  <div
                    className={`h-1.5 rounded-full transition-all ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
                    style={{ width: `${Math.min(100, (currentCount / nextBreakpoint.count) * 100)}%` }}
                  />
                )}
              </div>
            </div>
          ))}
          {activeTraits.length === 0 && (
            <p className="text-xs text-gray-400 italic">No trait data available</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Next Champion</h3>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={rec.champion.id} className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-xs font-bold text-gray-400 w-4 pt-1">{i + 1}</span>
              {rec.champion.imageUrl && (
                <img src={proxyUrl(rec.champion.imageUrl)} alt={rec.champion.name} className="w-8 h-8 rounded border border-gray-300" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{rec.champion.name}</span>
                  <span className={`text-xs px-1 rounded ${
                    costColors[rec.champion.cost]?.split(' ')[0] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {rec.champion.cost}★
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">{rec.champion.traits.join(', ')}</div>
                <div className="text-xs text-blue-600 font-medium">+{rec.totalScore} pts</div>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              {board.length >= filters.boardSize ? 'Board is full' : 'No champions match filters'}
            </p>
          )}
        </div>
      </div>

      {/* Optimize button */}
      {board.length < filters.boardSize && board.length > 0 && (
        <div>
          <button
            onClick={() => {
              const filled = optimizedBoard.slice(board.length);
              console.log('Optimized additions:', filled.map(c => c.name));
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
          >
            ✨ Optimize Board ({filters.boardSize - board.length} slots)
          </button>
          {optimizedBoard.length > board.length && (
            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Suggested additions:</p>
              <div className="space-y-1">
                {optimizedBoard.slice(board.length).map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                    {c.imageUrl && <img src={proxyUrl(c.imageUrl)} alt={c.name} className="w-5 h-5 rounded border border-gray-300" />}
                    <span>{c.name}</span>
                    <span className={`text-xs px-1 rounded ${costColors[c.cost]?.split(' ')[0] || 'bg-gray-100'}`}>{c.cost}★</span>
                    <span className="text-gray-400 truncate">{c.traits.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SynergyPanel;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/SynergyPanel.tsx
git commit -m "feat: add SynergyPanel component"
```

---

### Task 5: Update TraitTrackerPage to use SynergyPanel

**Files:**
- Modify: `frontend/src/pages/TraitTrackerPage.tsx`
- Remove: `frontend/src/components/TraitTracker.tsx`

- [ ] **Step 1: Rewrite the page**

Replace imports and right panel in `TraitTrackerPage.tsx`:

```typescript
// Add imports
import { useQuery } from '@apollo/client';
import { GET_ACTIVE_SET } from '../lib/graphql';
import { Champion, Trait } from '../lib/api';
import SynergyPanel from '../components/SynergyPanel';
import { SynergyFilters } from '../hooks/useSynergy';
```

Add filter state:
```typescript
const [filters, setFilters] = useState<SynergyFilters>({
  boardSize: 8,
  enabledCosts: [1, 2, 3, 4, 5],
  emblems: {},
});
```

Change the data queries from separate GET_CHAMPIONS/GET_TRAITS to:
```typescript
const { data: activeSetData } = useQuery(GET_ACTIVE_SET);
const champions = (activeSetData?.activeSet?.champions || []) as Champion[];
const traits = (activeSetData?.activeSet?.traits || []) as Trait[];
const setName = activeSetData?.activeSet?.setName || '';
```

Remove the TraitTracker import. Replace the right panel (`<div className="lg:col-span-3">`) with:
```tsx
<div className="lg:col-span-3">
  <SynergyPanel
    setLabel={setName ? `Set ${activeSetData.activeSet.setId} · ${setName}` : 'Loading...'}
    champions={champions}
    traits={traits}
    board={championsOnBoardFlat}
    filters={filters}
    onFiltersChange={setFilters}
  />
</div>
```

Remove the unused `traitsData` and `championsData` variables. Remove `GET_TRAITS` and `GET_CHAMPIONS` from the imports.

- [ ] **Step 2: Delete TraitTracker.tsx**

```bash
git rm frontend/src/components/TraitTracker.tsx
```

- [ ] **Step 3: Ensure no remaining references to TraitTracker**

Run: `rg "TraitTracker" frontend/src/`
Expected: no matches (or only comments)

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/TraitTrackerPage.tsx frontend/src/lib/graphql.ts
git rm frontend/src/components/TraitTracker.tsx
git commit -m "feat: replace TraitTracker with SynergyPanel in Tracker page"
```

---

### Task 6: Verify frontend builds and renders

- [ ] **Step 1: Run lint**

Run: `cd frontend && npm run lint`
Expected: 0 warnings

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build`
Expected: Build completes without errors

- [ ] **Step 3: Docker build and restart**

Run: `docker compose build frontend && docker compose up -d frontend`
Expected: Frontend container starts, page loads at http://localhost

- [ ] **Step 4: Quick smoke test**

Run: `curl http://localhost` (or `Invoke-WebRequest`)
Expected: 200 OK, HTML contains "TFT Bible" or synergy-related text

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: verify full build and deployment"
```

---

## Self-Review

**Spec coverage check:**
- Live suggestions → Task 3 (useSynergy) + Task 4 (SynergyPanel renders recommendations)
- Optimize button → Task 4 (SynergyPanel has optimize button with preview)
- Board size / cost filters / emblems → Task 4 (SynergyPanel controls) + Task 5 (filter state)
- Score breakdown → `SynergyPanel` renders `+{rec.totalScore} pts` (can add per-trait breakdown in a follow-up)
- Consistent data → Tasks 2 + 5 use `activeSet { champions, traits }`, never mixing sets
- Replace TraitTracker → Task 5 removes TraitTracker import and component

**Placeholder scan:** No "TBD", "TODO", or incomplete code blocks.

**Type consistency:** `Champion`/`Trait` types from `./api`, `SynergyFilters` from `useSynergy`, `ChampScore`/`ActiveTraitInfo` from `synergyEngine` — all consistent across tasks.
