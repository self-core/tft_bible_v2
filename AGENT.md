# AGENT.md — TFT Bible v2

> The single operating guide for AI agents and humans working in this repo.
> Read this before making changes, and read `CONTEXT.md` for domain language.
> (Consolidated from the former `docs/AGENTS.md` on 2026-11-16 — do not
> recreate that file; update this one instead.)

## What This Project Is

A Teamfight Tactics companion web app: browse champions/traits/items/augments
per game set, build and save compositions on a hex board, track trait
synergies. In progress: real numeric trait breakpoints, builder reliability
fixes, and a sandbox combat simulator ("who wins this board vs. that board?").

## Monorepo Layout

| Path | What it is |
|------|-----------|
| `backend/` | Node.js + TypeScript, Apollo Server (GraphQL) + Express, MongoDB via Mongoose. Serves `/graphql` on port 4000. |
| `frontend/` | Vite + React + TypeScript SPA. Apollo Client for data, Zustand for domain state, Context for UI state/theme. Tailwind CSS. |
| `agent/` | AI Release Manager (GitHub App webhook agent; LLM provider adapters for OpenAI/Claude/Ollama). |
| `tools/pbe-ingest/` | PBE pak pipeline: `extractor/` (C# + CUE4Parse 1.2.2, net10.0) reads the installed game's `.utoc/.ucas/.pak` and writes inventory + JSON exports to `data/pbe_extracted/`; `watcher/watcher.py` (watchdog, PEP 723) debounces patch writes and triggers the extractor, then the PBE cdragon reimport. `mappings/` is where a `TFT.usmap`/`TFT.jmap` belongs (empty today). |
| `data/` | Raw source data. `cdragon_en_us.json` / `cdragon_pbe_en_us.json` are CommunityDragon dumps containing all sets with full numeric stats. `data/raw_tft_data/` holds dragontail files. `data/pbe_extracted/` is generated (manifest, exports, watcher state/log). |
| `docs/` | Design specs and ADRs (`docs/adr/`). |
| `scripts/` | Ops/utility scripts. |
| `../vault/` | Obsidian vault. Research/notes in `../vault/notes/`, design specs in `../vault/specs/` (read and write there). |

Deployment: single Docker container, targets Vercel/Railway
(`vercel.json`, `railway.config.yml`, `docker-compose*.yml`). The backend
container mounts a dragontail directory (currently
`dragontail-16.10.1` → `/app/dragontail-data`); keep the mount and
`PathResolver.ts` base paths in sync when bumping versions.

## Data Flow

Dragontail/cdragon JSON → backend import services (`SetDataService.ts`,
`ImportService.ts`, `_internal/` modules incl. `CDragonService.ts`,
`CDragonTransformer.ts`, `DataTransformer.ts`, `FileParser.ts`,
`PathResolver.ts`, `Repository.ts`, `EmbeddedFallback.ts`) → MongoDB models
(`backend/src/models/`) → GraphQL resolvers (`backend/src/resolvers.ts`,
schema in `backend/src/schema.ts`) → Apollo Client → Zustand stores
(`frontend/src/stores/`) → React components.

`SetDataService.getSetData()` resolves cache → DB → `ImportService.importSet()`
→ embedded fallback. `frontend/src/lib/imageProxy.ts` handles CDN image URLs.

**Data is document-per-set.** One Set document references its champions,
traits, items, augments. Champion IDs are set-prefixed (`TFT16_Ahri`,
`TFT17_*`, `TFT18_*`). New sets must not break old data.

## Critical Data Facts (read before touching stats/traits)

- **The DB is lossy.** Champions persist only `stats: {hp, mana, damage}`
  (`backend/src/models/Champion.ts`). The raw cdragon JSON has the full stat
  block: `armor, attackSpeed, critChance, critMultiplier, damage, hp,
  initialMana, magicResist, mana, range`. `CDragonService.ts` types it
  (`RawCDragonChampionStats`) — the transformer discards the rest.
- **Trait breakpoints in DB are display text.** cdragon traits carry numeric
  `effects: [{minUnits, maxUnits, style, variables}]` (variables keyed by
  template names, some `{hash}` placeholders resolved against the localized
  `sets` entry). `CDragonTransformer.ts` flattens these into
  `{count, bonus}` strings stored on `Trait.breakpoints`.
- **Composition units do persist placement** (`backend/src/models/Composition.ts`):
  `units[{championId, position:{row,col}, starLevel, items[]}]` alongside
  `championIds`. Old assumptions that only `championIds` exist are stale.
- **Ability variables ARE numeric per star level** (`values: number[]`,
  indexed by star). Usable for star-scaling in simulation today.
- **cdragon layout** (verified 2026-11-16): `sets[setNumber]` is the
  authoritative per-set roster (`champions` + `traits`) and its key *is* the
  set number. `setData` is keyed by an internal index, **not** the set
  number — match entries via `setData[k].number === setId`. `setData` holds
  that set's `items` (objects) and `augments` (ID strings only). The
  top-level `items` array (~4.4k) holds all item objects with numeric
  `effects` and `composition` component lists. Items/augments have no
  descriptions outside `setData`; augment names/descriptions come from
  dragontail `tft-augments.json` when the patch matches, otherwise show
  "Unavailable".
- **Set membership must come from `sets[setId]`, not apiName prefixes.**
  New-set champions are not consistently `TFT{setId}_`-prefixed (Set 18 has
  ~14 non-prefixed entries, e.g. `TFT_BlueGolem`). `CDragonTransformer.transformSet`
  currently filters by prefix and silently drops those — fix before Set 19.
- **Trait `variables` keys are often localization hashes** (`{0f90e7a4}`)
  with no in-file name mapping, so dropping hash keys discards real numeric
  data. Persist hash-keyed values (internal, never displayed) and named
  values separately.
- **Sets present in local dumps** (stale snapshots): live dump sets 1–17,
  PBE dump sets 1–18 (18 partially populated; `sets[18].name` is a
  placeholder like "Set10"). Tuesday's Set 19 must be fetched fresh from
  the PBE CDN (`CDRAGON_ENDPOINT=pbe`), not the local JSON.
- **PBE Paks are not a complete data source.** The install
  (`D:\Riot Games\Teamfight Tactics\PBE\TFT\Content\Paks`, UE 5.7.4,
  `Shipping.rls-18.7.0`) mounts fine without an AES key, but TFT packages
  carry `PKG_UnversionedProperties`: cooked property names are stripped and
  live in a `.usmap`/`.jmap` that Riot does not ship (verified: no mapping
  file anywhere in the install). CUE4Parse therefore yields the full asset
  inventory and decodes `UStringTable`s, but `UDataTable.RowMap` is null —
  DataTable rows stay unreadable until real mappings are supplied via
  `--mappings` / `TFT_PBE_MAPPINGS` / `tools/pbe-ingest/mappings/`. Do not
  inject into the Riot client to harvest mappings. Treat cdragon PBE as the
  authoritative stat source; Paks are for patch detection and asset names.
- Local cdragon files have a **UTF-8 BOM** — strip it when parsing.
- `EmbeddedFallback.ts` already has a hand-curated Set 18 fallback plus
  `_internal/Set18.test.ts`; keep those in sync with real PBE data.

## Frontend Map

- `src/components/Layout.tsx` — shell + navbar. Navbar tiers: labels at
  `xl`, icon rail (`aria-label`/`title`) at `lg`, hamburger sheet below `lg`.
  Set links are not top-level: `SetsMenu` (Book trigger) holds Sets &
  Patches plus live/archived sets with status dots, PBE tag and active-set
  highlight; closes on outside pointerdown, Escape, and route change.
- `src/components/TFTBoard.tsx` — the one hex board (SVG, 4×7, flat-top
  hexes, `HEX_SIZE = 38`, odd rows offset). `editMode` toggles editing.
  DnD is the pointer-events layer in `src/components/dnd/`
  (`DndProvider` + `useDragSource`/`useDropTarget`, injectable `hitTest`,
  ghost preview, full-hex drop targets, hover highlight, touch support).
  Bench is `row: -1, col: 0..8`; overflow past 28 grid slots auto-places on
  the bench instead of being dropped. Palette drops preserve champion
  traits; occupied cells swap (or bump the occupant to the bench for a
  palette drop). `onUnitClick` opens `UnitConfigPopover` (stars + 3 item
  slots). `ImproveTeamBuilder` shows `BuilderTraitPanel` beside the board.
  `react-dnd` was removed from `package.json`.
- `src/lib/traitEngine.ts` — trait counting + breakpoint lookup
  (`calculateTraitStates`, `getSynergyScore`, `predictBreakpoints`).
- `src/lib/synergyEngine.ts` — builder recommendation scoring
  (`scoreCandidate`, `greedyFill`) via `hooks/useSynergy.ts` →
  `components/SynergyPanel.tsx`.
- `src/lib/api.ts` — GraphQL documents + TS types + api wrapper.
- `src/pages/` — Home, Compositions, CompositionDetail, Champions,
  DetailedChampions, Items, DetailedItems, Traits, Augments,
  ImprovedTeamBuilder (`/builder`), TraitTrackerPage (`/trait-tracker`),
  SandboxPage (`/sandbox`), SetDetail (`/sets/:setId`), SetPatchInfoPage
  (`/sets-info`), PatchNotes, RiotProfile.
- `src/stores/` — Zustand stores (champions, traits, items, augments,
  compositions). `compositionsStore` auto-assigns missing board positions by
  cost tier and dedups `currentCompositionId` on comp switches — preserve
  both behaviors.
- `src/pages/CompositionBuilder.tsx` is a stub with mock data —
  `ImprovedTeamBuilder` is the real builder page.

## Backend Map

- `src/models/` — Mongoose models: Champion, Trait, Item, Set, Composition,
  MetaComposition.
- `src/services/` — `RiotApiClient.ts`, `ImportService.ts`, `SetDataService.ts`,
  `CompositionService.ts`, `MetaService.ts`, plus `_internal/`
  (`CDragonService`, `CDragonTransformer`, `DataTransformer`, `FileParser`,
  `PathResolver`, `Repository`, `EmbeddedFallback`, `ResultCache`,
  `MatchFetcher`, `RateLimiter`, `CompAnalyzer`, `container.ts`).
  `MatchFetcher` + `MetaService` already pull Riot match data — reuse for
  simulator calibration/validation rather than building new ingestion.
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
`*.test.ts`. DB-backed tests skip when MongoDB is unreachable; with the
Docker Mongo up it requires auth, so run:
`MONGO_URI='mongodb://admin:password@localhost:27017/tft_bible_test?authSource=admin' npm test`.
Start the dev DB with `docker compose up -d mongo` (root creds in
`docker-compose.yml`). Reimports (`npm run reimport ...`) load
`backend/.env`, so `MONGODB_URI` is picked up automatically.

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
  Auto-assignment of missing positions happens in the store layer.
- One TFTBoard component with `editMode` — no board variants.
- Trait counting has one implementation (`resolveTraitStates` in
  `frontend/src/lib/traitEngine.ts`): tracker, builder panel and combat
  engine all call it. Never re-implement per-surface trait counting.
- The combat engine is pure TypeScript under `frontend/src/engine/`, with no
  React or backend dependency; inputs are validated board states and RNG is
  seeded. It reports a `CoverageReport` rather than silently guessing
  unmodeled abilities/items/augments.
- cdragon trait `effects` without a numeric `minUnits` are not breakpoints;
  ingestion and the repository both drop them (legacy DB rows stored these
  with `count: null`, which crashed GraphQL queries).
- Ability variables with null values are normalized to empty arrays at
  ingestion and at the repository boundary (some cdragon entries omit them).
- Client markup never reaches the app: `sanitizeDescription`/`sanitizeName`
  in `CDragonTransformer` strip `<row>`/`<expandRow>` blocks, tags,
  `@…@`/`%i:…%`/`{{…}}` tokens from trait, item and augment text (names
  included — cdragon quest/offer rows put sentences and `@Tier@` there).
  Rows imported before this existed are repaired with `npm run sanitize`.
- Item/augment documents are shared across sets (the same ID appears in
  several set item lists) and Apollo normalizes them into one client entity,
  so stale raw text in *any* set payload overwrites a clean copy. Repair and
  cache flush must cover every set, not just the newest.
- cdragon art paths lie: `tileIcon` is the square portrait, `squareIcon` is
  the splash tile; hosted files are lowercased `.png` under
  `.../global/default/assets/...` (no `/v1/`). Filename variants differ per
  set — Set 17 files 404 if `.tft_set17` is kept, Set 18 files only exist
  with `.tft_set18` appended. `cdragonAssetUrl` strips
  `.TFT_SetN[_PostlaunchAugments]`/`.tft_N_N`; `npm run repair-images` (also
  run at the end of `npm run reimport`) probes exact/stripped/suffixed forms
  on latest + pbe for champions, traits, items and embedded set augments.
  Resolve asset maps from the live cdragon JSON — `data/cdragon_*` snapshots
  can predate the current roster. Unresolvable links are cleared so the UI
  falls back to initials instead of a broken image. Augment metadata
  (`setData.augments` ids) comes from the matching top-level `items` entry.
- Domain state in Zustand; UI state (theme) in React Context.
- `Set.status` is lowercase everywhere in the app; the GraphQL enum is
  uppercase, so `lib/apolloClient.ts` normalizes it in one link. Never
  compare against raw response casing.
- Theme selection initializes from `localStorage` synchronously (lazy
  `useState`), not in an effect — an effect-load races the save-effect under
  StrictMode and silently resets to dark.
- Page content (`main`) uses `overflow-wrap: anywhere` so unbroken data keys
  cannot widen grids and create horizontal page scroll.
- Navigation: sets are never top-level nav links; they live in the Sets
  dropdown (`SetsMenu`). Navbar tiers: labels ≥`xl`, icon rail ≥`lg`,
  hamburger below.
- Document-per-set storage with set-prefixed IDs.
- No new state libraries.

## Current Backlog (as of Nov 2026)

Canonical planning docs (keep them in sync; they predate implementation):

- Sandbox design + accuracy policy:
  `docs/superpowers/specs/2026-11-16-sandbox-combat-simulator-design.md`
- Data pipeline + trait tracker plan:
  `docs/superpowers/plans/2026-11-16-data-pipeline-trait-tracker.md`
- Builder DnD + bench plan:
  `docs/superpowers/plans/2026-11-16-builder-dnd-fixes.md`

1. **New-set readiness (urgent — PBE lands Tuesday ~afternoon PST)** — Set 19
   ingestion must import cleanly: full stats, traits with numeric effects,
   items, augments. Fix set selection in `CDragonTransformer` (see data
   facts) and import from the live PBE CDN, not the local snapshot.
2. **Trait tracker/engine** — needs real numeric breakpoints (currently
   text-only in DB and `traitEngine.ts` reads display strings).
3. **Composition builder fixes** — pointer-events DnD, bench/overflow,
   item assignment, and trait panel are **done** (2026-11-16). Asset/image
   loading across the app is **done** (2026-11-16): every page now resolves
   art from live cdragon (see the asset-resolution decision). Remaining: any
   UI refinements.
4. **Sandbox combat simulator** — v1 shipped (2026-11-16): pure-TS engine in
   `frontend/src/engine/` (`simulate` / `predict`), `/sandbox` dual-board UI
   with items, stars, augments, levels, 128-seed prediction, event-log
   playback with scrubber/speed, and a mechanics-coverage badge. Remaining:
   calibration corpus (95% is a measured goal, not a launch guarantee),
   scenario save/share, trivia mode (v2).

## Session History (context, not instructions)

- 2026-11-16: **Home trending-champion card redesign**. Cards now lead with a
  full-bleed `aspect-square` portrait (hover zoom, initials fallback) and a
  2px cost-colored border instead of cost dominating the card; cost shows as
  a small corner chip. Responsive 2→5 column grid, AD/HP chips, ability line
  and trait pills below. Non-playable rows (Tome of Traits, PVE units) are
  filtered out of the trending grid, and "View All" links no longer wrap on
  mobile. Playwright: 63 images, 0 broken.
- 2026-11-16: **app-wide image fix + TFT-Academy-style set page**. Images
  were 404ing everywhere because stored URLs used the wrong cdragon field,
  a `/v1/` prefix and stale suffixes. Ingestion now maps `tileIcon` → square
  portrait, `squareIcon` → splash, strips patch suffixes (`.TFT_SetN`,
  `_PostlaunchAugments`, `.tft_N_N`), and enriches augments from the
  top-level `items` array (names, descriptions, icons). `repair-images`
  rewritten: live cdragon JSON maps, `.tft_setN` filename variants, set
  membership for `DA_18_*` ids, item and embedded-augment repair, and
  clearing dead links. Results: Set 18 91 champ ids / 36 traits / 594
  augments resolved; all sets' items repaired (412 URLs) and 1,201 embedded
  augment icons/names/descriptions fixed; 3 unplayable PVE rows cleared.
  Frontend: `SetDetail` rebuilt like TFT Academy (cost-tinted sections,
  portraits, `initial / max mana`, trait icon rows, playable-unit filtering,
  single title), trait icons on `/traits`, `imageUrl` selected in both
  `graphql.ts` and `api.ts` queries, `ChampionImage` fallback in the trait
  tracker. Playwright check: `/`, `/sets/18`, `/traits`, `/champions`,
  `/builder`, `/trait-tracker` all render 0 broken images (Set 18 alone
  loads 1,637); `/items` has 8 legacy art misses (hidden by onError).
  Backend 114/116 (2 pre-existing DB-unique flaky tests), frontend 143/143,
  build clean. The user's long-running backend on :4000 must be restarted to
  serve `Trait.imageUrl` and drop cached set data.

- 2026-11-16: **ingestion text sanitization**. Raw client markup
  (`@TFTUnitProperty…`, `<br>`, `<tftitemrules>`, `%i:…%`, `{{…}}`,
  `@Tier@`) leaked into trait/item/augment descriptions and — for cdragon
  quest/offer rows — into **names** (`@Tier@-Cost Shop`, quest sentences).
  Added `sanitizeDescription` and `sanitizeName` in `CDragonTransformer`
  (applied to every trait/item/augment field at ingestion; 23 tests in that
  file) plus an idempotent repair script, `npm run sanitize [-- --dry-run]`.
  It fixed 80 trait descriptions, 402 item descriptions, 151 item names and
  1 trait name across stored sets; Set 17 was reimported and every set's
  `ResultCache` was flushed via `setSetStatus`. API and DOM now show zero
  markers on `/sets/16`, `/sets/17`, `/sets/18`, `/items`, `/traits` and
  `/augments`. The stubborn UI leak root cause: item docs are shared across
  sets and Apollo normalizes by ID, so Set 16/18 payloads kept overwriting
  cleaned Set 17 entities in the client cache. Backend 112/113 (known
  pre-existing Composition unique-id failure), frontend 143/143, build
  clean.
- 2026-11-16: **navbar restructure + theme/responsive pass**. All set links
  (plus Sets & Patches) now live in one accessible `SetsMenu` dropdown in
  `Layout.tsx` (outside-click, Escape with focus restore, closes on route
  change; groups live vs archived, PBE tag for `upcoming`, active set
  highlighted). Navbar has three tiers: full labels at `xl`, icon rail with
  `title`/`aria-label` at `lg`, hamburger sheet below `lg`; the dead search
  box was removed. Fixed a casing mismatch: the GraphQL schema returns
  `Set.status` as an uppercase enum (`ACTIVE`/`UPCOMING`/`ARCHIVED`) while
  the app contract is lowercase — normalized once in
  `lib/apolloClient.ts` (`normalizeSetStatus` link) so store, Layout,
  SetDetail and SetPatchInfoPage agree. Theme init was racy under
  StrictMode (apply-effect overwrote storage before load-effect committed,
  resetting to dark on reload) — state now initializes lazily from
  `localStorage` (`readStoredTheme`). Added `main { overflow-wrap: anywhere }`
  because raw data keys (`@TFTUnitProperty.trait:…`) were widening cards
  and causing page-level horizontal scroll on Traits/Items/SetDetail.
  Verified with Playwright at 1440/1024/390: 41 checks (dropdown behaviour,
  nav tiers, no horizontal overflow on all routes) plus light/pastel/sunset
  screenshots. Frontend 143/143, build clean. (Set 17's raw
  `@TFTUnitProperty…` strings at the time were an ingestion artifact, fixed
  the same day — see the sanitization entry above.)
- 2026-11-16: sandbox **arena presentation** shipped. `TFTBoard` takes
  `presentation="arena"` (sandbox only; builder keeps the flat SVG):
  perspective scene + `rotateX(46deg)` hex plane, standing unit cards that
  counter-rotate to face the camera, tier glow/shadow, stars above, and a
  gear chip with real item icons under the front hex. Same `data-drop-id`
  targets, so pointer-events DnD is unchanged. Root-caused the champion/item
  404s: cdragon raw assets live under `.../global/default/assets/...` (no
  `/v1`), keep no `.TFT_SetXX` suffix, and need lowercasing + `.png`
  (`cdragonAssetUrl`); item icons come from the item `icon`, champions from
  `squareIcon`. Set 17 was reimported; old-format paths (e.g.
  `TFT_BlueGolem_Mobile`) still 404 and fall back to a tier-tinted letter
  tile. Fixed the DnD click regression: a moved drag sets a 250 ms
  click-suppression window so the synthetic click after drop is ignored, but
  any new `pointerdown` clears it (clicking a freshly placed unit works).
  Tests: frontend 143/143 (new DnD suppression test, 2 arena board tests),
  backend services 98/98. If a dev server was started before the reimport it
  serves stale URLs — restart it.
- 2026-11-16: sandbox combat simulator v1 **shipped**. Engine
  (`frontend/src/engine/`): mirrored odd-r hex grid (blue rows 0–3, red
  4–7), 100 ms ticks, attack/mana timing, target lock + movement, armor/MR
  mitigation, crit via seeded RNG, star scaling, trait/item/augment stat
  modifiers, ability plans from cdragon variables, typed timeline,
  `simulate()` + `predict()` (128 seeds), and a coverage report. Sandbox
  page `/sandbox`: dual editable boards with palette DnD, per-unit
  stars/items, level caps, augments (unmodeled ones flagged), prediction
  bar, and fight playback with speed, scrubber and event log. `TFTBoard`
  gained `hideHeader` for embedded boards. Tests: 34 engine + 4 sandbox
  page; frontend 140/140, backend services 97/97. Also fixed GraphQL
  crashes from legacy traits with `count: null` (non-breakpoint cdragon
  effects) and null ability-variable values. Set 17 is currently the ACTIVE
  set in the dev DB, so the sandbox loads it with real ability data.
- 2026-11-16: PBE pak ingestion **shipped** against the real install at
  `D:\Riot Games\Teamfight Tactics\PBE`. C# extractor at
  `tools/pbe-ingest/extractor` (CUE4Parse 1.2.2.202611, `EGame.GAME_UE5_7`,
  local SDK at `tools/dotnet/dotnet.exe` — run it as
  `tools/dotnet/dotnet.exe tools/pbe-ingest/extractor/bin/Release/net10.0/extractor.dll`
  with `DOTNET_ROOT=<repo>/tools/dotnet`; the apphost `.exe` fails without a
  system-wide .NET 10 runtime). Verified: 573,237 files / 3 readers, 454 data
  tables (89 in set scope), 10 string tables, 5 exported (1–126 entries each),
  full manifest + `exports.json` in `data/pbe_extracted/`. Exit 0 = clean,
  2 = exported everything exportable but DataTables need mappings, 1 = error.
  Python watcher (`uv run tools/pbe-ingest/watcher/watcher.py`) fingerprints
  the containers, waits for `--settle-seconds` (default 60) of quiet after
  the Riot Client stops writing, rebuilds the extractor when sources are
  newer, runs it, then reimports the **newest set found in the Paks** from
  the PBE CDN via `npm run reimport -- --pbe <set>` in `backend/`
  (`--set-id` overrides, `--no-ingest` disables); state/log in
  `data/pbe_extracted/watcher_state.json` / `watcher.log`. Env:
  `TFT_PBE_PAKS_DIR`, `TFT_PBE_OUT_DIR`, `TFT_PBE_MAPPINGS`,
  `TFT_PBE_EXTRACTOR`. Verified: sandbox patch write triggers after the
  settle window; `--pbe 18 --dry-run` yields 91 champions / 36 traits / 776
  items / 594 augments; set 19 is currently a 0-champion placeholder on the
  CDN and is skipped with a warning.
- 2026-11-16: watcher hardened for launch day. If PBE cdragon has no
  champions for the inferred set yet (true for set 19 today: 0 champions,
  760 global items), reimport returns "not ready" (exit 3), the pipeline
  still succeeds, `pendingSet` is recorded in `watcher_state.json`, and the
  watch loop retries every `--retry-seconds` (default 300) until the CDN
  catches up. The local DB was seeded: sets 16 and 17 from live cdragon
  (123/83 champions), set 18 from PBE cdragon (91 champions, status
  `upcoming`). `reimport-cdragon.ts` now loads `backend/.env` and prints a
  one-line failure instead of dumping the Mongo topology; DB-backed model
  tests init indexes before duplicate-key assertions.
- 2026-11-16: mapping hunt closed — searched the install and GitHub, no TFT
  `.usmap`/`.jmap` exists publicly, and the only practical UE4SS route would
  require injecting into the Riot client (rejected). DataTable export is
  wired and activates automatically if mappings ever appear; until then
  Tuesday's Set 19 stats come from the PBE cdragon reimport, which the
  watcher triggers after each settled patch.
- 2026-11-16: builder Phase B shipped — pointer-events DnD with ghost /
  hover highlight / touch, full-hex drop targets, 9-slot bench
  (`row: -1`), overflow auto-placement, palette trait preservation,
  `UnitConfigPopover` (stars + 3 items), `BuilderTraitPanel`, and
  `e2e/builder-dnd.spec.ts`; `react-dnd` deps removed. Frontend suite 98
  tests; e2e runs Chromium with mocked GraphQL.
- 2026-11-16: consolidated `docs/AGENTS.md` into this file (single guide).
- 2026-11-16: full champion stat block, numeric trait variables
  (`variables` + engine-only `rawVariables` for hash keys), and item
  `effects`/`composition` are now ingested from cdragon and exposed via
  GraphQL; `backend/src/scripts/reimport-cdragon.ts`
  (`npm run reimport -- [--pbe] [--dry-run] <setId...>`) is the supported
  import path. Set selection uses `sets[setId]` rosters and
  `setData[k].number === setId`, so non-prefixed champions and new sets
  import correctly.
- Unified the board into one `TFTBoard.tsx` (SVG hex, read + edit modes);
  fixed champions stacking at `(0,0)` by auto-assigning positions by cost.
- Fixed comp switching by keying `currentCompositionId` and clearing stale
  `currentComposition`.
- Fixed dragontail parsing (nested `{type, version, data}` envelope) and
  champion portrait URLs (`tft/champion-portraits/{name}.png`, strip
  `_splash_centered_*.TFT_SetXX.png` suffixes).
- Split legacy `dragontailService.ts` into `SetDataService` + `ImportService`
  + `_internal/` modules.
- Known open issues: champion images may still fail on the comp board (CORS /
  SVG `<image>` / z-index), navbar alignment/spacing, frontend ESLint has no
  config file (pre-existing; `npm run lint` currently fails to start), and no
  `/builder/read/:id` route for viewing saved comps.

## Agent Hygiene

- Keep changes consistent with surrounding patterns; treat unfamiliar or
  modified files as possibly-human work before overwriting.
- Write design specs and research to `../vault/specs/` / `../vault/notes/`
  when asked; otherwise prefer code + tests over new markdown.
- Don't add new state libraries; Zustand + Context cover it.
- Update this file and `CONTEXT.md` when you change architecture or domain
  language. Never re-create `docs/AGENTS.md`.
