# TFT Bible — Domain Context

## Project

A Teamfight Tactics (TFT) companion app. Browse champions, traits, items, and
augments per game set. Build and save team compositions on a hex board. Track
trait synergies.

## Domain Language

**Set** — A TFT season (e.g., Set 16 "Lore & Legends"). Each set has its own
roster of champions, traits, items, augments, and mechanics. The data model
is document-per-set: one Set document holds reference IDs to its child
entities.

**Champion** — A playable unit. Has a name, cost (1–5 gold), traits, stats
(HP, mana, damage), ability (name + star-level variables), and image URLs
from CommunityDragon CDN. Champion IDs are prefixed with the set number
(e.g., `TFT16_Ahri`).

**Trait** — A synergy group. Champions share traits; having enough champions
with the same trait on the board activates breakpoints (e.g., 2 Arcane → +20
AP, 4 Arcane → +50 AP).

**Item** — An equippable modifier. Has components (sub-items), an effect
description, and can be unique or bound to a trait.

**Augment** — A set-specific modifier chosen during a game. Changes how the
game plays. Shape varies per set (untyped `Mixed` in MongoDB).

**Composition** — A player-created team build: a title, description, set ID,
list of champion IDs and board positions, trait bonuses, and augment
recommendations. Persisted to MongoDB via Mongoose.

**Board** — A 4×7 hexagonal grid where champions are placed. Positions use
(row, col) coordinates. The board has two modes: read (viewing saved comps)
and edit (drag-and-drop placement).

**Sandbox** — A two-board workspace (`/sandbox`). Blue and red boards are
placed opposite each other (each side's row 3 is its front row); units carry
stars, items, team augments and a level cap. Running the sandbox produces a
prediction (aggregate over seeded fights) and a replayable fight.

**Combat engine** — Pure-TypeScript simulation in `frontend/src/engine/`.
`simulate(blue, red, traits, {seed})` returns one deterministic fight
(winner, duration, per-unit summary, typed event timeline, coverage);
`predict(blue, red, traits, {runs})` repeats it over seeds and returns
win/draw/loss rates. Mechanics are modeled in tiers; the **coverage report**
lists abilities/items/augments that are not modeled so predictions are
never silently wrong.

**Mechanics coverage** — Fraction of the fight's mechanics the engine models
(abilities with numeric variables, item effects, curated pure-stat augments,
trait variables). Shown next to predictions; unmodeled pieces are flagged
in the sandbox.

**Augment modifiers** — cdragon carries augment IDs but no numeric effects,
so the engine keeps a hand-curated pure-stat table in
`frontend/src/engine/data/augments.ts`; behavioral augments are flagged as
unmodeled.

**Seed** — Integer driving the engine's RNG. Identical inputs + seed produce
an identical fight; changing the seed shows the variance behind a
prediction.

**Dragontail** — Riot's data distribution format. JSON files per set
(e.g., `tft-champion_Set16.json`) with `{ type, version, data: {…} }`
structure. Parsed and persisted to MongoDB on initialization.

**CommunityDragon** — CDN for game data JSON and asset images (champion
portraits, item icons, trait icons). Raw assets live at
`https://raw.communitydragon.org/{latest|pbe}/plugins/rcp-be-lol-game-data/global/default/assets/...`
(no `/v1`). cdragon ships `.tex` paths with an optional
`.TFT_SetXX[_PostlaunchAugments]` or `.tft_XX_Y` suffix; strip the variant,
lowercase, and swap the extension to `.png` (see `cdragonAssetUrl` in
`CDragonTransformer`). Field names are misleading: `tileIcon` is the square
in-game portrait, `squareIcon` is the wide splash tile. Some sets (e.g. 18)
only serve files with a literal `.tft_setN` suffix appended to the png name,
so asset resolution must probe exact, stripped and suffixed forms on both
`latest` and `pbe`. Augment ids come from `setData.augments`, but their
display name/icon live on the matching entry of the top-level `items` array.

**PBE Paks** — The Unreal Engine install's packaged game data (IoStore
`.utoc/.ucas` plus `.pak`). The PBE patch story: the watcher fingerprints
these files, waits for the Riot Client to stop writing, then extracts and
re-imports. TFT ships them with unversioned properties, so DataTable rows
need external mappings to decode — the pipeline treats cdragon as the
authoritative stat source.

