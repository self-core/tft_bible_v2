# Set Archival & Migration System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add set lifecycle states (`upcoming` | `active` | `archived`) to the Set model, build a CLI migration script, enforce read-only guards for archived sets, and update the frontend to hide archived sets from nav and render them with distinct UI.

**Architecture:** Extend the existing Mongoose Set schema with a `status` enum field. Add a CLI script that reuses `ImportService` and `Repository` to archive the current set, import a new one, and move old Dragontail files to an archive directory. Frontend queries gain the `status` field; Layout filters archived sets from nav; SetDetail renders archived sets with muted styling and no edit actions.

**Tech Stack:** TypeScript, Mongoose, Apollo Server (GraphQL), Zustand, React, vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/src/models/Set.ts` | Modify | Add `status` enum field to schema and interface |
| `backend/src/interfaces.ts` | Modify | Add `status` to `ISetData` interface |
| `backend/src/schema.ts` | Modify | Add `SetStatus` enum, `status` field to `SetData` type, `activeSet` query |
| `backend/src/services/_internal/Repository.ts` | Modify | Add `getActiveSet()`, `getArchivedSets()`, `getAllSets()`, `isSetEditable()`, update `saveSetData()` |
| `backend/src/services/SetDataService.ts` | Modify | Replace hardcoded default with DB-driven active set resolution |
| `backend/src/resolvers.ts` | Modify | Add guards to `createComposition`/`updateComposition`, replace `[18,16]` with dynamic queries, add `activeSet` resolver |
| `backend/src/server.ts` | Modify | Replace hardcoded `TFT_CURRENT_SET` with DB-driven resolution |
| `backend/src/scripts/migrate-set.ts` | Create | CLI migration script (archive + import + file move) |
| `backend/src/services/_internal/PathResolver.ts` | Modify | Add `archiveFiles(setId)` and `getArchiveDir()` methods |
| `backend/src/services/ImportService.ts` | Modify | Accept optional `status` param in `importSet()` for new set status |
| `backend/src/services/_internal/Repository.test.ts` | Modify | Add tests for new Repository methods |
| `backend/src/services/SetDataService.test.ts` | Modify | Add test for DB-driven default resolution |
| `backend/src/services/ImportService.test.ts` | Modify | Add test for status param |
| `frontend/src/lib/graphql.ts` | Modify | Add `status` to `GET_SET`, `GET_SETS`, new `GET_ACTIVE_SET` query |
| `frontend/src/lib/api.ts` | Modify | Add `status` to `SetData` type, add `getActiveSet()` API method, add `status` to queries |
| `frontend/src/stores/setsStore.ts` | Modify | Add `activeSet` state and `fetchActiveSet()` |
| `frontend/src/components/Layout.tsx` | Modify | Filter archived sets from nav links |
| `frontend/src/pages/SetDetail.tsx` | Modify | Read `status` field, render archived banner + muted styling, hide action buttons |

---

### Task 1: Set Model Schema — Add Status Field

**Files:**
- Modify: `backend/src/models/Set.ts:3-27`
- Modify: `backend/src/interfaces.ts:44-52`

- [ ] **Step 1: Add `status` to the `ISetDocument` interface**

```typescript
// backend/src/models/Set.ts — replace lines 3-13
export interface ISetDocument extends mongoose.Document {
  setId: number;
  setName: string;
  status: 'upcoming' | 'active' | 'archived';
  champions: string[];
  traits: string[];
  items: string[];
  augments: any[];
  mechanics: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Add `status` field to the Mongoose schema**

```typescript
// backend/src/models/Set.ts — insert after setName field (line 17)
status: {
  type: String,
  enum: ['upcoming', 'active', 'archived'],
  default: 'active',
  required: true,
},
```

- [ ] **Step 3: Add `status` to `ISetData` interface**

```typescript
// backend/src/interfaces.ts — modify ISetData (lines 44-52)
export interface ISetData {
  setId: number;
  setName: string;
  status: 'upcoming' | 'active' | 'archived';
  champions: ISetChampion[];
  traits: ITrait[];
  items: IItem[];
  augments: any[];
  mechanics: Record<string, any>;
}
```

- [ ] **Step 4: Run existing tests to verify nothing breaks**

Run: `cd backend && npx vitest run`
Expected: All existing tests pass (the `status` field has a default, so existing documents won't break)

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/Set.ts backend/src/interfaces.ts
git commit -m "feat: add status enum field to Set model and ISetData interface"
```

---

### Task 2: GraphQL Schema — Add SetStatus Enum and activeSet Query

**Files:**
- Modify: `backend/src/schema.ts:56-64, 136-152`

- [ ] **Step 1: Add `SetStatus` enum before the `SetData` type**

```graphql
// backend/src/schema.ts — insert before "type SetData" (line 56)
enum SetStatus {
  UPCOMING
  ACTIVE
  ARCHIVED
}
```

- [ ] **Step 2: Add `status` field to `SetData` type**

```graphql
// backend/src/schema.ts — modify type SetData (lines 56-64)
type SetData {
  setId: Int!
  setName: String!
  status: SetStatus!
  champions: [Champion!]!
  traits: [Trait!]!
  items: [Item!]!
  augments: [Augment!]!
  mechanics: String
}
```

- [ ] **Step 3: Add `activeSet` query to the Query type**

```graphql
// backend/src/schema.ts — add inside type Query block (after line 151)
activeSet: SetData
```

- [ ] **Step 4: Run existing tests**

Run: `cd backend && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/schema.ts
git commit -m "feat: add SetStatus enum, status field to SetData, and activeSet query"
```

---

### Task 3: Repository — Add Status-Aware Methods

**Files:**
- Modify: `backend/src/services/_internal/Repository.ts:10-109`
- Modify: `backend/src/services/_internal/Repository.test.ts`

- [ ] **Step 1: Update `getSetData` to include status in return**

```typescript
// backend/src/services/_internal/Repository.ts — modify getSetData (lines 18-56)
// Add status to the returned object:
return {
  setId: setDoc.setId,
  setName: setDoc.setName,
  status: (setDoc as any).status || 'active',
  champions: champions.map(doc => ({
    // ... existing fields unchanged
  })),
  // ... rest unchanged
};
```

- [ ] **Step 2: Update `saveSetData` to accept and persist status**

```typescript
// backend/src/services/_internal/Repository.ts — modify saveSetData (lines 59-73)
async saveSetData(
  setId: number,
  setName: string,
  championIds: string[],
  traitKeys: string[],
  itemIds: string[],
  augments: any[],
  status: 'upcoming' | 'active' | 'archived' = 'active'
): Promise<void> {
  await SetModel.findOneAndUpdate(
    { setId },
    {
      setId,
      setName,
      status,
      champions: championIds,
      traits: traitKeys,
      items: itemIds,
      augments,
      mechanics: {},
    },
    { upsert: true, new: true }
  );
}
```

- [ ] **Step 3: Add `getAllSets` method**

```typescript
// backend/src/services/_internal/Repository.ts — add after hasSet method
async getAllSets(): Promise<any[]> {
  return SetModel.find({}).sort({ setId: -1 }).lean();
}
```

- [ ] **Step 4: Add `getActiveSet` method**

```typescript
// backend/src/services/_internal/Repository.ts — add after getAllSets
async getActiveSet(): Promise<any | null> {
  return SetModel.findOne({ status: 'active' }).lean();
}
```

- [ ] **Step 5: Add `setSetStatus` method**

```typescript
// backend/src/services/_internal/Repository.ts — add after getActiveSet
async setSetStatus(setId: number, status: 'upcoming' | 'active' | 'archived'): Promise<void> {
  await SetModel.findOneAndUpdate({ setId }, { status }).exec();
}
```

- [ ] **Step 6: Write test for new Repository methods**

```typescript
// backend/src/services/_internal/Repository.test.ts — append to file
describe('Repository — status methods', () => {
  it('getAllSets should return empty array when no sets exist', async () => {
    if (!isConnected) return;
    const sets = await repo.getAllSets();
    expect(Array.isArray(sets)).toBe(true);
  });

  it('getActiveSet should return null when no active set exists', async () => {
    if (!isConnected) return;
    const active = await repo.getActiveSet();
    expect(active).toBeNull();
  });

  it('setSetStatus should update set status', async () => {
    if (!isConnected) return;
    // This test verifies the method doesn't throw
    await expect(repo.setSetStatus(9999, 'archived')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 7: Run tests**

Run: `cd backend && npx vitest run src/services/_internal/Repository.test.ts`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/_internal/Repository.ts backend/src/services/_internal/Repository.test.ts
git commit -m "feat: add status-aware Repository methods (getAllSets, getActiveSet, setSetStatus)"
```

---

### Task 4: SetDataService — DB-Driven Default Set Resolution

**Files:**
- Modify: `backend/src/services/SetDataService.ts:14-39`
- Modify: `backend/src/services/SetDataService.test.ts`

- [ ] **Step 1: Modify `detectLatestSet` to query DB for active set**

```typescript
// backend/src/services/SetDataService.ts — replace detectLatestSet method (lines 26-39)
private async detectLatestSet(): Promise<number> {
  // 1. Check env var override
  if (process.env.TFT_CURRENT_SET) {
    return parseInt(process.env.TFT_CURRENT_SET, 10);
  }

  // 2. Query DB for active set
  try {
    const activeSet = await this.repository.getActiveSet();
    if (activeSet) return activeSet.setId;
  } catch {}

  // 3. Fallback: scan Dragontail files
  try {
    const dir = this.pathResolver.findDragontailDir();
    if (!dir) return 18;
    const championJson = FileParser.readJsonFile(this.pathResolver.getChampionPath(dir))
      || this.loadHighestSetFile(this.pathResolver, dir);
    const sets = FileParser.detectAvailableSets(championJson);
    return sets.length > 0 ? sets[0] : 18;
  } catch {
    return 18;
  }
}
```

- [ ] **Step 2: Update constructor to handle async `detectLatestSet`**

```typescript
// backend/src/services/SetDataService.ts — replace constructor and initialize
constructor(
  private repository: Repository,
  private importService: ImportService,
  private cache: ResultCache,
  private pathResolver: PathResolver,
) {
  this.embeddedFallback = EmbeddedFallback;
  // Don't call detectLatestSet here — it's async now
}

async initialize(): Promise<void> {
  if (this.initialized) return;
  this.defaultSetId = await this.detectLatestSet();
  try {
    await this.getSetData(this.defaultSetId);
  } catch {}
  this.initialized = true;
}
```

- [ ] **Step 3: Update `getSetData` to return `status` in the `ISetData` object**

The `getSetData` method already returns the result from `repository.getSetData()` which now includes `status`. No change needed here — the Repository method handles it.

- [ ] **Step 4: Write test for DB-driven default**

```typescript
// backend/src/services/SetDataService.test.ts — append
it('should use env var override when TFT_CURRENT_SET is set', async () => {
  process.env.TFT_CURRENT_SET = '16';
  const service = new SetDataService(
    new Repository(), new (ImportService as any)(), new ResultCache(), new PathResolver()
  );
  await service.initialize();
  // getSetData with no args should use defaultSetId from env
  const data = await service.getSetData();
  expect(data.setId).toBe(16);
  delete process.env.TFT_CURRENT_SET;
});
```

- [ ] **Step 5: Run tests**

Run: `cd backend && npx vitest run src/services/SetDataService.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/SetDataService.ts backend/src/services/SetDataService.test.ts
git commit -m "feat: make SetDataService default set resolution DB-driven with env override"
```

---

### Task 5: Resolvers — Add Guards and Replace Hardcoded Sets

**Files:**
- Modify: `backend/src/resolvers.ts:24-206`

- [ ] **Step 1: Add helper to get all set IDs dynamically**

```typescript
// backend/src/resolvers.ts — add after imports (line 16)
import { SetModel } from './models/Set';

const getAllSetIds = async (): Promise<number[]> => {
  const sets = await SetModel.find({}).select('setId').lean();
  return sets.map((s: any) => s.setId).sort((a: number, b: number) => b - a);
};
```

- [ ] **Step 2: Replace hardcoded `[18, 16]` in `champion` resolver**

```typescript
// backend/src/resolvers.ts — replace champion resolver (lines 38-55)
champion: async (_: any, { id }: { id: string }) => {
  const match = id.match(/^TFT(\d+)_/i);
  if (match) {
    const setId = parseInt(match[1], 10);
    try {
      const setData = await setDataService.getSetData(setId);
      const found = setData.champions.find((champ: ISetChampion) => champ.id === id);
      if (found) return found;
    } catch {}
  }
  const allIds = await getAllSetIds();
  for (const setId of allIds) {
    try {
      const setData = await setDataService.getSetData(setId);
      const found = setData.champions.find((champ: ISetChampion) => champ.id === id);
      if (found) return found;
    } catch {}
  }
  return null;
},
```

- [ ] **Step 3: Replace hardcoded `[18, 16]` in `trait` resolver**

```typescript
// backend/src/resolvers.ts — replace trait resolver (lines 61-69)
trait: async (_: any, { id }: { id: string }) => {
  const allIds = await getAllSetIds();
  for (const setId of allIds) {
    try {
      const setData = await setDataService.getSetData(setId);
      const found = setData.traits.find((trait: ITrait) => trait.key === id);
      if (found) return found;
    } catch {}
  }
  return null;
},
```

- [ ] **Step 4: Replace hardcoded `[18, 16]` in `item` resolver**

```typescript
// backend/src/resolvers.ts — replace item resolver (lines 75-92)
item: async (_: any, { id }: { id: string }) => {
  const match = id.match(/^TFT(\d+)_/i);
  if (match) {
    const setId = parseInt(match[1], 10);
    try {
      const setData = await setDataService.getSetData(setId);
      const found = setData.items.find((item: IItem) => item.id === id);
      if (found) return found;
    } catch {}
  }
  const allIds = await getAllSetIds();
  for (const setId of allIds) {
    try {
      const setData = await setDataService.getSetData(setId);
      const found = setData.items.find((item: IItem) => item.id === id);
      if (found) return found;
    } catch {}
  }
  return null;
},
```

- [ ] **Step 5: Replace hardcoded `[18, 16]` in `sets` resolver**

```typescript
// backend/src/resolvers.ts — replace sets resolver (lines 94-103)
sets: async () => {
  const allIds = await getAllSetIds();
  const sets: ISetData[] = [];
  for (const id of allIds) {
    try {
      const s = await setDataService.getSetData(id);
      sets.push(s);
    } catch {}
  }
  return sets;
},
```

- [ ] **Step 6: Replace hardcoded `[18, 16]` in `augment` resolver**

```typescript
// backend/src/resolvers.ts — replace augment resolver (lines 115-123)
augment: async (_: any, { id }: { id: string }) => {
  const allIds = await getAllSetIds();
  for (const setId of allIds) {
    try {
      const setData = await setDataService.getSetData(setId);
      const found = setData.augments.find((augment: any) => augment.id === id);
      if (found) return found;
    } catch {}
  }
  return null;
},
```

- [ ] **Step 7: Add `activeSet` resolver**

```typescript
// backend/src/resolvers.ts — add inside Query object (after augment resolver)
activeSet: async () => {
  return await setDataService.getSetData();
},
```

- [ ] **Step 8: Add guard to `createComposition`**

```typescript
// backend/src/resolvers.ts — replace createComposition (lines 190-192)
createComposition: async (_: any, { input }: { input: any }) => {
  const setData = await setDataService.getSetData(input.setId);
  if ((setData as any).status === 'archived') {
    throw new Error(`Cannot create compositions for archived set ${input.setId}`);
  }
  return compositionService.create(input);
},
```

- [ ] **Step 9: Add guard to `updateComposition`**

```typescript
// backend/src/resolvers.ts — replace updateComposition (lines 193-196)
updateComposition: async (_: any, { id, input }: { id: string, input: any }) => {
  const composition = await compositionService.getById(id);
  if (composition) {
    const setData = await setDataService.getSetData(composition.setId);
    if ((setData as any).status === 'archived') {
      throw new Error(`Cannot edit compositions for archived set ${composition.setId}`);
    }
  }
  const result = await compositionService.update(id, input);
  if (!result) throw new Error(`Composition with id ${id} not found`);
  return result;
},
```

- [ ] **Step 10: Run tests**

Run: `cd backend && npx vitest run`
Expected: All tests pass

- [ ] **Step 11: Commit**

```bash
git add backend/src/resolvers.ts
git commit -m "feat: add set status guards to mutations, replace hardcoded set lists with dynamic queries"
```

---

### Task 6: Server.ts — DB-Driven Default for Meta Refresh

**Files:**
- Modify: `backend/src/server.ts:52-53`

- [ ] **Step 1: Replace hardcoded default with DB-driven resolution**

```typescript
// backend/src/server.ts — replace lines 52-53
const metaService = container.resolve(MetaService);
const setDataService = container.resolve(SetDataService);
await setDataService.initialize();
const currentSetData = await setDataService.getSetData();
const currentSetId = currentSetData.setId;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat: use DB-driven active set for meta refresh scheduling"
```

---

### Task 7: PathResolver — Add File Archiving Methods

**Files:**
- Modify: `backend/src/services/_internal/PathResolver.ts`

- [ ] **Step 1: Add `getArchiveDir` method**

```typescript
// backend/src/services/_internal/PathResolver.ts — add after getItemSetPath (line 78)
getArchiveDir(): string {
  return path.join(process.cwd(), 'dragontail-archive');
}
```

- [ ] **Step 2: Add `archiveSetFiles` method**

```typescript
// backend/src/services/_internal/PathResolver.ts — add after getArchiveDir
archiveSetFiles(setId: number): { moved: string[]; errors: string[] } {
  const dragontailDir = this.findDragontailDir();
  if (!dragontailDir) {
    return { moved: [], errors: ['No dragontail directory found'] };
  }

  const archiveDir = path.join(this.getArchiveDir(), String(setId));
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const filesToMove = [
    this.getChampionSetPath(dragontailDir, setId),
    this.getTraitSetPath(dragontailDir, setId),
    this.getItemSetPath(dragontailDir, setId),
  ];

  const moved: string[] = [];
  const errors: string[] = [];

  for (const srcPath of filesToMove) {
    if (!fs.existsSync(srcPath)) {
      errors.push(`File not found: ${srcPath}`);
      continue;
    }
    const fileName = path.basename(srcPath);
    const destPath = path.join(archiveDir, fileName);
    try {
      fs.renameSync(srcPath, destPath);
      moved.push(fileName);
    } catch (err) {
      errors.push(`Failed to move ${fileName}: ${err}`);
    }
  }

  return { moved, errors };
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/_internal/PathResolver.ts
git commit -m "feat: add archiveSetFiles and getArchiveDir methods to PathResolver"
```

---

### Task 8: Migration Script

**Files:**
- Create: `backend/src/scripts/migrate-set.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Create the migration script**

```typescript
// backend/src/scripts/migrate-set.ts
import 'reflect-metadata';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { container } from '../services/container';
import { SetDataService } from '../services/SetDataService';
import { ImportService } from '../services/ImportService';
import { Repository } from '../services/_internal/Repository';
import { PathResolver } from '../services/_internal/PathResolver';
import { SetModel } from '../models/Set';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible_simple';

interface MigrationArgs {
  archiveSetId?: number;
  importSetId?: number;
}

function parseArgs(): MigrationArgs {
  const args = process.argv.slice(2);
  const result: MigrationArgs = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--archive' && args[i + 1]) {
      result.archiveSetId = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--import' && args[i + 1]) {
      result.importSetId = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (!result.archiveSetId && !result.importSetId) {
    console.error('Usage: npm run migrate:set -- --archive <setId> --import <setId>');
    console.error('  --archive <setId>   Archive the specified set (mark as archived, move files)');
    console.error('  --import <setId>    Import a new set from Dragontail files');
    process.exit(1);
  }

  return result;
}

async function main() {
  const args = parseArgs();

  console.log('=== TFT Set Migration ===');
  console.log(`Archive set: ${args.archiveSetId ?? '(none)'}`);
  console.log(`Import set:  ${args.importSetId ?? '(none)'}`);
  console.log('');

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  const repository = container.resolve(Repository);
  const importService = container.resolve(ImportService);
  const pathResolver = container.resolve(PathResolver);

  // Step 1: Archive current set
  if (args.archiveSetId) {
    console.log(`\n--- Archiving Set ${args.archiveSetId} ---`);

    const setDoc = await SetModel.findOne({ setId: args.archiveSetId });
    if (!setDoc) {
      console.error(`Set ${args.archiveSetId} not found in database`);
    } else {
      // Update status
      await SetModel.findOneAndUpdate(
        { setId: args.archiveSetId },
        { status: 'archived' }
      );
      console.log(`Set ${args.archiveSetId} marked as archived in database`);

      // Move Dragontail files
      const { moved, errors } = pathResolver.archiveSetFiles(args.archiveSetId);
      if (moved.length > 0) {
        console.log(`Moved ${moved.length} file(s) to archive: ${moved.join(', ')}`);
      }
      if (errors.length > 0) {
        console.warn(`Archive warnings: ${errors.join('; ')}`);
      }
    }
  }

  // Step 2: Import new set
  if (args.importSetId) {
    console.log(`\n--- Importing Set ${args.importSetId} ---`);

    try {
      const result = await importService.importSet(args.importSetId);
      console.log(`Imported: ${result.champions} champions, ${result.traits} traits, ${result.items} items`);

      // Mark new set as active
      await SetModel.findOneAndUpdate(
        { setId: args.importSetId },
        { status: 'active' }
      );
      console.log(`Set ${args.importSetId} marked as active`);
    } catch (error) {
      console.error(`Failed to import Set ${args.importSetId}:`, error);
      console.warn('Rolling back: deleting partially-imported set data');
      await SetModel.findOneAndDelete({ setId: args.importSetId });
    }
  }

  // Report
  console.log('\n--- Migration Summary ---');
  const allSets = await SetModel.find({}).sort({ setId: -1 }).lean();
  for (const set of allSets) {
    console.log(`  Set ${set.setId} (${(set as any).setName}): ${set.status || 'active'}`);
  }

  const activeSet = allSets.find((s: any) => s.status === 'active');
  if (activeSet) {
    console.log(`\nActive set: ${activeSet.setName} (Set ${activeSet.setId})`);
    console.log(`Recommended TFT_CURRENT_SET=${activeSet.setId}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add `migrate:set` script to package.json**

```json
// backend/package.json — add to "scripts"
"migrate:set": "ts-node src/scripts/migrate-set.ts"
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/scripts/migrate-set.ts backend/package.json
git commit -m "feat: add CLI migration script for set archival and import"
```

---

### Task 9: ImportService — Accept Status Parameter

**Files:**
- Modify: `backend/src/services/ImportService.ts:16-87`
- Modify: `backend/src/services/ImportService.test.ts`

- [ ] **Step 1: Add optional `status` parameter to `importSet`**

```typescript
// backend/src/services/ImportService.ts — modify method signature (line 16)
async importSet(
  setId: number,
  status: 'upcoming' | 'active' | 'archived' = 'active'
): Promise<{ champions: number; traits: number; items: number }> {
```

- [ ] **Step 2: Pass status to `saveSetData` call**

```typescript
// backend/src/services/ImportService.ts — modify saveSetData call (lines 77-84)
await this.repository.saveSetData(
  setId,
  `Set ${setId}`,
  champions.map((c: any) => c.id),
  traits.map((t: any) => t.key),
  items.map((i: any) => i.id),
  [],
  status
);
```

- [ ] **Step 3: Write test for status parameter**

```typescript
// backend/src/services/ImportService.test.ts — append
it('importSet should accept status parameter', () => {
  // Verify the method signature accepts status
  const service = new ImportService({} as any, {} as any);
  expect(typeof service.importSet).toBe('function');
  // The method accepts 2 args: setId and optional status
  expect(service.importSet.length).toBe(1); // Only 1 required param
});
```

- [ ] **Step 4: Run tests**

Run: `cd backend && npx vitest run src/services/ImportService.test.ts`
Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/ImportService.ts backend/src/services/ImportService.test.ts
git commit -m "feat: accept optional status parameter in ImportService.importSet"
```

---

### Task 10: Frontend GraphQL Queries — Add Status Field

**Files:**
- Modify: `frontend/src/lib/graphql.ts:146-247`
- Modify: `frontend/src/lib/api.ts:140-240, 537-545`

- [ ] **Step 1: Add `status` to `GET_SETS` query**

```graphql
// frontend/src/lib/graphql.ts — modify GET_SETS (lines 146-195)
// Add "status" after "setName" in the query
query GetSets {
  sets {
    setId
    setName
    status
    champions { ... }
    traits { ... }
    items { ... }
    augments { ... }
  }
}
```

- [ ] **Step 2: Add `status` to `GET_SET` query**

```graphql
// frontend/src/lib/graphql.ts — modify GET_SET (lines 198-247)
// Add "status" after "setName" in the query
query GetSet($setId: Int!) {
  set(setId: $setId) {
    setId
    setName
    status
    champions { ... }
    traits { ... }
    items { ... }
    augments { ... }
  }
}
```

- [ ] **Step 3: Add `GET_ACTIVE_SET` query**

```graphql
// frontend/src/lib/graphql.ts — add after GET_SET
export const GET_ACTIVE_SET = gql`
  query GetActiveSet {
    activeSet {
      setId
      setName
      status
      champions {
        id
        name
        cost
        traits
        imageUrl
        stats {
          hp
          mana
          damage
        }
      }
    }
  }
`;
```

- [ ] **Step 4: Update `SetData` type in api.ts**

```typescript
// frontend/src/lib/api.ts — modify SetData interface (lines 537-545)
export interface SetData {
  setId: number;
  setName: string;
  status: 'upcoming' | 'active' | 'archived';
  champions: Champion[];
  traits: Trait[];
  items: Item[];
  augments: Augment[];
  mechanics?: string;
}
```

- [ ] **Step 5: Add same queries to api.ts**

Mirror the changes from graphql.ts to api.ts (add `status` to `GET_SETS` and `GET_SET`, add `GET_ACTIVE_SET`).

- [ ] **Step 6: Add `getActiveSet` API method**

```typescript
// frontend/src/lib/api.ts — add inside api object
getActiveSet: async () => {
  try {
    const response = await apolloClient.query({
      query: GET_ACTIVE_SET,
      errorPolicy: 'all',
    });
    return response;
  } catch (error: any) {
    console.error('GraphQL Error - getActiveSet:', error.message || error);
    throw error;
  }
},
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/graphql.ts frontend/src/lib/api.ts
git commit -m "feat: add status field to frontend GraphQL queries and SetData type"
```

---

### Task 11: Sets Store — Add Active Set State

**Files:**
- Modify: `frontend/src/stores/setsStore.ts`

- [ ] **Step 1: Add `activeSet` state and `fetchActiveSet` action**

```typescript
// frontend/src/stores/setsStore.ts — replace entire file
import { create } from 'zustand';
import { api, SetData } from '../lib/api';

interface SetsState {
  sets: SetData[];
  activeSet: SetData | null;
  loading: boolean;
  error: string | null;
  fetchSets: () => Promise<void>;
  fetchActiveSet: () => Promise<void>;
}

export const useSetsStore = create<SetsState>((set) => ({
  sets: [],
  activeSet: null,
  loading: false,
  error: null,

  fetchSets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getSets();
      set({ sets: response.data.sets, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch sets' });
    }
  },

  fetchActiveSet: async () => {
    try {
      const response = await api.getActiveSet();
      set({ activeSet: response.data.activeSet });
    } catch (error: any) {
      console.warn('Failed to fetch active set:', error.message);
    }
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/stores/setsStore.ts
git commit -m "feat: add activeSet state to setsStore"
```

---

### Task 12: Layout — Filter Archived Sets from Navigation

**Files:**
- Modify: `frontend/src/components/Layout.tsx:28-38`

- [ ] **Step 1: Filter out archived sets from nav items**

```typescript
// frontend/src/components/Layout.tsx — replace lines 31-38
if (sets && sets.length > 0) {
  const activeSets = sets.filter(set => set.status !== 'archived');
  const setNavItems = activeSets.map(set => ({
    path: `/sets/${set.setId}`,
    label: set.setName,
    icon: Book
  }))
  navItems.push(...setNavItems)
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: filter archived sets from sidebar navigation"
```

---

### Task 13: SetDetail — Render Archived Sets with Distinct UI

**Files:**
- Modify: `frontend/src/pages/SetDetail.tsx`

- [ ] **Step 1: Read `status` from query data and conditionally render**

```typescript
// frontend/src/pages/SetDetail.tsx — replace the entire return block
const SetDetail = () => {
  const { setId } = useParams<{ setId: string }>();
  const setIdNum = parseInt(setId || '0', 10);
  const isArchived = data?.set?.status === 'archived';

  const { loading, error, data } = useQuery(GET_SET, {
    variables: { setId: setIdNum },
    errorPolicy: 'all'
  });

  if (loading) return <div className="text-center py-10">Loading set data...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  if (!data || !data.set) return <div className="text-center py-10">Set not found</div>;

  const { set } = data;
  const archived = set.status === 'archived';

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${archived ? 'opacity-75' : ''}`}>
      {/* Archived Banner */}
      {archived && (
        <div
          className="mb-6 p-4 rounded-lg text-center font-mono text-sm"
          style={{
            background: 'var(--bg-accent)',
            border: '1px solid var(--text-secondary)',
            color: 'var(--text-secondary)'
          }}
        >
          Archived — Read Only
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-primary)' }}>
        {set.setName} (Set {set.setId})
        {archived && (
          <span className="ml-3 text-sm font-normal px-2 py-1 rounded" style={{
            background: 'var(--bg-accent)',
            color: 'var(--text-secondary)'
          }}>
            Archived
          </span>
        )}
      </h1>

      {/* Champions Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Champions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {set.champions?.map((champion: any) => (
            <div
              key={champion.id}
              className="p-4 rounded-lg border transition-all duration-300 hover:scale-105"
              style={{
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {champion.iconUrl && (
                <img
                  src={champion.iconUrl}
                  alt={champion.name}
                  className="w-16 h-16 mx-auto mb-2 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                  }}
                />
              )}
              <h3 className="font-medium text-center">{champion.name}</h3>
              <p className="text-sm text-center opacity-75">Cost: {champion.cost}</p>
              <div className="mt-2 text-xs">
                {champion.traits?.slice(0, 2).map((trait: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-block mr-1 px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: 'var(--bg-accent)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Traits Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Traits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {set.traits?.map((trait: any) => (
            <div
              key={trait.key}
              className="p-4 rounded-lg border"
              style={{
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <h3 className="font-semibold text-lg mb-2">{trait.name || trait.key}</h3>
              <p className="text-sm mb-3 opacity-90">{trait.description}</p>
              <div className="text-sm">
                <h4 className="font-medium mb-2" style={{ color: 'var(--accent1)' }}>Breakpoints:</h4>
                <ul className="space-y-1">
                  {trait.breakpoints?.map((breakpoint: any, idx: number) => (
                    <li key={idx} className="flex justify-between">
                      <span>{breakpoint.count} units:</span>
                      <span className="font-mono">{breakpoint.bonus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Items Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Items</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {set.items?.map((item: any) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border text-center"
              style={{
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 mx-auto mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                  }}
                />
              )}
              <h3 className="text-sm font-medium">{item.name}</h3>
              <p className="text-xs opacity-75 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Augments Section */}
      {set.augments && set.augments.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Augments</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {set.augments.map((augment: any) => (
              <div
                key={augment.id}
                className="p-3 rounded-lg border text-center"
                style={{
                  border: '1px solid var(--bg-accent)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                {augment.imageUrl && (
                  <img
                    src={augment.imageUrl}
                    alt={augment.name}
                    className="w-12 h-12 mx-auto mb-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <h3 className="text-sm font-medium">{augment.name}</h3>
                <p className="text-xs opacity-75 mt-1">{augment.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SetDetail;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/SetDetail.tsx
git commit -m "feat: render archived sets with muted styling and read-only banner"
```

---

### Task 14: Migrate Existing Data

**Files:**
- None (database operation)

- [ ] **Step 1: Run a one-time migration to set statuses on existing sets**

```bash
# Connect to MongoDB and update existing sets
cd backend && npx ts-node -e "
import 'reflect-metadata';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible_simple');
  const { SetModel } = require('./src/models/Set');

  // Mark Set 16 as archived
  await SetModel.findOneAndUpdate({ setId: 16 }, { status: 'archived' });
  console.log('Set 16 marked as archived');

  // Mark Set 18 as active
  await SetModel.findOneAndUpdate({ setId: 18 }, { status: 'active' });
  console.log('Set 18 marked as active');

  // Verify
  const sets = await SetModel.find({}).lean();
  for (const s of sets) {
    console.log('Set', s.setId, ':', s.status);
  }

  await mongoose.disconnect();
}
migrate();
"
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: migrate existing sets to use status field"
```

---

### Task 15: Full Test Run and Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Build backend to verify TypeScript compilation**

Run: `cd backend && npm run build`
Expected: No TypeScript errors

- [ ] **Step 3: Build frontend to verify TypeScript compilation**

Run: `cd frontend && npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues from set archival changes"
```
