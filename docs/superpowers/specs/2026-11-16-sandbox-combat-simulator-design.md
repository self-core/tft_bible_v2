# Sandbox Combat Simulator — Design Doc

**Date:** 2026-11-16
**Status:** v1 implemented (engine + `/sandbox`); calibration corpus,
scenarios, and trivia remain
**Companion docs:** `CONTEXT.md` (domain language), `AGENT.md` (repo guide)

## Intent & Why

The sandbox lets a user place two boards — their own and an opponent's — on
the hex arena with items, augments, star levels, and positioning, run a
deterministic simulation of the TFT fight, and:

1. **Theorycraft / replay comps** — see a comp's strengths and weaknesses
   across scenarios (change one variable, re-run, compare outcomes).
2. **Engagement trivia** — publish a shareable "guess who wins" link;
   visitors pick a side, then watch the actual fight play out in the
   browser as the reveal.

Accuracy target: the engine's predicted winner should match the real game's
outcome for faithfully reconstructed board states at least 95% of the time,
calibrated against observed PBE/retail fights. Both product modes depend on
the prediction being right.

The engine shares one source of truth with the trait tracker: numeric trait
breakpoints and champion stats come from the same data pipeline.

## Goals

- Deterministic, seeded combat engine mirroring TFT's core combat loop:
  attack/mana timing, target acquisition, movement on the hex grid,
  damage formulas (AD/AP, armor/MR, crit), healing, shields, deaths.
- Per-tick **event timeline** recording — powers fight replay, theorycraft
  scrubber, and accuracy debugging from the same artifact.
- **Fight playback in the browser**: units rendered on the arena, moving
  between hexes, attacking, casting, with HP/mana bars, floating damage
  numbers, cast effects, speed control (0.5×–16×), and a scrubber.
- Sandbox UI: two 4×7 boards + benches, item assignment, 3 augments each,
  level control, positioning via drag-and-drop.
- Scenario system: save/load board-vs-board setups; branch a saved scenario
  and diff outcomes side-by-side ("what if I swap my carry's items?").
- Trivia mode: compact shareable URL encoding both boards; guest-side guess
  → animated reveal → aggregate vote stats.
- Full-stat data ingestion (fixes the lossy data model), which also
  completes the trait tracker's numeric breakpoints.
- Drag-and-drop rebuilt on pointer events — works on mouse and touch, with
  ghost previews and hover-highlighted drop targets — shared by the
  composition builder and the sandbox.

## Non-goals (for v1)

- Bot-vs-bot whole-game simulation (carousel, shop, economy, leveling).
- Server-verified daily puzzles, leaderboards, anti-cheat (v2 concern).
- Server-side execution of simulations (see Approaches — client-side).
- Augments with complex behavioral effects beyond stat/typed hooks are
  modeled only if they fall into existing registry hooks (coverage tiering
  below, with a visible coverage indicator).
- Emulating Riot's exact RNG distribution beyond seeded rolls — we use our
  own seeded RNG; fairness, not identicalness, is the standard.

## Anti-goals (would make this a failure)

- A "power score" heuristic posing as a prediction — no honest fight, no
  replay, no trustworthy win %.
- A prediction the user can't validate — accuracy must be measurable via
  the calibration corpus, not vibes.
- A sandbox that diverges from the trait tracker (two sources of truth for
  trait effects).

## Constraints

- **PBE for the next set lands Tuesday afternoon PST** — new-set ingestion
  must be ready first; the site must not ship broken for the new set.
- Existing stack: React 18 + Vite + TS, Apollo Client, Zustand, Tailwind,
  SVG board. No new state libraries.
- Data pipeline currently lossy: champions persist only hp/mana/damage;
  trait breakpoints persist as display text. Raw cdragon JSON (with full
  numeric stats and trait `effects` variables) exists locally and has a
  UTF-8 BOM to strip. Set-item/augment entries are ID lists; full objects
  live in the top-level `items` array.
- Riot match API gives no unit positioning — no automated ground truth.
  Accuracy validation is a manual/observation loop (see Calibration).
- Trait/champion mechanics are numerous and unique; complete coverage on
  day one is unrealistic — tiering required.
- Fights render in-browser; the engine must stay fast enough to simulate
  (target < 50 ms per fight, no WebGL/GPU work).

## Approaches (considered & decided)

**1. Engine placement — picked: shared pure-TS package, client-side.**
A standalone `combat-engine` package (no React deps), executed in the
browser. Zero server cost, instant results, unit-testable, and the backend
can adopt the same package later (Monte-Carlo batches, server-verified
puzzles) without a rewrite. Rejected backend-endpoint-first (latency, cost,
slower iterate loop for calibration) and heuristic power-score (dishonest,
kills both modes).

