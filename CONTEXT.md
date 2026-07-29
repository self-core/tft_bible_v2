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

**Dragontail** — Riot's data distribution format. JSON files per set
(e.g., `tft-champion_Set16.json`) with `{ type, version, data: {…} }`
structure. Parsed and persisted to MongoDB on initialization.

**CommunityDragon** — CDN for game asset images (champion portraits, item
icons, trait icons). URL format:
`https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/champion-portraits/{name}.png`

## Architecture

**Backend:** Node.js + TypeScript, Apollo Server + Express, MongoDB via
Mongoose. GraphQL at `/graphql`.

**Frontend:** Vite + React + TypeScript, Apollo Client (primary data access),
Zustand (domain state), React Context (UI state, theme).

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
- **Single TFTBoard component**: One SVG hex board with `editMode` boolean
  instead of three divergent board implementations.
- **Frontend state in Zustand**: Stores for champions, traits, items,
  augments, compositions. Components subscribe via hooks.
