# Data Pipeline + Trait Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the full numeric champion stat block, numeric trait breakpoints, and item effects/components from cdragon, and upgrade the trait tracker to display and compute with numeric data.

**Architecture:** Extend the backend data model (interfaces → transformer → Mongoose schema → GraphQL schema), re-import sets from the local cdragon dump, then extend frontend types, queries, and the trait engine to consume numeric effects. One ingestion pass; no migrations beyond upsert re-import.

**Tech Stack:** Node/TS, Mongoose, Apollo Server (GraphQL), vitest (backend), Vite/React/Apollo Client, vitest+RTL (frontend).

**Spec:** `docs/superpowers/specs/2026-11-16-sandbox-combat-simulator-design.md` (see also `AGENT.md` "Critical Data Facts").

## Global Constraints

- Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`).
- Backend tests: vitest (`npm test` in `backend/`), co-located `*.test.ts`.
- Frontend tests: vitest + RTL (`npm run test` in `frontend/`); lint must pass with zero warnings.
- No new dependencies.
- Raw cdragon JSON files start with a UTF-8 BOM — strip before `JSON.parse`.
- Numeric fallback defaults (verbatim): hp 600, mana 40, damage 50, armor 40, magicResist 40, attackSpeed 0.55, range 1, initialMana 0, critChance 0.25, critMultiplier 1.4.
- Trait variable keys matching `/\{.*\}/` (localization hashes) and null values are dropped, never persisted.
- Set scope: existing sets (16, 17, 18) from `data/cdragon_en_us.json`. Set 19 ingestion lands via the same script Tuesday.

## Review Focus

1. **Lossy re-import regression** — a champion whose `stats` block is missing must get the fallback defaults, not crash or persist `NaN`. Test: `transformChampion fallback stats` (Task 1).
2. **Hash-key leakage** — trait/item variables with `{hash}` keys must not appear in GraphQL output; a user reading a trait's numeric bonus should never see `{1543aa48}`. Test: `transformTrait drops hash keys and nulls` (Task 2).
3. **BOM crash** — `JSON.parse` on the raw file throws "Unexpected token" without BOM stripping; import must succeed on the first try. Test: `parses file with UTF-8 BOM` (Task 4).
4. **Display string preservation** — `breakpoints[].bonus` and trait/item `description` must survive unchanged for the existing UI; numeric additions are additive only. Test: `transformTrait keeps bonus string` (Task 2).
5. **Frontend query drift** — old GraphQL caches/documents that omit new fields must still render (fields are optional in TS types where absent in old data). Test: `traitEngine handles breakpoint without variables` (Task 5).

---

### Task 1: Full champion stat block in backend

**Files:**
- Modify: `backend/src/interfaces.ts:2-19` (`ISetChampion.stats`)
- Modify: `backend/src/services/_internal/CDragonTransformer.ts:18-45` (`transformChampion`)
- Modify: `backend/src/models/Champion.ts:8-31` (stats schema)
- Test: `backend/src/services/_internal/CDragonTransformer.test.ts` (create)

**Interfaces:**
- Produces: `ISetChampion.stats: IChampionStats` where
  `interface IChampionStats { hp: number; mana: number; damage: number; armor: number; magicResist: number; attackSpeed: number; range: number; initialMana: number; critChance: number; critMultiplier: number }` (export `IChampionStats` from `interfaces.ts` — Plan 3 imports this shape).
- Consumes: `RawCDragonChampion.stats` (already typed with all fields in `CDragonService.ts`).

- [ ] **Step 1: Write the failing test**

```ts
// backend/src/services/_internal/CDragonTransformer.test.ts
import { describe, it, expect } from 'vitest';
import { CDragonTransformer } from './CDragonTransformer';

const raw = {
  apiName: 'TFT17_Gragas', name: 'Gragas', cost: 1, traits: ['Bruiser'],
  stats: { hp: 650, mana: 30, initialMana: 0, damage: 60, attackSpeed: 0.65,
           range: 1, armor: 40, magicResist: 40, critChance: 0.25, critMultiplier: 1.4 },
  ability: { name: 'Test', variables: [] },
} as any;