**2. Mechanics modeling — picked: tiered mechanics registry.**
- **Tier 0 — core combat loop** (set-independent, fully testable): hex-grid
  movement/targeting, attack timing from AS, mana gen (attacks + initial +
  damage taken), cast when full, damage application (AD/AP, armor/MR
  reduction, crit rolls), star scaling, death/removal.
- **Tier 1 — data-driven stat effects**: numeric effects from cdragon
  (trait `effects` variables, item `effects`, augment variables) applied by
  a generic interpreter — no per-trait code for stat traits.
- **Tier 2 — ability casting**: from numeric `ability.variables` arrays
  (star-indexed), interpreted by typed effect verbs (damage, heal, shield,
  buff, aoe, chain, etc.).
- **Tier 3 — unique behaviors** (dash, taunt, revive, execute): per-trait/
  champion hooks in the registry, shipped incrementally. A visible
  "mechanics coverage" badge shows what's fully modeled per unit.
Rejected: hardcoding everything up front (unmaintainable, breaks each set).

**3. Trivia mechanics — picked: shareable link + reveal + vote stats.**
Board state serializes compactly into the URL; guess → animated reveal →
simple backend mutation accumulates votes. Rejected: server-verified daily
puzzles with leaderboards (v2).

**4. Drag-and-drop — picked: custom pointer-events DnD layer.**
Replaces raw HTML5 DnD (drop coverage only on exposed hex slivers, no touch
support, no ghost). Pointer-events approach works uniformly on mouse and
touch, gives ghost previews and hover highlights, and is shared by builder
and sandbox. Rejected: adopting react-dnd (needs an extra touch backend
dependency and same ghost work anyway).

## Decisions Resolved During Review

- **Set targets (factual, verified):** Set 18 *Enchanted Wilds* launched
  Aug 25, 2026 and is current retail — the **sandbox/calibration target for
  v1**. Set 19 *Prismatic Tour* hits PBE Tuesday Nov 17, 2026 and goes live
  Dec 2 — Tuesday's ingestion deliverable must import it cleanly; the
  sandbox re-seeds to Set 19 from the same pipeline when the team is ready.
  Tuesday's deliverable is ingestion + a working site (trait tracker,
  builder fixes); the sandbox ships after, calibrated on Set 18 first.
- **Prediction semantics:** the engine exposes `simulate(blue, red, seed)`
  — one deterministic fight (powers the reveal and playback) — and
  `predict(blue, red, n)` — n seeded runs (default ~128), returning
  win/draw/loss rates. **"The prediction" is the aggregate over seeds**;
  corpus agreement compares aggregate win-rate against the observed
  outcome. Single-seed replay vs. observation is used only for debugging.
- **Trivia reveal:** guests guess the **aggregate** outcome; the reveal
  plays one stored seeded fight (seed persists in the scenario document)
  and shows the aggregate win-rate alongside. Guests may also guess
  "draw"; a timeout is a draw.
- **Augment data (verified gap):** cdragon carries **no numeric augment
  effects** (augments exist as ID strings in setData entries; dragontail is
  description text). Decision: a hand-maintained, in-repo stat table
  (engine package config) covering popular **pure-stat augments first**
  (~20–30 per set, grown over time); behavioral augments are Tier 3 hooks;
  unmodeled augments display flagged in the sandbox, never silently
  ignored.
- **Trivia links:** server-stored scenarios with short IDs
  (`/sandbox/guess/:id`), via a new GraphQL Scenario model — required
  anyway for vote aggregation. Deleted/missing scenarios get a friendly
  fallback page.
- **Calibration capture:** the sandbox gains a **"record observation"**
  action — saves both boards + observed winner/draw (+ optional notes) and
  exports a corpus entry; entries land versioned in-repo under
  `data/corpus/`. Full board reconstruction happens at capture time, not
  later from memory.
- **Structural combat rule defaults** (mine, corpus-corrected over time):
  mana from damage taken computed pre-mitigation; mana overflow retained
  into next cast cycle; initial mana sources stack additively; base-stat
  star multipliers follow the 1.8× / 1.8× / 1.9× pattern by cost tier;
  ability variables are star-indexed. All in one documented config module.

## Decided How-It-Works (as chosen)

- **Data pipeline first:** extend backend ingestion (schema in
  `backend/src/models/Champion.ts`, transformer `CDragonTransformer.ts`) to
  persist the full stat block and numeric trait effects (with `{hash}`
  variable-name resolution from the localized `sets` entry), then re-import
  all sets from local cdragon JSON. GraphQL surface extended accordingly.
  This unblocks trait tracker, sandbox, and Tuesday's PBE import at once.