## Architecture

**Backend:** Node.js + TypeScript, Apollo Server + Express, MongoDB via
Mongoose. GraphQL at `/graphql`.

**Frontend:** Vite + React + TypeScript, Apollo Client (primary data access),
Zustand (domain state), React Context (UI state, theme). The combat engine is
a framework-free TypeScript package under `frontend/src/engine/` so the
backend can reuse it later without a rewrite.

**Data flow:** Dragontail JSONs → MongoDB → GraphQL resolvers → Apollo
Client → Zustand stores → React components.

**Deployment:** Single container (Docker) optimized for Vercel/Railway.

## Key Decisions

- **Document-per-set**: Each TFT set stored as a complete document with
  versioned IDs (`TFT16_*`). New sets don't break old data.
- **GraphQL primary**: Frontend talks to backend exclusively via GraphQL.
  REST endpoints from the old microservices architecture are dead code.
- **Board positions as (row, col)**: Champion placement uses grid
  coordinates, not pixel (x, y). Auto-assignment fills empty cells by cost
  tier.
- **Single TFTBoard component**: One hex board with an `editMode` boolean and
  a `presentation` prop — `flat` (SVG, builder) or `arena` (CSS-3D table with
  standing unit cards and item icons, sandbox) — instead of divergent board
  implementations.
- **Frontend state in Zustand**: Stores for champions, traits, items,
  augments, compositions, sets. Components subscribe via hooks.
- **Set status casing**: The GraphQL enum is uppercase
  (`ACTIVE`/`UPCOMING`/`ARCHIVED`); the app contract is lowercase and is
  normalized once in the Apollo link. UI code never compares raw casing.
- **Theming**: One palette per theme via `data-theme` CSS variables; pages
  use tokens (`var(--bg-*)`, `var(--text-*)`), never hardcoded light/dark
  colors. Theme initializes synchronously from `localStorage`.
- **Responsive navbar**: Set links live in a `SetsMenu` dropdown. Full labels
  at `xl`, icon rail at `lg`, hamburger sheet below `lg`. Page grids go
  single-column on mobile and `main` wraps unbroken data keys
  (`overflow-wrap: anywhere`) so pages never scroll horizontally.
- **Ingestion sanitizes client markup**: `sanitizeDescription` and
  `sanitizeName` in `CDragonTransformer` strip `<row>`/`<expandRow>` blocks,
  tags and `@…@`/`%i:…%`/`{{…}}` tokens from trait/item/augment text,
  including names (cdragon stores quest sentences and `@Tier@` templates
  there). Stored rows from older imports are repaired idempotently with
  `npm run sanitize` in `backend/`. Item/augment docs are shared between
  sets and Apollo caches by ID, so after any repair every set's server-side
  cache must be flushed or stale copies overwrite cleaned entities in the
  browser.
- **Asset resolution probes variants**: `npm run repair-images` (also run
  automatically at the end of `npm run reimport`) builds asset maps from the
  live latest + pbe cdragon JSON — not the `data/cdragon_*` snapshots, which
  can predate the current roster — and verifies every champion portrait,
  splash, trait icon, item icon and embedded set-augment icon with real HTTP
  checks, trying exact/stripped/`.tft_setN` filename forms. Unresolvable
  links are cleared so the UI shows its initials fallback instead of a
  broken image.
- **Secrets stay out of git**: real env files (`.env` and every `.env.*`
  variant) are gitignored, with `*.env.example` templates tracked, and a
  local pre-commit hook rejects staged env files. Dev credentials exist only
  in each checkout's env file or are passed as process env at server start.
  The 2026-11-16 snapshot also lives in a separate git worktree on branch
  `wip/2026-11-16-art-repair-and-sandbox` (pushed to origin).
