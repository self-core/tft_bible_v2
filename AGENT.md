# AGENT.md — TFT Bible v2

> Operating guide for AI agents (and humans) working in this repo. Read this
> before making changes. Also read `CONTEXT.md` for domain language.

## What This Project Is

A Teamfight Tactics companion web app: browse champions/traits/items/augments
per game set, build and save compositions on a hex board, track trait
synergies. A combat-simulation sandbox ("who wins this board vs. that
board?") is in planning.

## Monorepo Layout

| Path | What it is |
|------|-----------|
| `backend/` | Node.js + TypeScript, Apollo Server (GraphQL) + Express, MongoDB via Mongoose. Serves `/graphql`. |
| `frontend/` | Vite + React + TypeScript SPA. Apollo Client for data, Zustand for domain state, Context for UI state/theme. Tailwind CSS. |
| `agent/` | AI Release Manager (GitHub App webhook agent; LLM provider adapters for OpenAI/Claude/Ollama). |
| `data/` | Raw source data. `cdragon_en_us.json` / `cdragon_pbe_en_us.json` are CommunityDragon dumps containing **all sets** with full numeric stats. `data/raw_tft_data/` holds dragontail files. |
| `docs/` | Design specs and ADRs. |
| `scripts/` | Ops/utility scripts. |

Deployment: single Docker container, targets Vercel/Railway
(`vercel.json`, `railway.config.yml`, `docker-compose*.yml`).

## Data Flow

Dragontail/cdragon JSON → backend import services (`backend/src/services/ImportService.ts`,
`CDragonService.ts`, `CDragonTransformer.ts`, `DataTransformer.ts`) → MongoDB
(models in `backend/src/models/`) → GraphQL resolvers (`backend/src/resolvers.ts`,
schema in `backend/src/schema.ts`) → Apollo Client → Zustand stores
(`frontend/src/stores/`) → React components.

**Data is document-per-set.** One Set document references its champions,
traits, items, augments. Champion IDs are set-prefixed (`TFT16_Ahri`,
`TFT17_*`). New sets must not break old data.

## Critical Data Facts (read before touching stats/traits)

- **The DB is lossy.** Champions persist only `stats: {hp, mana, damage}`
  (`backend/src/models/Champion.ts`). The raw cdragon JSON has the full stat
  block: `armor, attackSpeed, critChance, critMultiplier, damage, hp,
  initialMana, magicResist, mana, range`. `CDragonService.ts` already types
  it (`RawCDragonChampionStats`) — the transformer discards the rest.
- **Trait breakpoints in DB are display text.** cdragon traits carry numeric
  `effects: [{minUnits, maxUnits, style, variables}]` (variables keyed by
  template names, some `{hash}` placeholders resolved against the localized
  `sets` entry in the same JSON). The transformer flattens these into a
  comma-joined string.
- **Ability variables ARE numeric per star level** (`values: number[]`,
  indexed by star). This is usable for star-scaling in simulation today.
- **`s.items` / `s.augments` inside each set entry are ID lists**; full item
  objects (with `effects`, `composition` component lists) live in the
  top-level `items` array of the cdragon JSON.
- Local cdragon files have a **UTF-8 BOM** — strip it when parsing.

## Frontend Map

- `src/components/TFTBoard.tsx` — the one hex board (SVG, 4×7, flat-top hexes,
  `HEX_SIZE = 38`, odd rows offset). `editMode` toggles editing. Drag-and-drop
  is **raw HTML5 DnD** (custom `dataTransfer` keys `text/champion-id`,
  `text/unit-id`). Known issues: drop target only the exposed hex sliver
  behind units, no touch support, no ghost/hover highlight, >28 units
  silently dropped, no bench integration. `react-dnd` is installed but
  **unused** (dead dep).
- `src/lib/traitEngine.ts` — trait counting + breakpoint lookup
  (`calculateTraitStates`, `getSynergyScore`, `predictBreakpoints`).
- `src/lib/synergyEngine.ts` — builder recommendation scoring
  (`scoreCandidate`, `greedyFill`) via `hooks/useSynergy.ts` →
  `components/SynergyPanel.tsx`.
- `src/lib/api.ts` — all GraphQL documents + TS types + api wrapper.
- `src/pages/` — Home, Compositions, CompositionDetail, Champions, DetailedChampions,
  Items, DetailedItems, Traits, Augments, ImprovedTeamBuilder (`/builder`),
  TraitTrackerPage (`/trait-tracker`), SetDetail (`/sets/:setId`), SetDetail info
  (`/sets-info`), PatchNotes, RiotProfile. **No simulator page exists yet.**
- `src/stores/` — Zustand stores (champions, traits, items, augments,
  compositions).

## Backend Map

- `src/models/` — Mongoose models: Champion, Trait, Item, Set, Composition,
  MetaComposition.
- `src/services/` — RiotApiClient, ImportService, CDragonService (+`_internal/`
  transformers, EmbeddedFallback local-data fallback when CDN is unreachable).
- `src/resolvers.ts`, `src/schema.ts` — GraphQL layer.
- `src/server.ts` — Apollo + Express bootstrap.

## Commands

Frontend (run from `frontend/`):

```
npm run dev          # Vite dev server with mock backend (vite.mock.config.ts)
npm run build        # production build
npm run test         # vitest (unit, jsdom)
npm run test:e2e     # Playwright (testDir: ./e2e)
npm run lint         # eslint, zero warnings allowed
```

Backend (run from `backend/`): standard tsc/jest; tests co-located as
`*.test.ts`. Requires MongoDB running.

## Testing Conventions

- Vitest + jsdom + `@testing-library/react`; MSW 2.x mocks GraphQL+REST
  (`src/test/msw/handlers.ts` holds the active-set fixture). Shared render
  helper in `src/test/utils.tsx`.
- E2E via Playwright, config includes desktop + mobile browser projects.
- Write tests alongside source (co-located `*.test.ts(x)`).

## Key Decisions (do not relitigate without discussion)

- GraphQL is the only frontend↔backend transport. Old REST microservice
  endpoints are dead code.
- Board positions are `(row, col)` grid coordinates, never pixel coords.
- One TFTBoard component with `editMode` — no board variants.
- Domain state in Zustand; UI state (theme) in React Context.
- Document-per-set storage with set-prefixed IDs.

## Current Backlog (as of Nov 2026)

1. **New-set readiness** — next set PBE data lands soon (Tuesday ~afternoon
   PST); ingestion must import it cleanly (full stats, traits with numeric
   effects, items, augments).
2. **Trait tracker/engine** — needs real numeric breakpoints (currently
   text-only).
3. **Composition builder fixes** — drag-and-drop reliability (drop coverage,
   touch, ghost preview), asset/image loading, UI polish, bench integration,
   overflow handling.
4. **Sandbox combat simulator** (new, ambitious) — place two boards
   (units/items/augments/level/positioning), predict win/loss. Target 95%+
   accuracy. Requires the full stat ingestion above plus a deterministic
   combat engine (attack/mana/ability loop, damage formulas, trait
   mechanics registry, star scaling, item/augment stat modifiers).

## Agent Hygiene

- Keep changes consistent with surrounding patterns; treat unfamiliar or
  modified files as possibly-human work before overwriting.
- `frontend/src/pages/CompositionBuilder.tsx` is a stub with mock data —
  `ImprovedTeamBuilder` is the real builder page.
- Don't add new state libraries; Zustand + Context cover it.
- Update this file and `CONTEXT.md` when you change architecture or domain
  language.
