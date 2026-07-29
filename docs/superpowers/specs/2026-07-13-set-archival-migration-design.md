# Set Archival & Migration System — Design Spec

> **Date:** 2026-07-13
> **Status:** Approved
> **Scope:** Backend schema, migration CLI, resolver guards, frontend read-only UI, data file archiving

---

## Problem

TFT sets rotate quarterly. When a new set launches, the app needs to:
1. Import the new set's data from Dragontail files
2. Make the old set read-only (browseable but no new compositions)
3. Archive old Dragontail files from disk
4. Update the "current set" reference throughout the app

Currently there is no mechanism for this — hardcoded `[18, 16]` lists in resolvers, inconsistent env var defaults (`server.ts` defaults to 17, `SetDataService` defaults to 18), and no way to mark a set as archived.

## Requirements

- Old set data preserved and browsable, but read-only (no new compositions)
- Migration triggered manually via CLI script when new Dragontail files arrive
- Old Dragontail files archived then deleted from disk
- Shared collections (champions/traits/items) kept intact — no cleanup needed
- Archived sets hidden from navigation but accessible via direct URL
- Archived sets render with distinct visual treatment (muted, read-only banner)
- Dynamic default set resolution from database (no hardcoded defaults)

## Approach: Set Lifecycle States

Extend the Set model with a `status` enum (`'upcoming' | 'active' | 'archived'`). A CLI migration script transitions states. Frontend respects status for UI behavior.

---

## 1. Schema Changes

### Set Model (`backend/src/models/Set.ts`)

Add `status` field:

```typescript
type SetStatus = 'upcoming' | 'active' | 'archived';

interface ISetDocument {
  setId: number;
  setName: string;
  status: SetStatus;        // NEW — default 'active'
  champions: string[];
  traits: string[];
  items: string[];
  augments: any[];
  mechanics: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

Mongoose schema addition:

```typescript
status: {
  type: String,
  enum: ['upcoming', 'active', 'archived'],
  default: 'active',
  required: true,
},
```

### Existing Data Migration

- Set 16 → `status: 'archived'`
- Set 18 → `status: 'active'`
- Any future imported set → `status: 'active'` (default)

### GraphQL Schema (`backend/src/schema.ts`)

```graphql
enum SetStatus {
  UPCOMING
  ACTIVE
  ARCHIVED
}

type Set {
  setId: Int!
  setName: String!
  status: SetStatus!
  champions: [Champion!]!
  traits: [Trait!]!
  items: [Item!]!
  augments: [Augment!]!
  mechanics: JSON
}
```

New query:

```graphql
type Query {
  activeSet: Set   # Returns the single active set
}
```

---

## 2. Migration Script

**Location:** `backend/src/scripts/migrate-set.ts`
**Entry point:** `npm run migrate:set`

### Usage

```bash
# Full migration: archive Set 18, import Set 19
npm run migrate:set -- --archive 18 --import 19

# Archive only
npm run migrate:set -- --archive 18

# Import only (assumes previous set already archived)
npm run migrate:set -- --import 19
```

### Steps (full migration)

1. **Validate** — Check Dragontail directory contains data for the new set
2. **Archive current** — Update Set document: `status: 'archived'`
3. **Import new** — Reuse `ImportService` to parse Dragontail and persist to MongoDB
4. **Set status** — New set document gets `status: 'active'`
5. **Archive files** — Move old Dragontail JSONs to `dragontail-archive/{setId}/`
6. **Report** — Print summary of what was archived, imported, and moved

### Error Handling

- Import fails mid-way → roll back by deleting partially-imported Set document
- Archive files fail → warn but don't abort (data safe in MongoDB)
- Dragontail files not found → exit with clear error message

### Dependencies

Uses existing `ImportService`, `PathResolver`, `Repository` — no new infrastructure.

---

## 3. Backend Guards

### Resolver Changes (`backend/src/resolvers.ts`)

**Mutations guarded by set status:**

```typescript
createComposition: async (_, { input }, context) => {
  const set = await setDataService.getSetData(input.setId);
  if (set.status !== 'active') {
    throw new Error(`Cannot create compositions for archived set ${input.setId}`);
  }
  // ... existing logic
}

updateComposition: async (_, { id, input }, context) => {
  const composition = await compositionService.getById(id);
  if (composition) {
    const set = await setDataService.getSetData(composition.setId);
    if (set.status !== 'active') {
      throw new Error(`Cannot edit compositions for archived set ${composition.setId}`);
    }
  }
  // ... existing logic
}
```

**deleteComposition** — Allowed regardless of set status (cleanup is always valid).

**refreshMetaData** — Allowed for any set (meta data can be updated for archived sets).

### Hardcoded List Removal

Replace `[18, 16]` iteration with dynamic database queries:

```typescript
// Before: for (const id of [18, 16]) { ... }
// After:
const allSets = await Set.find({});
for (const set of allSets) { ... }
```

### Default Set Resolution

Replace hardcoded defaults with database query:

```typescript
// Before: const defaultSetId = parseInt(process.env.TFT_CURRENT_SET || '18')
// After:
const activeSet = await Set.findOne({ status: 'active' });
const defaultSetId = activeSet?.setId ?? parseInt(process.env.TFT_CURRENT_SET || '18');
```

### Repository Additions (`backend/src/services/_internal/Repository.ts`)

```typescript
async getActiveSet(): Promise<ISetDocument | null> {
  return Set.findOne({ status: 'active' });
}