describe('CDragonTransformer.transformChampion', () => {
  it('maps the full stat block', () => {
    const out = CDragonTransformer.transformChampion(raw, 'https://cdn');
    expect(out.stats).toEqual({
      hp: 650, mana: 30, damage: 60, armor: 40, magicResist: 40,
      attackSpeed: 0.65, range: 1, initialMana: 0, critChance: 0.25, critMultiplier: 1.4,
    });
  });

  it('falls back to defaults when stats are missing', () => {
    const out = CDragonTransformer.transformChampion({ ...raw, stats: undefined } as any, 'https://cdn');
    expect(out.stats).toEqual({
      hp: 600, mana: 40, damage: 50, armor: 40, magicResist: 40,
      attackSpeed: 0.55, range: 1, initialMana: 0, critChance: 0.25, critMultiplier: 1.4,
    });
  });

  it('falls back per-field when a stat is missing', () => {
    const out = CDragonTransformer.transformChampion(
      { ...raw, stats: { hp: 700, mana: 10, damage: 55 } as any }, 'https://cdn');
    expect(out.stats.armor).toBe(40);
    expect(out.stats.attackSpeed).toBe(0.55);
    expect(out.stats.hp).toBe(700);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- CDragonTransformer`
Expected: FAIL — `stats` lacks the new fields / undefined.

- [ ] **Step 3: Implement**

Extend `IChampionStats` in `interfaces.ts` and `transformChampion` to map each field with `raw.stats?.field ?? <default>` using the defaults in Global Constraints. Extend the Mongoose `stats` subschema in `Champion.ts` with the seven new `Number` fields (give each a Mongoose `default` matching the fallbacks so legacy docs read sensibly).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- CDragonTransformer`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/interfaces.ts backend/src/services/_internal/CDragonTransformer.ts backend/src/models/Champion.ts backend/src/services/_internal/CDragonTransformer.test.ts
git commit -m "feat(data): persist full champion stat block from cdragon"
```

---

### Task 2: Numeric trait breakpoints + item effects/components

**Files:**
- Modify: `backend/src/interfaces.ts:21-41` (`ITrait`, `IItem`)
- Modify: `backend/src/services/_internal/CDragonTransformer.ts:47-85` (`transformTrait`, `transformItem`)
- Modify: `backend/src/models/Trait.ts`, `backend/src/models/Item.ts`
- Test: `backend/src/services/_internal/CDragonTransformer.test.ts` (extend)

**Interfaces:**
- Produces (Plan 3 consumes both):
  - `ITrait.breakpoints: Array<{ count: number; bonus: string; variables: Array<{ name: string; value: number }> }>`
  - `IItem.effects: Array<{ name: string; value: number }>`; `IItem.components` populated from cdragon `composition`; `IItem.trait` from `associatedTraits[0] ?? null`; `IItem.unique` from `raw.unique ?? false`.

- [ ] **Step 1: Write the failing tests**

Append to `CDragonTransformer.test.ts`:

```ts
const traitRaw = {
  apiName: 'TFT17_ASTrait', name: 'Challenger', desc: 'gains AS',
  effects: [
    { minUnits: 2, maxUnits: 2, variables: { AttackSpeedPercent: 0.15, DamageReduction: null, '{1543aa48}': 0.1 } },
    { minUnits: 4, maxUnits: 4, variables: { AttackSpeedPercent: 0.42 } },
  ],
} as any;

const itemRaw = {
  apiName: 'TFT17_Item_Sample', name: 'Sample', description: 'd',
  composition: ['TFT17_Item_BFSword'], unique: true, associatedTraits: ['TFT17_Challenger'],
  effects: { AD: 0.2, '{abb9f4ce}': 25 },
} as any;

describe('CDragonTransformer.transformTrait', () => {
  it('maps numeric variables per breakpoint, dropping hash keys and nulls', () => {
    const t = CDragonTransformer.transformTrait(traitRaw);
    expect(t.breakpoints[0].variables).toEqual([{ name: 'AttackSpeedPercent', value: 0.15 }]);
    expect(t.breakpoints[1].variables).toEqual([{ name: 'AttackSpeedPercent', value: 0.42 }]);
  });
  it('keeps the bonus display string', () => {
    const t = CDragonTransformer.transformTrait(traitRaw);
    expect(t.breakpoints[0].bonus).toContain('AttackSpeedPercent: 0.15');
  });
});

describe('CDragonTransformer.transformItem', () => {
  it('maps components, unique, trait, and numeric effects', () => {
    const i = CDragonTransformer.transformItem(itemRaw, 'https://cdn');
    expect(i.components).toEqual(['TFT17_Item_BFSword']);
    expect(i.unique).toBe(true);
    expect(i.trait).toBe('TFT17_Challenger');
    expect(i.effects).toEqual([{ name: 'AD', value: 0.2 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- CDragonTransformer`
Expected: FAIL — `variables`/`effects` undefined.

- [ ] **Step 3: Implement**

- `transformTrait`: keep existing `bonus` string via `formatVariables`; add `variables` by `Object.entries(e.variables).filter(([k, v]) => !/\{.*\}/.test(k) && v !== null).map(([k, v]) => ({ name: k, value: Number(v) }))`.
- `transformItem`: map `components: raw.composition ?? []`, `unique: raw.unique ?? false`, `trait: raw.associatedTraits?.[0] ?? null`, `effects` with the same hash/null filter.
- Extend `ITrait`/`IItem` in `interfaces.ts`; extend `Trait.ts`/`Item.ts` schemas (`variables: [{ name: String, value: Number }]`, `effects: [{ name: String, value: Number }]`, `components` already exists — stop hardcoding `[]`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- CDragonTransformer`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/interfaces.ts backend/src/services/_internal/CDragonTransformer.ts backend/src/models/Trait.ts backend/src/models/Item.ts backend/src/services/_internal/CDragonTransformer.test.ts
git commit -m "feat(data): numeric trait breakpoints, item effects and components"
```

---

### Task 3: GraphQL surface extension

**Files:**
- Modify: `backend/src/schema.ts:18-22` (`ChampionStats`), `:41-44` (`TraitBreakpoint`), `:46-54` (`Item`)
- Create: `backend/src/schema.test.ts`

**Interfaces:**
- Produces (GraphQL): `ChampionStats { hp: Int! mana: Int! damage: Int! armor: Int! magicResist: Int! attackSpeed: Float! range: Int! initialMana: Int! critChance: Float! critMultiplier: Float! }`; `TraitVariable { name: String! value: Float! }`; `TraitBreakpoint { count: Int! bonus: String! variables: [TraitVariable!]! }`; `ItemEffect { name: String! value: Float! }`; `Item` gains `effects: [ItemEffect!]!`.
- Consumes: Mongoose documents from Tasks 1–2 (resolvers pass documents through — verify no resolver projects a narrowed stats shape; if one does, extend it).

- [ ] **Step 1: Write the failing test**

```ts
// backend/src/schema.test.ts
import { describe, it, expect } from 'vitest';
import { buildSchema } from 'graphql';
import { typeDefs } from './schema';

describe('schema', () => {
  it('parses and exposes extended fields', () => {
    const schema = buildSchema(typeDefs.loc?.source.body ?? typeDefs);
    const statsFields = schema.getQueryType()!.getFields();
    void statsFields;
    const champ = schema.getType('ChampionStats')!.toConfig() as any;
    expect(Object.keys(champ.fields)).toContain('armor');
    expect(Object.keys(champ.fields)).toContain('attackSpeed');
    const bp = schema.getType('TraitBreakpoint')!.toConfig() as any;
    expect(Object.keys(bp.fields)).toContain('variables');
    const item = schema.getType('Item')!.toConfig() as any;
    expect(Object.keys(item.fields)).toContain('effects');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- schema.test`
Expected: FAIL — fields missing.

- [ ] **Step 3: Implement** the typeDefs changes exactly as in Interfaces. Check `resolvers.ts` for any explicit stat projection and widen it if present.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS (full backend suite — catches resolver drift).

- [ ] **Step 5: Commit**

```bash
git add backend/src/schema.ts backend/src/schema.test.ts backend/src/resolvers.ts
git commit -m "feat(api): expose full stats, numeric trait variables, item effects"
```

---

### Task 4: Local cdragon re-import script

**Files:**
- Create: `backend/src/scripts/reimport-cdragon.ts`
- Create: `backend/src/scripts/reimport-cdragon.test.ts`
- Modify: `backend/package.json` scripts — add `"reimport": "ts-node src/scripts/reimport-cdragon.ts"`

**Interfaces:**
- Produces: CLI `npm run reimport -- [--file <path>] <setId...>` (default file `data/cdragon_en_us.json`, resolved from repo root). Core function exported for tests:
  `export function selectAndTransform(raw: TftRawData, setId: number, cdnBase: string): { setName: string; champions: ISetChampion[]; traits: ITrait[]; items: IItem[] }`
- Consumes: `CDragonTransformer.transformSet` (Task 1–2 output). `raw.setData` is an **array** of set entries, each with `name` (e.g. `"Set17"`) — select entries whose `name === \`Set${setId}\``, then rely on the existing `TFT{setId}_` apiName filter.

- [ ] **Step 1: Write the failing test**

```ts
// backend/src/scripts/reimport-cdragon.test.ts
import { describe, it, expect } from 'vitest';
import { parseJsonWithBom, selectAndTransform } from './reimport-cdragon';

const fixture = JSON.stringify({
  setData: [{ name: 'Set17', champions: [{ apiName: 'TFT17_Gragas', name: 'Gragas', cost: 1,
    traits: ['Bruiser'], stats: { hp: 650, mana: 30, initialMana: 0, damage: 60,
    attackSpeed: 0.65, range: 1, armor: 40, magicResist: 40, critChance: 0.25, critMultiplier: 1.4 },
    ability: { name: 'T', variables: [] } }], traits: [], items: [], augments: [] }],
  items: [], sets: [],
});

describe('reimport-cdragon', () => {
  it('parses JSON with a UTF-8 BOM', () => {
    const raw = parseJsonWithBom('\uFEFF' + fixture);
    expect(raw.setData).toHaveLength(1);
  });
  it('selects the requested set and transforms full stats', () => {
    const out = selectAndTransform(parseJsonWithBom(fixture), 17, 'https://cdn');
    expect(out.champions).toHaveLength(1);
    expect(out.champions[0].stats.armor).toBe(40);
    expect(out.champions[0].stats.attackSpeed).toBeCloseTo(0.65);
  });
  it('returns empty champions for an unknown set', () => {
    const out = selectAndTransform(parseJsonWithBom(fixture), 99, 'https://cdn');
    expect(out.champions).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- reimport-cdragon`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

- `parseJsonWithBom(text: string): TftRawData` — strip a leading `\uFEFF` then `JSON.parse`.
- `selectAndTransform` — filter `raw.setData` entries by name, call `CDragonTransformer.transformSet` on each match and merge (dedupe by `id`/`key`, first wins, matching `transformSet`'s internal `seen*` maps).
- Script entry: read file (default `data/cdragon_en_us.json`), for each CLI set id call `selectAndTransform`, then upsert via `ChampionModel.updateOne({ id }, { $set: { ...champ } }, { upsert: true })` (same pattern for `TraitModel` by `key`, `ItemModel` by `id`), log counts per collection, `process.exit(0)` on success.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- reimport-cdragon`
Expected: PASS.

- [ ] **Step 5: Re-import real data (manual verification against MongoDB)**

Run: `cd backend && npm run reimport -- 16 17 18`
Expected: log lines with per-set champion/trait/item counts > 0 and no thrown errors. Spot-check one champion in the DB has `stats.armor` set.

- [ ] **Step 6: Commit**

```bash
git add backend/src/scripts/reimport-cdragon.ts backend/src/scripts/reimport-cdragon.test.ts backend/package.json
git commit -m "feat(scripts): local cdragon re-import with full numeric data"
```

---

### Task 5: Frontend types, queries, and trait engine numerics

**Files:**
- Modify: `frontend/src/lib/api.ts:485-538` (`ChampionStats`, `TraitBreakpoint`, `Item`) and the `stats {…}` / `breakpoints {…}` selections in `GET_CHAMPIONS`, `GET_CHAMPIONS_BY_SET`, `GET_CHAMPION`, `GET_SETS`, `GET_SET`, `GET_ACTIVE_SET`, `GET_TRAITS`, `GET_TRAIT`, `SEARCH_ENTITIES`
- Modify: `frontend/src/lib/graphql.ts` (same additions in `GET_ACTIVE_SET`)
- Modify: `frontend/src/lib/traitEngine.ts`
- Test: `frontend/src/lib/traitEngine.test.ts` (extend)

**Interfaces:**
- Produces:
  ```ts
  export interface ChampionStats { hp: number; mana: number; damage: number;
    armor?: number; magicResist?: number; attackSpeed?: number; range?: number;
    initialMana?: number; critChance?: number; critMultiplier?: number; }
  export interface TraitVariable { name: string; value: number }
  export interface TraitBreakpoint { count: number; bonus: string; variables?: TraitVariable[] }
  export interface ItemEffect { name: string; value: number }
  export function formatBreakpointBonus(bp: TraitBreakpoint): string
  ```
  `formatBreakpointBonus` — if `variables` non-empty: `name: value` joined by `, `, where `0 < value <= 1` renders as `${Math.round(value * 100)}%` and otherwise the raw number; else falls back to `bp.bonus`.
- Consumes: backend GraphQL from Task 3. New fields are optional in TS so old cached/server shapes still type-check.

- [ ] **Step 1: Write the failing tests**

Append to `frontend/src/lib/traitEngine.test.ts`:

```ts
describe('formatBreakpointBonus', () => {
  it('formats numeric variables with percent scaling', () => {
    expect(formatBreakpointBonus({ count: 2, bonus: '',
      variables: [{ name: 'AttackSpeedPercent', value: 0.15 }] }))
      .toBe('AttackSpeedPercent: 15%');
  });
  it('keeps values above 1 as raw numbers', () => {
    expect(formatBreakpointBonus({ count: 4, bonus: '',
      variables: [{ name: 'AP', value: 20 }] })).toBe('AP: 20');
  });
  it('falls back to the bonus string without variables', () => {
    expect(formatBreakpointBonus({ count: 2, bonus: '+20 AP' })).toBe('+20 AP');
  });
});
```

Also add: `calculateTraitStates` forwards `variables` onto returned `activeBreakpoints` entries (assert on a fixture board).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- traitEngine`
Expected: FAIL — `formatBreakpointBonus` not exported.

- [ ] **Step 3: Implement**

Types + `formatBreakpointBonus` in `traitEngine.ts`; thread `variables` through `calculateTraitStates` (it already passes `breakpoints` through — only the type widens). Add the new fields to every GraphQL `stats {…}` and `breakpoints {…}` selection listed above.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test`
Expected: PASS (full frontend suite).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/lib/graphql.ts frontend/src/lib/traitEngine.ts frontend/src/lib/traitEngine.test.ts
git commit -m "feat(tracker): numeric breakpoints and full stats in frontend types"
```

---

### Task 6: Trait tracker displays numeric bonuses

**Files:**
- Modify: `frontend/src/components/SynergyPanel.tsx` (bonus rendering)
- Modify: `frontend/src/pages/TraitTrackerPage.tsx` (active-bonus list rendering, if it renders `bonus` directly)
- Test: `frontend/src/components/SynergyPanel.test.tsx` (extend or create)

**Interfaces:**
- Consumes: `formatBreakpointBonus` (Task 5), `TraitState` from `traitEngine.ts` as currently consumed via `useSynergy`.

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/src/components/SynergyPanel.test.tsx
render(<SynergyPanel traitStates={[{
  traitKey: 'TFT17_ASTrait', name: 'Challenger', currentCount: 2, isActive: true,
  activeBreakpoints: [{ count: 2, bonus: '', variables: [{ name: 'AttackSpeedPercent', value: 0.15 }] }],
  nextBreakpoint: null, unitsContributing: [],
} as any]} /> as any /* match existing provider wrapper in src/test/utils.tsx */);
expect(screen.getByText(/AttackSpeedPercent: 15%/)).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- SynergyPanel`
Expected: FAIL — no numeric text rendered.

- [ ] **Step 3: Implement** — replace any direct `bp.bonus` interpolation with `formatBreakpointBonus(bp)`; same substitution in `TraitTrackerPage` where it renders bonuses directly.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SynergyPanel.tsx frontend/src/components/SynergyPanel.test.tsx frontend/src/pages/TraitTrackerPage.tsx
git commit -m "feat(tracker): render numeric trait bonuses"
```
