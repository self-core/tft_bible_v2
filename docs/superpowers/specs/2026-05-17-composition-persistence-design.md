# Composition Persistence — Design

## Summary

Persist user-created team compositions from in-memory storage to MongoDB, with optional board state (positions, star levels, items). Introduce a dedicated `CompositionService` to keep domain boundaries clean from the set data service layer.

## Data Model

### TypeScript interface (`backend/src/interfaces.ts`)

```typescript
interface IBoardUnit {
  championId: string;
  position: { row: number; col: number };
  starLevel: number;  // 1 | 2 | 3
  items: string[];
}

interface IComposition {
  id: string;
  title: string;
  description: string;
  setId: number;
  championIds: string[];
  units?: IBoardUnit[];       // optional full board snapshot
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
}
```

### Mongoose Schema (`backend/src/models/Composition.ts`)

```
Field                    Type        Required    Notes
──────────────────────────────────────────────────────────
_id                      ObjectId    auto
id                       String      yes         slug from title (unique)
title                    String      yes
description              String      yes
setId                    Number      yes
championIds              [String]    yes
units                    [Embedded]  no          optional board snapshot
  units.$.championId     String      yes
  units.$.position       {row, col}  yes
  units.$.starLevel      Number      yes
  units.$.items          [String]    yes
traitBonuses             [String]    yes
augmentRecommendations   [String]    yes
difficulty               String      yes
region                   String      yes
createdAt                Date        auto
updatedAt                Date        auto
```

## Architecture

```
resolvers.ts ──→ CompositionService ──→ CompositionModel (Mongoose)
                     │
                     └── IComposition (interface)
```

### CompositionService (`backend/src/services/CompositionService.ts`)

Public methods mirroring current resolver operations:

- `getAll(filters?)` — list all (with optional pagination/setId filter)
- `getById(id: string)` — single composition
- `getBySet(setId: number)` — compositions for a specific set
- `create(input)` — create (auto-generate id slug from title)
- `update(id, input)` — partial update
- `delete(id)` — remove
- `search(term)` — full-text search across title/description/traitBonuses

All methods return `IComposition` (or `null` for getById). The service handles the mapping between Mongoose documents and the interface.

### Resolver Impact (`backend/src/resolvers.ts`)

Replace the current in-memory `compositions: IComposition[]` array:

| Query/Mutation | Current | New |
|---|---|---|
| `compositions` | return local array | `compositionService.getAll()` |
| `compositionsBySet` | array filter | `compositionService.getBySet(setId)` |
| `composition` | array find | `compositionService.getById(id)` |
| `createComposition` | array push | `compositionService.create(input)` |
| `updateComposition` | array splice | `compositionService.update(id, input)` |
| `deleteComposition` | array splice | `compositionService.delete(id)` |
| `search` | array filter | `compositionService.search(term)` |

### GraphQL Schema Changes (`backend/src/schema.ts`)

Add optional board unit types:

```graphql
input BoardUnitInput {
  championId: String!
  position: PositionInput!
  starLevel: Int!
  items: [String!]!
}

input PositionInput {
  row: Int!
  col: Int!
}

input CreateCompositionInput {
  title: String!
  description: String!
  setId: Int!
  championIds: [String!]!
  units: [BoardUnitInput!]     # NEW: optional
  traitBonuses: [String!]!
  augmentRecommendations: [String!]!
  difficulty: String
  region: String
}

input UpdateCompositionInput {
  # same fields, all optional
  units: [BoardUnitInput!]      # NEW: optional
}

type Composition {
  id: ID!
  title: String!
  description: String!
  setId: Int!
  championIds: [String!]!
  units: [BoardUnit!]           # NEW: optional
  traitBonuses: [String!]!
  augmentRecommendations: [String!]!
  difficulty: String
  region: String
  createdAt: String             # NEW
  updatedAt: String             # NEW
}

type BoardUnit {
  championId: String!
  position: Position!
  starLevel: Int!
  items: [String!]!
}

type Position {
  row: Int!
  col: Int!
}
```

### Frontend Impact

Minimal — the frontend already sends `championIds` in GraphQL mutations and reads them in queries. The new `units` field is optional so existing queries/mutations continue to work unchanged. The frontend store (`compositionsStore.ts`) can start sending `units` when the user has placed champions on the board with specific positions/items.

## Error Handling

- `createComposition`: throws if `title` is empty or `id` slug collides (MongoDB unique index on `id`)
- `updateComposition`: throws if `id` not found
- `deleteComposition`: returns `false` if `id` not found (matches current behavior)

## Testing

- **Unit:** `CompositionService` test with mocked Mongoose calls — verify create/update/delete/search return correct shapes
- **Integration:** `Composition` model test — verify Mongoose schema, validators, defaults, timestamps

## Out of Scope (for now)

- Pagination metadata (current `totalPages`/`currentPage` in frontend store is placeholder — revisit when list grows)
- User authentication / per-user compositions
- Compositions as a sub-resource of SetData