- **Engine interface:** `simulate(blue, red, options) → FightResult`,
  where inputs are validated board states (units with stats+items+stars,
  traits, augments, level) and output is `winner | draw | timeout`,
  per-side stats, and the full event timeline. Seeded RNG for
  reproducibility; identical inputs → identical outputs.
- **Timeline events:** typed (move, attack, cast, damage, heal, shield,
  death) with tick timestamps; playback maps 1:1 to the scrubber.
- **Playback layer:** engine timeline → animated SVG arena reusing the
  board's hex rendering; interpolation between hex positions; requestAnimationFrame
  loop driven by an event clock, speed multiplier, scrub-to-tick.
- **UI surfaces:** `/sandbox` (theorycraft view: dual boards + benches +
  augments + level + controls), `/sandbox/guess/:id` (trivia view: guess →
  reveal), scenario storage via new GraphQL model (mirrors Composition).
- **Trait tracker upgrade:** consumes the same numeric breakpoints; the
  synergy engine's recommendation scoring is rebased on numeric magnitudes
  where available, falling back to current heuristic otherwise.

## Calibration & the 95% Target

- Keep a versioned **fight corpus** in-repo (`data/corpus/*.json`):
  reconstructed boards + observed real outcome (from PBE observation,
  recorded by the team).
- A CLI/vitest harness replays the corpus and reports agreement rate per
  engine version; the badge tracks mechanics coverage and accuracy.
- Coverage tiering is honest in the UI: units whose traits/abilities are
  not fully modeled are flagged, and their effect on prediction confidence
  is shown.
- Accuracy work is a loop: new set lands → team records observed fights →
  engine gaps fixed → corpus grows. 95% is a calibration goal reached over
  the set's lifetime, not a launch-day guarantee; the UI may show
  confidence alongside the prediction.

## Implementation Notes (2026-11-16)

Built to date:

- **Engine** — `frontend/src/engine/` (frameless TS): mirrored 8×4 odd-r hex
  grid, 100 ms ticks, seeded mulberry32 RNG, attack/mana timing, nearest
  target lock + movement, armor/MR mitigation, crit, star scaling, trait /
  item / curated-augment stat modifiers, ability plans from cdragon
  variables, shields/heals, typed timeline, timeout draw, per-unit summary,
  and a `CoverageReport`. `simulate(...)` and `predict(..., {runs: 128})`
  match the interface above.
- **UI** — `/sandbox`: shared palette with pointer-events DnD onto either
  4×7 board, per-unit stars/items (`UnitConfigPopover`), per-side level caps,
  three augments per side (unmodeled flagged), trait panel per side,
  prediction rates + coverage, and playback with play/pause, restart,
  0.5×–16× speed, scrubber, HP totals and a typed event log.
- **Data** — `GET_ACTIVE_SET` now carries champion stats/abilities, trait
  breakpoints with variables, item numeric effects, and augments. Backend
  ingestion skips cdragon trait effects that are not breakpoints (no numeric
  `minUnits`) and normalizes null ability-variable values; the repository
  also filters legacy rows. Sandbox needs the active set to expose numeric
  item effects.
- **Tests** — engine determinism/formulas/abilities/coverage (34), sandbox
  page load / augment flags / drag + prediction (4), plus transformer and
  repository regressions.

Still open: calibration corpus + `data/corpus/` harness and the 95% loop,
scenario save/branch/diff, record-observation capture, trivia share/reveal
and votes, and richer Tier-3 mechanics. The development DB currently marks
Set 17 ACTIVE (Set 18 UPCOMING), so the sandbox exercises Set 17 data until
set statuses/reimport are reconciled for the Set 18/19 rollout.

- Exact package layout and file names (suggest `frontend/src/engine/` or a
  workspace package, consistent with repo conventions).
- Damage formula constants and tick cadence (e.g., 0.1 s ticks), kept in
  one config module, tuned against the corpus.
- Visual design of the playback (movement animations, cast effects,
  damage-number styling) and sandbox layout polish — mockups to be
  reviewed with the user before implementation.
- The typed effect-verb list for Tier 2, grown as the set demands.
- Serialization format for scenario documents (URL sharing is
  server-stored, decided above; the storage shape is the builder's).
- Which pure-stat augments go in the initial curated table, and the table's
  file format.
- Test strategy detail: vitest for engine determinism and formulas, MSW for
  API, Playwright for the trivia flow.
