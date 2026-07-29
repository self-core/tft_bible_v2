# Synergy Recommendation System — Design Spec

> **Date:** 2026-07-29
> **Status:** Approved
> **Scope:** Frontend synergy engine, SynergyPanel UI, TraitTracker replacement, greedy trait-coverage fill algorithm

---

## Problem

The TraitTracker shows active traits but doesn't help users *build* a better board. Players need real-time recommendations for which champion to add next, and a way to auto-fill empty board slots with an optimal composition.

## Requirements

- **Live suggestions** — as the user places/removes champions, show the top 5 recommended champions for the next slot, updated in real time
- **Optimize button** — auto-fill all remaining empty slots with the highest-scoring composition
- **Consistent data** — operate on one set's `{ champions, traits }`; never mix across sets
- **Constraints** — board size (level 5–10), cost filters (toggle 1–5 cost), emblem slots (add bonus trait counts)
- **Explainable scores** — each recommendation shows a score breakdown so the user understands *why* a champion is suggested
- **Per-set scoping** — the panel is bound to the selected set's champion/trait pool
- **Replace TraitTracker** — the right panel becomes the SynergyPanel, absorbing the active trait display

## Approach: Greedy Trait-Coverage Fill

A greedy algorithm that scores each candidate champion against the current board state:

```
score(champion, board, traits, emblems) =
    breakpointProximity × 10
    + traitOverlap × 3
    + uniqueTrait × 5
    - costPenalty (when cost filters active)
```

- **breakpointProximity**: how close the champion's traits bring the board to the next breakpoint threshold
- **traitOverlap**: traits already present on the board (synergy reinforcement)
- **uniqueTrait**: a trait not yet on the board at all
- **costPenalty**: weight against high-cost champs when cost filters are active (scaled by champion cost)

The algorithm is deterministic, fast (microseconds for 10-slot boards), and explainable. Each recommendation includes a breakdown of why each score was awarded.

### Why greedy?

| Approach | Pros | Cons |
|----------|------|------|
| **Greedy fill** (selected) | Simple, fast, explainable, deterministic | May miss non-obvious combos where two picks together unlock more than one great pick alone |
| Beam search | More thorough, catches non-obvious synergies | More complex, harder to explain results |
| Pre-computed comp library | Real-world-tested results | Needs constant data maintenance, goes stale |

The scoring system is designed so a beam-search layer can be swapped in later without rewriting the interface.

## Architecture

### New Files

| File | Responsibility |
|------|---------------|
| `frontend/src/lib/synergyEngine.ts` | Pure computation: `scoreCandidate()`, `greedyFill()`, `getTopRecommendations()`, `computeActiveTraits()`. Zero React dependencies. Unit-testable. |
| `frontend/src/hooks/useSynergy.ts` | React hook: wires synergy engine + GraphQL activeSet data + local board/filter state. Returns `{ recommendations, optimizedBoard, activeTraits, scoreBreakdowns }`. |
| `frontend/src/components/SynergyPanel.tsx` | Right panel: replaces TraitTracker. Shows active trait list with progress bars, top-5 recommendations with score breakdowns, optimize button with mini-board preview, level/cost/emblem controls. |

### Modified Files

| File | Change |
|------|--------|
| `frontend/src/pages/TraitTrackerPage.tsx` | Replace `TraitTracker` import with `SynergyPanel`. Pass board state + filters as props. |
| `frontend/src/components/TraitTracker.tsx` | Removed. Functionality absorbed into `SynergyPanel`. |

### Data Flow

```
TraitTrackerPage
  ├── GraphQL: activeSet { champions { id, name, cost, traits }, traits { key, name, breakpoints } }
  ├── Board state (useState: championsOnBoard[], championsOnBench[])
  ├── Set selector (active set from activeSet query)
  ├── Level selector (5–10, determines board size)
  ├── Cost toggles (1–5, which costs are allowed)
  └── Emblem inputs (trait name + count)
        │
        ▼
  useSynergy(champions, traits, boardState, filters)
        │
        ├── synergyEngine.getTopRecommendations()  → ChampScore[] (top 5)
        ├── synergyEngine.greedyFill()             → Champion[] (full board)
        └── synergyEngine.computeActiveTraits()    → ActiveTrait[] (progress + breakpoints)
        │
        ▼
  SynergyPanel renders all sections
```

