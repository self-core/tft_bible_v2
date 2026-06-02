# Composition Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move composition storage from in-memory array to MongoDB via a dedicated CompositionService.

**Architecture:** CompositionModel (Mongoose) → CompositionService (CRUD) → resolvers.ts. Follows the same pattern as SetDataService/Repository for the set data domain, but as a standalone service since user-generated content is a different domain.

**Tech Stack:** Node.js + TypeScript + Mongoose, Apollo Server + Express, vitest

---

### Task 1: Create Composition Mongoose Model

**Files:**
- Create: `backend/src/models/Composition.ts`
- Test: `backend/src/models/Composition.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { CompositionModel, ICompositionDocument } from './Composition';

describe('CompositionModel', () => {
  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI);
    } catch {
      console.warn('MongoDB not available, skipping model tests');
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch {}
  });

  it('should create and retrieve a composition', async () => {
    const doc = await CompositionModel.create({
      id: 'test-comp',
      title: 'Test Comp',
      description: 'A test composition',
      setId: 16,
      championIds: ['TFT16_Ahri', 'TFT16_Jinx'],
      traitBonuses: ['Arcane: 2'],
      augmentRecommendations: ['backfoot'],
      difficulty: 'Intermediate',
      region: 'Runeterra',
    });
    expect(doc.id).toBe('test-comp');
    expect(doc.title).toBe('Test Comp');
    expect(doc.createdAt).toBeDefined();
  });

  it('should save units with position, starLevel, and items', async () => {
    const doc = await CompositionModel.create({
      id: 'comp-with-units',
      title: 'Comp With Units',
      description: 'Has full board state',
      setId: 16,
      championIds: ['TFT16_Ahri'],
      units: [
        { championId: 'TFT16_Ahri', position: { row: 2, col: 3 }, starLevel: 2, items: ['TFT16_BFSword'] },
      ],
      traitBonuses: [],
      augmentRecommendations: [],
      difficulty: 'Beginner',
      region: 'Runeterra',
    });
    expect(doc.units).toHaveLength(1);
    expect(doc.units![0].position.row).toBe(2);
    expect(doc.units![0].starLevel).toBe(2);
  });

  it('should enforce unique id', async () => {
    await CompositionModel.create({
      id: 'dup-id', title: 'First', description: '', setId: 16,
      championIds: [], traitBonuses: [], augmentRecommendations: [],
      difficulty: '', region: '',
    });
    await expect(CompositionModel.create({
      id: 'dup-id', title: 'Second', description: '', setId: 16,
      championIds: [], traitBonuses: [], augmentRecommendations: [],
      difficulty: '', region: '',
    })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/models/Composition.test.ts`
Expected: FAIL — model not defined

- [ ] **Step 3: Write minimal implementation**

