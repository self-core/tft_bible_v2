# TFT Bible v2 - Feature Specification

## Overview
Three major features to implement for the upcoming TFT Set release (PBE Tuesday PST afternoon):

1. **Trait Tracker/Engine** - Core system for trait calculations, synergies, breakpoints
2. **Composition Builder Fixes** - Fix drag-drop, asset loading, UI/UX issues
3. **Sandbox Combat Simulator** - Predict fight outcomes with high-fidelity simulation

---

## 1. Trait Tracker/Engine

### Purpose
Centralized system for calculating:
- Trait activation states based on unit count
- Breakpoint bonuses and thresholds
- Synergy calculations between traits
- Real-time updates as units are added/removed

### Data Structures
```typescript
interface TraitState {
  traitKey: string;
  name: string;
  currentCount: number;
  activeBreakpoints: Breakpoint[];
  nextBreakpoint: Breakpoint | null;
  isActive: boolean;
  unitsContributing: string[]; // champion IDs
}

interface Breakpoint {
  count: number;
  bonus: string;
  effect: TraitEffect; // parsed effect for calculation
}

interface TraitEffect {
  type: 'stat_modifier' | 'mechanic' | 'spawn' | 'economy' | 'unique';
  target: 'self' | 'team' | 'enemy' | 'unit';
  stats?: Partial<ChampionStats>;
  description: string;
}
```

### API
```typescript
// Core functions
calculateTraitStates(board: BoardUnit[], traits: Trait[]): TraitState[]
getActiveBonuses(traitStates: TraitState[]): ActiveBonus[]
getSynergyScore(traitStates: TraitState[]): number
predictBreakpoints(currentCounts: Map<string, number>, traits: Trait[]): PredictedBreakpoint[]
```

### Tests Required
- [ ] Trait activates at correct unit count
- [ ] Multiple breakpoints work correctly
- [ ] Unique traits (exactly N) handled properly
- [ ] Emblem counting works
- [ ] Trait removal updates correctly
- [ ] Cross-trait synergies calculated

---

## 2. Composition Builder Fixes

### Issues to Fix
| Issue | Priority | Description |
|-------|----------|-------------|
| Drag & Drop broken | Critical | Units don't snap to board, ghost drag issues |
| Asset loading fails | High | Images don't load, fallback missing |
| Search doesn't work | High | Champion search returns no results |
| No board visualization | High | Can't see unit positioning |
| Save/Export broken | Medium | Console.log only, no actual save |
| Mobile unresponsive | Medium | Touch events not handled |
| No trait preview | Medium | Can't see active traits while building |

### Required Features
1. **Board Editor** - Full TFT board with hex grid, drag-drop from champion pool
2. **Champion Pool** - Searchable, filterable list with cost/trait filters
3. **Trait Tracker Panel** - Real-time trait activation display
4. **Item Assignment** - Drag items onto units
5. **Augment Selection** - Pick augments with descriptions
6. **Level/Economy Tracker** - Track player level, gold, XP
7. **Save/Load/Share** - Persist to backend, generate shareable links
8. **Export** - Download as image, JSON, or TFTactics link

### Tests Required
- [ ] Drag from pool to board works
- [ ] Drag between board positions works
- [ ] Unit removal works
- [ ] Star level cycling works
- [ ] Item assignment works
- [ ] Trait panel updates in real-time
- [ ] Save to backend works
- [ ] Load from backend works
- [ ] Share link generates correctly
- [ ] Mobile touch events work

---

## 3. Sandbox Combat Simulator

### Purpose
Predict fight outcomes between two boards with >90% accuracy (realistic target, 95% is extremely ambitious due to RNG).

### Scope - What to Simulate
| Mechanic | Priority | Notes |
|----------|----------|-------|
| Basic attacks | Critical | Auto-attacks with AS, range, AD |
| Abilities | Critical | Mana, targeting, damage, effects |
| Traits | Critical | All trait bonuses applied |
| Items | Critical | All item effects (stats, passives, actives) |
| Augments | High | Combat-relevant augments |
| Positioning | Critical | Targeting priority, range |
| Star levels | Critical | Stat scaling |
| RNG elements | Medium | Crit, dodge, proc chances (use expected values) |
| Combat phases | Medium | Planning, combat, resolution |