### synergyEngine.ts API

```typescript
interface ChampScore {
  champion: Champion;
  totalScore: number;
  breakdown: {
    breakpointProximity: number;
    traitOverlap: number;
    uniqueTrait: number;
    costPenalty: number;
  };
}

interface ActiveTrait {
  trait: Trait;
  currentCount: number;
  nextBreakpoint: { count: number; bonus: string } | null;
  isActive: boolean;
}

function scoreCandidate(
  champion: Champion,
  board: Champion[],
  traits: Trait[],
  emblems: Record<string, number>,
): ChampScore;

function getTopRecommendations(
  board: Champion[],
  pool: Champion[],
  traits: Trait[],
  emblems: Record<string, number>,
  count?: number,
): ChampScore[];

function greedyFill(
  board: Champion[],
  pool: Champion[],
  boardSize: number,
  traits: Trait[],
  emblems: Record<string, number>,
): Champion[];

function computeActiveTraits(
  board: Champion[],
  traits: Trait[],
  emblems: Record<string, number>,
): ActiveTrait[];
```

## UI Layout (Right Panel)

```
┌───────────────────────────────────────┐
│  Set 18 · Enchanted Wilds             │
│                                       │
│  Controls                             │
│  ├── Board Size: [5][6][7][8][9][10] │
│  ├── Costs:  [✓]1 [✓]2 [✓]3 [✓]4 [✓]5│
│  └── Emblems: [trait ▼] [+1 ▼] [+Add]│
│                                       │
│  Active Traits                        │
│  ● Blossom    2/3  ████░░  67%       │
│  ● Coven      1/4  ██░░░░  25%       │
│  ● Inferno    2/2  ██████ 100%  ✓    │
│  ● Ravager    1/2  ██░░░░  50%       │
│  ○ Riftbeast  0/2  ░░░░░░   0%       │
│                                       │
│  Next Champion                        │
│  ① Karma  (3g)  +6 pts               │
│    Blossom 2/3→3/3 ✓  + Riftbeast 0/2→1/2 ✓│
│  ② Varus  (4g)  +5 pts               │
│    Inferno 2/2 ✓  + Ravager 1/2→2/2 ✓│
│  ③ Ornn   (4g)  +3 pts               │
│  ④ Taric  (5g)  +2 pts               │
│  ⑤ Kobuko (2g)  +1 pts               │
│                                       │
│  [✨ Optimize Board]                  │
│                                       │
│  Optimized Preview                    │
│  ┌───┬───┬───┬───┐  (mini 4x7 grid) │
│  │ A │ B │ C │ D │  champ icons      │
│  ├───┼───┼───┼───┤                   │
│  │ E │ F │ G │   │                   │
│  └───┴───┴───┴───┘                   │
└───────────────────────────────────────┘
```

### Recommendation Card Detail

Each recommendation card shows:
- Champion name, cost, and portrait icon
- Total score
- Per-trait breakdown:
  - Trait name + current count → new count
  - Checkmark if a breakpoint is activated
  - New traits highlighted with a "NEW" badge

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Board is full | Recommendations empty; button disabled |
| No champions match cost filters | Show "No champions match current filters" |
| All pool champions already on board | Show "All champions placed" |
| Emblem count exceeds breakpoint | Trait shown as active but recommendations stop suggesting champs for that trait |
| Set changes mid-session | Re-fetch champ/trait pool; clear recommendations; re-score from empty board |
| CDragon data unavailable | Use embedded fallback (Set 18 only); SynergyPanel shows notice "Limited data" |