async getArchivedSets(): Promise<ISetDocument[]> {
  return Set.find({ status: 'archived' });
}

async isSetEditable(setId: number): Promise<boolean> {
  const set = await Set.findOne({ setId });
  return set?.status === 'active';
}
```

---

## 4. Frontend Behavior

### Navigation (`frontend/src/components/Layout.tsx`)

- Archived sets **hidden from sidebar navigation**
- Archived sets still accessible via direct URL (`/sets/16`) and from `/sets-info`
- `SetPatchInfoPage` shows all sets; archived sets get muted styling + "Archived" badge

### Archived Set UI (`frontend/src/pages/SetDetail.tsx`)

When `set.status === 'archived'`:
- Muted/desaturated color scheme or overlay
- "Archived — Read Only" banner at the top
- No "Create Composition" button
- Champion/trait/item cards clickable for info, no action buttons

When `set.status === 'active'`:
- Current full-featured UI (no change)

### Composition Behavior

- Compositions from archived sets: viewable, no edit/delete buttons
- "New Composition" dropdown only shows active sets
- Direct navigation to `/compositions/new?set=16` → form checks set status, disables submission

### GraphQL Query Updates

Add `status` field to existing queries:

```graphql
query GetSets {
  sets {
    setId
    setName
    status    # ADD
  }
}

query GetSet($setId: Int!) {
  set(setId: $setId) {
    setId
    setName
    status    # ADD
    champions { ... }
    traits { ... }
    items { ... }
    augments { ... }
  }
}
```

New query:

```graphql
query GetActiveSet {
  activeSet {
    setId
    setName
    status
  }
}
```

---

## 5. Data File Archiving

### Archive Directory Structure

```
dragontail-archive/
  16/
    tft-champion_Set16.json
    tft-trait_Set16.json
    tft-item_Set16.json
  18/
    tft-champion_Set18.json
    tft-trait_Set18.json
    tft-item_Set18.json
```

### Script Behavior

- Creates `dragontail-archive/{setId}/` directory
- Moves (not copies) old Dragontail JSON files into it
- If archive directory exists, merges files (handles partial previous runs)
- Logs which files were moved and their sizes

### Recovery Path

- Data can be re-imported from `dragontail-archive/{setId}/`
- A `--restore` flag is a stretch goal (not in initial scope)

### Docker Considerations

- Archive directory inside container's working directory (not the read-only mount)
- If using Docker volumes, archive directory should be a separate volume mount

---

## 6. Config & Environment Handling

### Inconsistencies to Fix

| File | Current Default | New Behavior |
|---|---|---|
| `server.ts` | `TFT_CURRENT_SET \|\| '17'` | Query DB for active set |
| `container.ts` | `TFT_PATCH_VERSION \|\| '17'` | Keep as env var (patches are per-set) |
| `SetDataService.ts` | Fallback to `18` | Query DB, fallback to embedded data |
| `resolvers.ts` | `[18, 16]` hardcoded | Dynamic query from DB |
| `docker-compose.yml` | `dragontail-16.10.1` | Comment explaining update process |

### New Approach

- Remove hardcoded default set values from `server.ts`, `container.ts`, `SetDataService.ts`
- Default set resolved from database: `Set.findOne({ status: 'active' })`
- `TFT_CURRENT_SET` env var becomes optional override (for edge cases or testing)
- `TFT_PATCH_VERSION` stays as env var (patches are per-set, not auto-detected)
- `docker-compose.yml` gets a comment explaining how to update the dragontail mount path

### Startup Behavior

- On server start, if no active set exists in DB → log warning, fall back to embedded fallback data
- If multiple active sets exist (data corruption) → log error, use the most recent one

---

## 7. What's NOT in Scope

- **Automated Dragontail detection** — The script requires manual invocation
- **Set preview/upcoming feature** — The `upcoming` status exists in the enum but isn't used in this iteration
- **Automatic env var updates** — The script logs recommended values; user updates .env manually
- **Restore from archive** — `--restore` flag is a stretch goal
- **Database cleanup** — Shared collections keep all data; no deletion of old champions/traits/items
- **MetaComposition archival** — Meta data for archived sets remains queryable (already scoped by setId)

---

## 8. Migration Checklist (Quarterly Process)

When a new TFT set launches:

1. [ ] Download new Dragontail files to the expected directory
2. [ ] Run `npm run migrate:set -- --archive {oldSetId} --import {newSetId}`
3. [ ] Review the migration report output
4. [ ] Update `TFT_CURRENT_SET` in `.env` (optional — DB is source of truth)
5. [ ] Update `docker-compose.yml` dragontail mount path (if using Docker)
6. [ ] Deploy the updated application
7. [ ] Verify: browse archived set (read-only), browse active set (full features), create a composition for active set