### Out of Scope (Phase 1)
- Player decision making (positioning changes mid-fight)
- Economy/shop simulation
- Multi-round tournaments
- RNG variance modeling (use deterministic expected values)

### Architecture
```
SandboxSimulator
├── BoardState          # Immutable board representation
├── UnitInstance        # Champion + items + star + position + runtime stats
├── CombatEngine        # Core simulation loop
├── AbilitySystem       # Ability execution, targeting, effects
├── AttackSystem        # Auto-attack logic
├── TraitSystem         # Trait bonus application
├── ItemSystem          # Item effect application
├── AugmentSystem       # Augment effect application
├── TargetingSystem     # Target selection logic
├── DamageSystem        # Damage calculation, mitigation
├── EffectSystem        # Buffs, debuffs, status effects
└── ResultAnalyzer      # Win probability, damage breakdown
```

### Data Structures
```typescript
interface SimulatorInput {
  playerBoard: BoardUnit[];
  enemyBoard: BoardUnit[];
  playerLevel: number;
  enemyLevel: number;
  playerAugments: string[];
  enemyAugments: string[];
  setId: number;
  options?: SimulatorOptions;
}

interface SimulatorOptions {
  iterations?: number;        // Monte Carlo runs (default: 1 for deterministic)
  seed?: number;              // RNG seed for reproducibility
  detailLevel?: 'summary' | 'full' | 'frame-by-frame';
  maxFrames?: number;         // Safety cap
}

interface SimulationResult {
  winner: 'player' | 'enemy' | 'draw';
  winProbability: number;     // 0-1 (for Monte Carlo)
  frames: Frame[];            // Frame-by-frame log
  summary: {
    duration: number;         // Frames
    playerSurvivors: number;
    enemySurvivors: number;
    totalDamageDealt: { player: number; enemy: number };
    keyMoments: KeyMoment[];
  };
  damageBreakdown: {
    byUnit: UnitDamage[];
    bySource: SourceDamage[];
  };
}
```

### Accuracy Targets
| Metric | Target |
|--------|--------|
| Winner prediction (deterministic) | >85% vs actual match data |
| Damage dealt per unit | ±15% |
| Fight duration (frames) | ±20% |
| Key unit survival | >80% |

### Tests Required
- [ ] Basic 1v1 combat resolves correctly
- [ ] Abilities cast at correct mana
- [ ] Targeting follows TFT priority rules
- [ ] Items apply correct stats/effects
- [ ] Traits activate at correct counts
- [ ] Positioning affects targeting
- [ ] Star level scaling works
- [ ] Augments apply effects
- [ ] Known compositions match meta results
- [ ] Performance: <500ms for typical fight

---

## Implementation Order (TDD)

### Phase 1: Foundation (Week 1)
1. **Trait Engine** - Core trait calculation system
   - Tests first → Implementation
2. **Type Definitions** - Shared types for all three features

### Phase 2: Composition Builder (Week 2)
1. **Board Component** - Fixed TFTBoard with proper drag-drop
2. **Champion Pool** - Search, filter, drag source
3. **Trait Panel** - Real-time trait display
4. **Item/Augment Systems** - Assignment UI
5. **Save/Load/Share** - Backend integration

### Phase 3: Sandbox Simulator (Week 3-4)
1. **Core Types & BoardState** - Immutable data structures
2. **CombatEngine** - Main simulation loop
3. **AbilitySystem** - Ability execution
4. **AttackSystem** - Auto-attacks
5. **Trait/Item/Augment Systems** - Effect application
6. **Targeting/Damage/Effect Systems** - Core mechanics
7. **ResultAnalyzer** - Output formatting
8. **Integration Tests** - Full fight simulations

### Phase 4: Polish & Integration (Week 5)
1. **UI Integration** - Sandbox page in app
2. **Performance Optimization** - Web Workers for simulation
3. **Documentation** - API docs, usage examples
4. **PBE Data Validation** - Test against new set data

---

## File Structure