```typescript
import mongoose, { Schema } from 'mongoose';

export interface IBoardUnit {
  championId: string;
  position: { row: number; col: number };
  starLevel: number;
  items: string[];
}

export interface ICompositionDocument extends mongoose.Document {
  id: string;
  title: string;
  description: string;
  setId: number;
  championIds: string[];
  units?: IBoardUnit[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

const boardUnitSchema = new Schema<IBoardUnit>({
  championId: { type: String, required: true },
  position: {
    row: { type: Number, required: true },
    col: { type: Number, required: true },
  },
  starLevel: { type: Number, required: true },
  items: [{ type: String }],
}, { _id: false });

const compositionSchema = new Schema<ICompositionDocument>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  setId: { type: Number, required: true },
  championIds: [{ type: String }],
  units: [boardUnitSchema],
  traitBonuses: [{ type: String }],
  augmentRecommendations: [{ type: String }],
  difficulty: { type: String, required: true },
  region: { type: String, required: true },
}, {
  timestamps: true,
});

export const CompositionModel = mongoose.model<ICompositionDocument>('Composition', compositionSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/models/Composition.test.ts`
Expected: PASS — all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/Composition.ts backend/src/models/Composition.test.ts
git commit -m "feat: add Composition Mongoose model"
```

---

### Task 2: Update TypeScript Interfaces

**Files:**
- Modify: `backend/src/interfaces.ts` — add IBoardUnit, update IComposition with optional units and timestamps

- [ ] **Step 1: Update interfaces**

Add before `IComposition`:

```typescript
export interface IBoardUnit {
  championId: string;
  position: { row: number; col: number };
  starLevel: number;
  items: string[];
}
```

Add `units?` and timestamps to `IComposition`:

```typescript
export interface IComposition {
  id: string;
  title: string;
  description: string;
  setId: number;
  championIds: string[];
  units?: IBoardUnit[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
  createdAt?: string;
  updatedAt?: string;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no output (compiles clean)

- [ ] **Step 3: Commit**

```bash
git add backend/src/interfaces.ts
git commit -m "feat: add IBoardUnit, extend IComposition with units and timestamps"
```

---

### Task 3: Create CompositionService

**Files:**
- Create: `backend/src/services/CompositionService.ts`
- Create: `backend/src/services/CompositionService.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { CompositionService } from './CompositionService';

describe('CompositionService', () => {
  let service: CompositionService;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI);
    } catch {
      console.warn('MongoDB not available');
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch {}
  });

  beforeEach(async () => {
    service = new CompositionService();
    try {
      await mongoose.connection.db?.dropCollection('compositions');
    } catch {}
  });

  it('should create and retrieve by id', async () => {
    const created = await service.create({
      title: 'My Comp',
      description: 'Desc',
      setId: 16,
      championIds: ['TFT16_Ahri'],
      traitBonuses: ['Arcane: 2'],
      augmentRecommendations: [],
      difficulty: 'Beginner',
      region: 'Runeterra',
    });
    expect(created.id).toBe('my-comp');
    expect(created.title).toBe('My Comp');

    const found = await service.getById('my-comp');
    expect(found).not.toBeNull();
    expect(found!.title).toBe('My Comp');
  });

  it('should return null for non-existent id', async () => {
    const found = await service.getById('nonexistent');
    expect(found).toBeNull();
  });

  it('should return all compositions', async () => {
    await service.create({ title: 'Comp A', description: '', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: '', region: '' });
    await service.create({ title: 'Comp B', description: '', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: '', region: '' });
    const all = await service.getAll();
    expect(all).toHaveLength(2);
  });

  it('should filter by setId', async () => {
    await service.create({ title: 'Set16 Comp', description: '', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: '', region: '' });
    await service.create({ title: 'Set17 Comp', description: '', setId: 17, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: '', region: '' });
    const set16 = await service.getBySet(16);
    expect(set16).toHaveLength(1);
    expect(set16[0].title).toBe('Set16 Comp');
  });

  it('should update a composition', async () => {
    await service.create({ title: 'Original', description: '', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: '', region: '' });
    const updated = await service.update('original', { title: 'Updated' });
    expect(updated!.title).toBe('Updated');
  });

  it('should delete a composition', async () => {
    await service.create({ title: 'To Delete', description: '', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: '', region: '' });
    const deleted = await service.delete('to-delete');
    expect(deleted).toBe(true);
    const found = await service.getById('to-delete');
    expect(found).toBeNull();
  });

  it('should delete return false for non-existent', async () => {
    const deleted = await service.delete('nonexistent');
    expect(deleted).toBe(false);
  });

  it('should search by title', async () => {
    await service.create({ title: 'Hyper Carry', description: 'Strong comp', setId: 16, championIds: [], traitBonuses: ['Gunner: 4'], augmentRecommendations: [], difficulty: '', region: '' });
    await service.create({ title: 'Sorcerer Control', description: 'Mana comp', setId: 16, championIds: [], traitBonuses: ['Sorcerer: 4'], augmentRecommendations: [], difficulty: '', region: '' });
    const results = await service.search('hyper');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Hyper Carry');
  });

  it('should search by description and traitBonuses', async () => {
    await service.create({ title: 'A', description: 'arcane power', setId: 16, championIds: [], traitBonuses: ['Arcane: 2'], augmentRecommendations: [], difficulty: '', region: '' });
    const byDesc = await service.search('arcane');
    expect(byDesc.length).toBeGreaterThanOrEqual(1);
  });

  it('should create composition with units', async () => {
    const created = await service.create({
      title: 'Precise Comp',
      description: '',
      setId: 16,
      championIds: ['TFT16_Ahri'],
      units: [{ championId: 'TFT16_Ahri', position: { row: 2, col: 3 }, starLevel: 2, items: ['TFT16_BFSword'] }],
      traitBonuses: [],
      augmentRecommendations: [],
      difficulty: '',
      region: '',
    });
    expect(created.units).toHaveLength(1);
    expect(created.units![0].starLevel).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/CompositionService.test.ts`
Expected: FAIL — service not defined

- [ ] **Step 3: Write minimal implementation**

```typescript
import { CompositionModel } from '../models/Composition';
import { IComposition, IBoardUnit } from '../interfaces';

interface CreateCompositionInput {
  title: string;
  description: string;
  setId: number;
  championIds: string[];
  units?: IBoardUnit[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
}

type UpdateCompositionInput = Partial<CreateCompositionInput>;

export class CompositionService {
  async getAll(): Promise<IComposition[]> {
    const docs = await CompositionModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(this.toInterface);
  }

  async getById(id: string): Promise<IComposition | null> {
    const doc = await CompositionModel.findOne({ id }).lean();
    return doc ? this.toInterface(doc) : null;
  }

  async getBySet(setId: number): Promise<IComposition[]> {
    const docs = await CompositionModel.find({ setId }).sort({ createdAt: -1 }).lean();
    return docs.map(this.toInterface);
  }

  async create(input: CreateCompositionInput): Promise<IComposition> {
    const id = input.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const doc = await CompositionModel.create({ ...input, id });
    return this.toInterface(doc.toObject());
  }

  async update(id: string, input: UpdateCompositionInput): Promise<IComposition | null> {
    const doc = await CompositionModel.findOneAndUpdate(
      { id },
      { $set: input },
      { new: true }
    ).lean();
    return doc ? this.toInterface(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await CompositionModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async search(term: string): Promise<IComposition[]> {
    const regex = new RegExp(term, 'i');
    const docs = await CompositionModel.find({
      $or: [
        { title: regex },
        { description: regex },
        { traitBonuses: regex },
      ],
    }).sort({ createdAt: -1 }).lean();
    return docs.map(this.toInterface);
  }

  private toInterface(doc: any): IComposition {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      setId: doc.setId,
      championIds: doc.championIds || [],
      units: doc.units || undefined,
      traitBonuses: doc.traitBonuses || [],
      augmentRecommendations: doc.augmentRecommendations || [],
      difficulty: doc.difficulty,
      region: doc.region,
      createdAt: doc.createdAt?.toISOString?.(),
      updatedAt: doc.updatedAt?.toISOString?.(),
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/CompositionService.test.ts`
Expected: PASS — all tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/CompositionService.ts backend/src/services/CompositionService.test.ts
git commit -m "feat: add CompositionService with CRUD and search"
```

---

### Task 4: Update GraphQL Schema

**Files:**
- Modify: `backend/src/schema.ts` — add BoardUnit types, units field on Composition, update inputs

- [ ] **Step 1: Add BoardUnit types and update composition schema**

Add these types before the `input CreateCompositionInput`:

```graphql
type Position {
  row: Int!
  col: Int!
}

type BoardUnit {
  championId: String!
  position: Position!
  starLevel: Int!
  items: [String!]!
}

input PositionInput {
  row: Int!
  col: Int!
}

input BoardUnitInput {
  championId: String!
  position: PositionInput!
  starLevel: Int!
  items: [String!]!
}
```

Update `CreateCompositionInput`:

```graphql
input CreateCompositionInput {
  title: String!
  description: String!
  setId: Int!
  championIds: [String!]!
  units: [BoardUnitInput!]
  traitBonuses: [String!]!
  augmentRecommendations: [String!]!
  difficulty: String
  region: String
}
```

Update `UpdateCompositionInput` — add optional `units`:

```graphql
input UpdateCompositionInput {
  title: String
  description: String
  setId: Int
  championIds: [String!]
  units: [BoardUnitInput!]
  traitBonuses: [String!]
  augmentRecommendations: [String!]
  difficulty: String
  region: String
}
```

Update `Composition` type — add `units` and timestamps:

```graphql
type Composition {
  id: ID!
  title: String!
  description: String!
  setId: Int!
  championIds: [String!]!
  units: [BoardUnit!]
  traitBonuses: [String!]!
  augmentRecommendations: [String!]!
  difficulty: String
  region: String
  createdAt: String
  updatedAt: String
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add backend/src/schema.ts
git commit -m "feat: add BoardUnit types to GraphQL schema"
```

---

### Task 5: Wire CompositionService into Resolvers

**Files:**
- Modify: `backend/src/resolvers.ts` — replace in-memory composition array with CompositionService calls

- [ ] **Step 1: Update resolvers**

Add import at top:
```typescript
import { CompositionService } from './services/CompositionService';
```

Add after `setDataService.initialize()`:
```typescript
const compositionService = new CompositionService();
```

Delete the in-memory `compositions: IComposition[]` array (lines 13-47).

Replace the composition Query resolvers:

```typescript
compositions: () => compositionService.getAll(),
compositionsBySet: (_: any, { setId }: { setId: number }) => {
  return compositionService.getBySet(setId);
},
composition: (_: any, { id }: { id: string }) => compositionService.getById(id),
```

Replace the `search` resolver's composition filtering:
```typescript
compositions: await compositionService.search(term),
```

Replace the Mutation resolvers:

```typescript
createComposition: async (_: any, { input }: { input: CreateCompositionInput }) => {
  return compositionService.create(input);
},
updateComposition: async (_: any, { id, input }: { id: string, input: Partial<CreateCompositionInput> }) => {
  const result = await compositionService.update(id, input);
  if (!result) throw new Error(`Composition with id ${id} not found`);
  return result;
},
deleteComposition: async (_: any, { id }: { id: string }) => {
  return compositionService.delete(id);
},
```

Note: Import `CreateCompositionInput` type — it's defined in `../interfaces` now, but actually it's a GraphQL input type, not a TS type. The resolver receives the raw object from GraphQL, and `CompositionService.create` accepts `CreateCompositionInput` (the TS interface defined in the service file). Use inline typing or import the type.

- [ ] **Step 2: Build to verify**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/src/resolvers.ts
git commit -m "feat: wire CompositionService into resolvers, remove in-memory array"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL tests pass

- [ ] **Step 2: Run full type check**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Verify lint if configured**

Run: check `package.json` for lint script, run if present
Expected: clean