```
frontend/src/
├── lib/
│   ├── traitEngine.ts          # Core trait calculations
│   ├── traitEngine.test.ts
│   ├── combatSimulator/
│   │   ├── index.ts            # Main export
│   │   ├── types.ts            # All simulator types
│   │   ├── CombatEngine.ts
│   │   ├── BoardState.ts
│   │   ├── UnitInstance.ts
│   │   ├── AbilitySystem.ts
│   │   ├── AttackSystem.ts
│   │   ├── TraitSystem.ts
│   │   ├── ItemSystem.ts
│   │   ├── AugmentSystem.ts
│   │   ├── TargetingSystem.ts
│   │   ├── DamageSystem.ts
│   │   ├── EffectSystem.ts
│   │   ├── ResultAnalyzer.ts
│   │   └── index.test.ts       # Integration tests
│   └── api.ts                  # Extended with simulator queries
├── components/
│   ├── TFTBoard.tsx            # Fixed drag-drop board
│   ├── TFTBoard.test.tsx
│   ├── ChampionPool.tsx        # Searchable champion list
│   ├── ChampionPool.test.tsx
│   ├── TraitTracker.tsx        # Real-time trait display
│   ├── TraitTracker.test.tsx
│   ├── ItemAssignment.tsx      # Drag items to units
│   ├── AugmentSelector.tsx     # Augment picker
│   ├── LevelTracker.tsx        # Level/XP/Gold display
│   └── CompositionActions.tsx  # Save/Load/Share/Export
├── pages/
│   ├── CompositionBuilder.tsx  # Fixed builder page
│   ├── SandboxSimulator.tsx    # New simulator page
│   └── SandboxSimulator.test.tsx
├── hooks/
│   ├── useTraitEngine.ts       # React hook for trait tracking
│   ├── useCombatSimulator.ts   # React hook for simulation
│   └── useCompositionBuilder.ts
└── stores/
    └── simulatorStore.ts       # Zustand store for simulator state
```

---

## Backend Extensions

### New GraphQL Queries/Mutations
```graphql
# Simulator
type SimulatorResult { ... }
type SimulatorInput { ... }

query simulateCombat(input: SimulatorInput!): SimulatorResult!

# Composition Builder enhancements
extend type Composition {
  units: [BoardUnit!]!
  augments: [String!]!
  level: Int
  gold: Int
}

mutation saveComposition(input: SaveCompositionInput!): Composition!
mutation shareComposition(id: ID!): ShareLink!
```

### Database Schema Updates
```sql
-- Composition collection additions
units: [{ championId, position, starLevel, items }]
augments: [String]
level: Int
gold: Int
```

---

## Acceptance Criteria

### Trait Engine
- [ ] All Set 18 traits calculate correctly
- [ ] Real-time updates <16ms
- [ ] Works with emblems
- [ ] Handles unique trait counts (exactly N)

### Composition Builder
- [ ] Drag-drop works on desktop & mobile
- [ ] All assets load with fallbacks
- [ ] Search filters by name, cost, trait
- [ ] Save creates shareable link
- [ ] Export generates valid TFTactics URL

### Sandbox Simulator
- [ ] Simulates 8v8 fight in <500ms
- [ ] Predicts winner for known meta comps >85%
- [ ] Outputs frame-by-frame log
- [ ] Web Worker support for non-blocking UI
- [ ] Handles all Set 18 traits/items/augments

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Simulator accuracy too low | High | High | Start with deterministic expected values, add Monte Carlo later |
| PBE data incomplete | Medium | High | Build flexible data loading, fallback to embedded data |
| Drag-drop library issues | Medium | Medium | Use react-dnd with HTML5 backend, test thoroughly |
| Performance on mobile | Medium | Medium | Web Workers, simplify simulation for mobile |
| Scope creep | High | Medium | Strict phase gates, defer nice-to-haves |

---

## Next Steps

1. **Immediate**: Create traitEngine.ts with TDD
2. **Day 2-3**: Fix TFTBoard drag-drop, create ChampionPool
3. **Day 4-5**: Build CompositionBuilder page integration
4. **Week 2**: Sandbox simulator core engine
5. **Week 3**: Full simulator with all systems
6. **Week 4**: UI integration, testing, PBE validation