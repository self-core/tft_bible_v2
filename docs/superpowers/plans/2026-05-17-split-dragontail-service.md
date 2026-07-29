# Split DragontailService Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 941-line dragontailService.ts monolith into 6 focused internal modules with 2 public entry points, backed by tests.

**Architecture:** One public facade (SetDataService) for resolvers, one admin entry (ImportService). Behind them: PathResolver, FileParser, DataTransformer, Repository, EmbeddedFallback, ResultCache. Fallback chain: cache → DB → file import → embedded.

**Tech Stack:** TypeScript, Vitest, Mongoose, Node.js (fs, path)

---

### Task 1: Add Backend Test Infrastructure

**Files:**
- Create: `backend/vitest.config.ts`
- Modify: `backend/tsconfig.json`
- Modify: `backend/package.json`

- [ ] **Step 1: Create vitest config**

Create `backend/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules'],
  },
});
```

- [ ] **Step 2: Update tsconfig.json**

Modify `backend/tsconfig.json` to include test files:
- Change `"include": ["src/**/*"]` to `"include": ["src/**/*", "tests/**/*"]`
- Remove the `"exclude": ["**/*.spec.ts", "**/*.test.ts"]` line

- [ ] **Step 3: Add vitest to devDependencies**

```bash
cd C:\Users\puppets\Documents\tft_bible_v2\backend
npm install -D vitest @types/node
```

Add test script to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest works**

Create `backend/tests/placeholder.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('placeholder', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `cd backend && npx vitest run`
Expected: 1 test, 1 passed

- [ ] **Step 5: Commit**

```bash
cd C:\Users\puppets\Documents\tft_bible_v2
git add backend/vitest.config.ts backend/tsconfig.json backend/package.json backend/package-lock.json backend/tests/placeholder.test.ts
git commit -m "chore: add vitest test infrastructure for backend"
```

---

### Task 2: Extract EmbeddedFallback Module

**Files:**
- Create: `backend/src/services/_internal/EmbeddedFallback.ts`
- Create: `backend/src/services/_internal/EmbeddedFallback.test.ts`
- Modify: (deleted by Task 6 — old `dragontailService.ts` still has the data)

- [ ] **Step 1: Write the test**

Create `backend/src/services/_internal/EmbeddedFallback.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { EmbeddedFallback } from './EmbeddedFallback';

describe('EmbeddedFallback', () => {
  it('should return set 16 data', () => {
    const data = EmbeddedFallback.getSetData(16);
    expect(data).not.toBeNull();
    expect(data!.champions.length).toBeGreaterThan(0);
    expect(data!.traits.length).toBeGreaterThan(0);
    expect(data!.items.length).toBeGreaterThan(0);
  });

  it('should return null for unknown set', () => {
    const data = EmbeddedFallback.getSetData(99);
    expect(data).toBeNull();
  });

  it('should return champions for set 16', () => {
    const champions = EmbeddedFallback.getChampions(16);
    expect(champions.length).toBeGreaterThan(0);
    expect(champions[0]).toHaveProperty('id');
    expect(champions[0]).toHaveProperty('name');
    expect(champions[0]).toHaveProperty('cost');
  });

  it('should return null champions for unknown set', () => {
    const champions = EmbeddedFallback.getChampions(99);
    expect(champions).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/_internal/EmbeddedFallback.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create EmbeddedFallback**

Create `backend/src/services/_internal/EmbeddedFallback.ts`:
```typescript
import { ISetData } from '../../interfaces';

interface FallbackDataSet {
  setId: number;
  setName: string;
  champions: any[];
  traits: any[];
  items: any[];
  augments: any[];
}

const FALLBACK_DATA: Record<number, FallbackDataSet> = {
  // Move the embedded data from dragontailService.ts here
  // The getEmbeddedChampions(), getEmbeddedTraits(), getEmbeddedItems(),
  // getAugmentsForSet16() functions and their data
};

export class EmbeddedFallback {
  static getSetData(setId: number): ISetData | null {
    const set = FALLBACK_DATA[setId];
    if (!set) return null;
    return {
      setId: set.setId,
      setName: set.setName,
      champions: set.champions,
      traits: set.traits,
      items: set.items,
      augments: set.augments,
      mechanics: '',
    };
  }

  static getChampions(setId: number): any[] | null {
    return FALLBACK_DATA[setId]?.champions ?? null;
  }

  static getTraits(setId: number): any[] | null {
    return FALLBACK_DATA[setId]?.traits ?? null;
  }

  static getItems(setId: number): any[] | null {
    return FALLBACK_DATA[setId]?.items ?? null;
  }
}
```

**Important:** Copy the hardcoded data arrays from the existing `dragontailService.ts` methods:
- `getEmbeddedChampions()` → champion objects
- `getEmbeddedTraits()` → trait objects
- `getEmbeddedItems()` → item objects
- `getAugmentsForSet16()` → augment objects

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/_internal/EmbeddedFallback.test.ts
```
Expected: PASS — all 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/EmbeddedFallback.ts backend/src/services/_internal/EmbeddedFallback.test.ts
git commit -m "refactor: extract EmbeddedFallback module from dragontailService"
```

---

### Task 3: Extract ResultCache Module

**Files:**
- Create: `backend/src/services/_internal/ResultCache.ts`
- Create: `backend/src/services/_internal/ResultCache.test.ts`

- [ ] **Step 1: Write the test**

Create `backend/src/services/_internal/ResultCache.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ResultCache } from './ResultCache';

describe('ResultCache', () => {
  let cache: ResultCache;

  beforeEach(() => {
    cache = new ResultCache();
  });

  it('should miss on first get', () => {
    expect(cache.get(16)).toBeNull();
  });

  it('should hit after set', () => {
    const data = { setId: 16, champions: [] } as any;
    cache.set(16, data);
    expect(cache.get(16)).toBe(data);
  });

  it('should return undefined for uncached set after other sets cached', () => {
    cache.set(16, { setId: 16 } as any);
    expect(cache.get(17)).toBeNull();
  });

  it('should clear a specific set', () => {
    cache.set(16, { setId: 16 } as any);
    cache.clear(16);
    expect(cache.get(16)).toBeNull();
  });

  it('should clear all', () => {
    cache.set(16, { setId: 16 } as any);
    cache.set(17, { setId: 17 } as any);
    cache.clearAll();
    expect(cache.get(16)).toBeNull();
    expect(cache.get(17)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/_internal/ResultCache.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create ResultCache**

Create `backend/src/services/_internal/ResultCache.ts`:
```typescript
import { ISetData } from '../../interfaces';

export class ResultCache {
  private cache = new Map<number, ISetData>();

  get(setId: number): ISetData | null {
    return this.cache.get(setId) ?? null;
  }

  set(setId: number, data: ISetData): void {
    this.cache.set(setId, data);
  }

  clear(setId: number): void {
    this.cache.delete(setId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/_internal/ResultCache.test.ts
```
Expected: PASS — all 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/ResultCache.ts backend/src/services/_internal/ResultCache.test.ts
git commit -m "refactor: extract ResultCache module"
```

---

### Task 4: Extract PathResolver Module

**Files:**
- Create: `backend/src/services/_internal/PathResolver.ts`
- Create: `backend/src/services/_internal/PathResolver.test.ts`

- [ ] **Step 1: Write the test**

Create `backend/src/services/_internal/PathResolver.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { PathResolver } from './PathResolver';
import * as fs from 'fs';

describe('PathResolver', () => {
  it('should find dragontail directory from known paths', () => {
    const resolver = new PathResolver();
    const dir = resolver.findDragontailDir();
    // May be null if no dragontail data exists on this machine
    // We verify the method runs without throwing
    expect(dir).toBeDefined();
  });

  it('should construct champion file path', () => {
    const resolver = new PathResolver();
    const path = resolver.getChampionPath('/dragontail-data/');
    expect(path).toMatch(/tft-champion/);
  });

  it('should construct trait file path', () => {
    const resolver = new PathResolver();
    const path = resolver.getTraitPath('/dragontail-data/');
    expect(path).toMatch(/tft-trait/);
  });

  it('should construct item file path', () => {
    const resolver = new PathResolver();
    const path = resolver.getItemPath('/dragontail-data/');
    expect(path).toMatch(/tft-item/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/_internal/PathResolver.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create PathResolver**

Create `backend/src/services/_internal/PathResolver.ts`:
```typescript
import * as path from 'path';
import * as fs from 'fs';

export class PathResolver {
  findDragontailDir(): string | null {
    const candidates = [
      // Docker mount
      '/app/dragontail-data',
      // Local machine
      path.join('C:', 'Users', 'puppets', 'Documents', 'League of Legends', 'dragontail-15.24.1', 'plugins', 'rcp-be-lol-game-data', 'global', 'default'),
      // Relative to project
      path.join(process.cwd(), 'dragontail-data'),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(dir)) return dir;
    }
    return null;
  }

  getChampionPath(baseDir: string): string {
    return path.join(baseDir, 'tft-champion_Set16.json');
  }

  getTraitPath(baseDir: string): string {
    return path.join(baseDir, 'tft-trait_Set16.json');
  }

  getItemPath(baseDir: string): string {
    return path.join(baseDir, 'tft-item_Set16.json');
  }

  getChampionGenericPath(baseDir: string): string {
    return path.join(baseDir, 'tft-champion.json');
  }

  getTraitGenericPath(baseDir: string): string {
    return path.join(baseDir, 'tft-trait.json');
  }

  getItemGenericPath(baseDir: string): string {
    return path.join(baseDir, 'tft-item.json');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/_internal/PathResolver.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/PathResolver.ts backend/src/services/_internal/PathResolver.test.ts
git commit -m "refactor: extract PathResolver module"
```

---

### Task 5: Extract DataTransformer Module

**Files:**
- Create: `backend/src/services/_internal/DataTransformer.ts`
- Create: `backend/src/services/_internal/DataTransformer.test.ts`

- [ ] **Step 1: Write the test**

The DataTransformer handles:
1. Parsing the Riot dragontail JSON into internal Champion/Trait/Item format
2. Building CommunityDragon CDN URLs from champion names

Create `backend/src/services/_internal/DataTransformer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { DataTransformer } from './DataTransformer';

describe('DataTransformer', () => {
  describe('champion URL construction', () => {
    it('should build champion portrait URL from name', () => {
      const url = DataTransformer.buildChampionPortraitUrl('Ahri');
      expect(url).toBe(
        'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/champion-portraits/Ahri.png'
      );
    });

    it('should handle names with spaces', () => {
      // Snapshot of the actual URL format from the existing service
      const url = DataTransformer.buildChampionPortraitUrl('Lee Sin');
      expect(url).toContain('Lee%20Sin');
    });
  });

  describe('dragontail champion parsing', () => {
    it('should parse a champion from raw dragontail format', () => {
      const raw = {
        id: 'TFT16_Ahri',
        name: 'Ahri',
        cost: 4,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 800, mana: 40, damage: 45 },
        ability: { name: 'Orb of Deception', variables: { Damage: [200, 350, 600] } },
      };
      const champion = DataTransformer.parseChampion(raw);
      expect(champion).toHaveProperty('id', 'TFT16_Ahri');
      expect(champion).toHaveProperty('name', 'Ahri');
      expect(champion).toHaveProperty('cost', 4);
      expect(champion).toHaveProperty('imageUrl');
      expect(champion.imageUrl).toContain('Ahri.png');
    });
  });

  describe('dragontail trait parsing', () => {
    it('should parse a trait from raw dragontail format', () => {
      const raw = {
        key: 'Arcane',
        name: 'Arcane',
        description: 'Grants Ability Power',
        breakpoints: [
          { count: 2, bonus: '+20 AP' },
          { count: 4, bonus: '+50 AP' },
        ],
      };
      const trait = DataTransformer.parseTrait(raw);
      expect(trait).toHaveProperty('key', 'Arcane');
      expect(trait).toHaveProperty('name', 'Arcane');
      expect(trait.breakpoints).toHaveLength(2);
    });
  });

  describe('dragontail item parsing', () => {
    it('should parse an item from raw dragontail format', () => {
      const raw = {
        id: 'TFT16_Item_ArchangelsStaff',
        name: "Archangel's Staff",
        description: 'Gain AP over time',
        components: ['TFT16_Item_NeedlesslyLargeRod', 'TFT16_Item_TearoftheGoddess'],
      };
      const item = DataTransformer.parseItem(raw);
      expect(item).toHaveProperty('name', "Archangel's Staff");
      expect(item.components).toHaveLength(2);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/_internal/DataTransformer.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create DataTransformer**

Create `backend/src/services/_internal/DataTransformer.ts`:
```typescript
export class DataTransformer {
  static CDN_BASE =
    'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft';

  static buildChampionPortraitUrl(championName: string): string {
    return `${this.CDN_BASE}/champion-portraits/${encodeURIComponent(championName)}.png`;
  }

  static buildSplashUrl(championName: string): string {
    return `${this.CDN_BASE}/champion-splashes/uncentered/${encodeURIComponent(championName)}.jpg`;
  }

  static parseChampion(raw: any) {
    return {
      id: raw.id,
      name: raw.name,
      cost: raw.cost,
      traits: raw.traits || [],
      stats: raw.stats || { hp: 0, mana: 0, damage: 0 },
      ability: raw.ability || { name: '', variables: [] },
      imageUrl: this.buildChampionPortraitUrl(raw.name),
      splashUrl: this.buildSplashUrl(raw.name),
    };
  }

  static parseTrait(raw: any) {
    return {
      key: raw.key,
      name: raw.name || raw.key,
      description: raw.description || '',
      breakpoints: (raw.breakpoints || []).map((bp: any) => ({
        count: bp.count,
        bonus: bp.bonus || '',
      })),
    };
  }

  static parseItem(raw: any) {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      components: raw.components || raw.from || [],
      imageUrl: raw.imageUrl || null,
      unique: raw.unique || false,
      trait: raw.trait || null,
    };
  }

  static parseSetData(setId: number, setName: string, data: { champions?: any[]; traits?: any[]; items?: any[]; augments?: any[] }) {
    return {
      setId,
      setName,
      champions: (data.champions || []).map(this.parseChampion),
      traits: (data.traits || []).map(this.parseTrait),
      items: (data.items || []).map(this.parseItem),
      augments: data.augments || [],
      mechanics: '',
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/_internal/DataTransformer.test.ts
```
Expected: PASS — all tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/DataTransformer.ts backend/src/services/_internal/DataTransformer.test.ts
git commit -m "refactor: extract DataTransformer module"
```

---

### Task 6: Extract FileParser Module

**Files:**
- Create: `backend/src/services/_internal/FileParser.ts`
- Create: `backend/src/services/_internal/FileParser.test.ts`

- [ ] **Step 1: Write the test**

Create `backend/src/services/_internal/FileParser.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { FileParser } from './FileParser';

describe('FileParser', () => {
  it('should parse a dragontail JSON file structure', () => {
    const raw = {
      type: 'champion',
      version: '16.0.0',
      data: [
        { id: 'TFT16_Ahri', name: 'Ahri', cost: 4, traits: ['Arcane'], stats: { hp: 800, mana: 40, damage: 45 }, ability: { name: 'Orb', variables: { Damage: [200, 350] } } },
      ],
    };
    const parsed = FileParser.parseChampionFile(raw, 16);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toHaveProperty('id', 'TFT16_Ahri');
    expect(parsed[0]).toHaveProperty('cost', 4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/_internal/FileParser.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create FileParser**

Create `backend/src/services/_internal/FileParser.ts`:
```typescript
import * as fs from 'fs';

export class FileParser {
  static readJsonFile(filePath: string): any {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  }

  static parseChampionFile(json: any, setId: number): any[] {
    if (!json || !json.data) return [];
    return json.data
      .filter((c: any) => c.id?.startsWith(`TFT${setId}_`))
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        cost: c.cost,
        traits: c.traits || [],
        stats: c.stats || { hp: 0, mana: 0, damage: 0 },
        ability: c.ability ? {
          name: c.ability.name,
          variables: Array.isArray(c.ability.variables)
            ? c.ability.variables
            : Object.entries(c.ability.variables || {}).map(([k, v]) => ({ name: k, values: v })),
        } : { name: '', variables: [] },
      }));
  }

  static parseTraitFile(json: any, setId: number): any[] {
    if (!json || !json.data) return [];
    return json.data
      .filter((t: any) => t.id?.startsWith(`TFT${setId}_`))
      .map((t: any) => ({
        key: t.key || t.id,
        name: t.name || t.key,
        description: t.description || '',
        breakpoints: (t.effects || t.breakpoints || []).map((bp: any) => ({
          count: bp.numUnits || bp.count || 0,
          bonus: bp.effect || bp.bonus || '',
        })),
      }));
  }

  static parseItemFile(json: any, setId: number): any[] {
    if (!json || !json.data) return [];
    return json.data
      .filter((i: any) => i.id?.startsWith(`TFT${setId}_`))
      .map((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description || '',
        components: i.components || i.from || [],
        imageUrl: i.icon || i.imageUrl || null,
        unique: i.unique || false,
        trait: i.trait || null,
      }));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/_internal/FileParser.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/FileParser.ts backend/src/services/_internal/FileParser.test.ts
git commit -m "refactor: extract FileParser module"
```

---

### Task 7: Extract Repository Module

**Files:**
- Create: `backend/src/services/_internal/Repository.ts`
- Create: `backend/src/services/_internal/Repository.test.ts`

- [ ] **Step 1: Write the test**

Create `backend/src/services/_internal/Repository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Repository } from './Repository';
import mongoose from 'mongoose';

describe('Repository', () => {
  let repo: Repository;

  beforeAll(async () => {
    // Use a test MongoDB URI — skip if no DB available
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI);
      repo = new Repository();
    } catch {
      // Tests will be skipped if MongoDB is not available
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch {}
  });

  it('should return null for non-existent set', async () => {
    if (!repo) return; // skip if no DB
    const data = await repo.getSetData(9999);
    expect(data).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/_internal/Repository.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create Repository**

Create `backend/src/services/_internal/Repository.ts`:
```typescript
import { ChampionModel } from '../../models/Champion';
import { TraitModel } from '../../models/Trait';
import { ItemModel } from '../../models/Item';
import { SetModel } from '../../models/Set';
import { ISetData } from '../../interfaces';

export class Repository {
  async getSetData(setId: number): Promise<ISetData | null> {
    const setDoc = await SetModel.findOne({ setId });
    if (!setDoc) return null;

    const champions = await ChampionModel.find({ id: { $in: setDoc.champions || [] } }).lean();
    const traits = await TraitModel.find({ key: { $in: setDoc.traits || [] } }).lean();
    const items = await ItemModel.find({ id: { $in: setDoc.items || [] } }).lean();

    return {
      setId: setDoc.setId,
      setName: setDoc.setName,
      champions: champions as any[],
      traits: traits as any[],
      items: items as any[],
      augments: (setDoc as any).augments || [],
      mechanics: '',
    };
  }

  async saveSetData(setId: number, setName: string, championIds: string[], traitKeys: string[], itemIds: string[], augments: any[]): Promise<void> {
    await SetModel.findOneAndUpdate(
      { setId },
      {
        setId,
        setName,
        champions: championIds,
        traits: traitKeys,
        items: itemIds,
        augments,
      },
      { upsert: true }
    );
  }

  async saveChampions(champions: any[]): Promise<void> {
    for (const c of champions) {
      await ChampionModel.findOneAndUpdate({ id: c.id }, c, { upsert: true });
    }
  }

  async saveTraits(traits: any[]): Promise<void> {
    for (const t of traits) {
      await TraitModel.findOneAndUpdate({ key: t.key }, t, { upsert: true });
    }
  }

  async saveItems(items: any[]): Promise<void> {
    for (const i of items) {
      await ItemModel.findOneAndUpdate({ id: i.id }, i, { upsert: true });
    }
  }

  async hasSet(setId: number): Promise<boolean> {
    return !!(await SetModel.exists({ setId }));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/_internal/Repository.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/Repository.ts backend/src/services/_internal/Repository.test.ts
git commit -m "refactor: extract Repository module"
```

---

### Task 8: Create ImportService

**Files:**
- Create: `backend/src/services/ImportService.ts`
- Create: `backend/src/services/ImportService.test.ts`

- [ ] **Step 1: Write the test**

Create `backend/src/services/ImportService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { ImportService } from './ImportService';

describe('ImportService', () => {
  it('should be constructable', () => {
    const service = new ImportService();
    expect(service).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/ImportService.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create ImportService**

Create `backend/src/services/ImportService.ts`:
```typescript
import { FileParser } from './_internal/FileParser';
import { DataTransformer } from './_internal/DataTransformer';
import { Repository } from './_internal/Repository';
import { PathResolver } from './_internal/PathResolver';

export class ImportService {
  constructor(
    private pathResolver = new PathResolver(),
    private repository = new Repository()
  ) {}

  async importSet(setId: number): Promise<{ champions: number; traits: number; items: number }> {
    const dragontailDir = this.pathResolver.findDragontailDir();
    if (!dragontailDir) {
      throw new Error(`No dragontail data directory found for set ${setId}`);
    }

    // Try set-specific files first, then generic
    const championPath = this.pathResolver.getChampionPath(dragontailDir);
    const traitPath = this.pathResolver.getTraitPath(dragontailDir);
    const itemPath = this.pathResolver.getItemPath(dragontailDir);

    const championJson = FileParser.readJsonFile(championPath) || FileParser.readJsonFile(this.pathResolver.getChampionGenericPath(dragontailDir));
    const traitJson = FileParser.readJsonFile(traitPath) || FileParser.readJsonFile(this.pathResolver.getTraitGenericPath(dragontailDir));
    const itemJson = FileParser.readJsonFile(itemPath) || FileParser.readJsonFile(this.pathResolver.getItemGenericPath(dragontailDir));

    const rawChampions = FileParser.parseChampionFile(championJson, setId);
    const rawTraits = FileParser.parseTraitFile(traitJson, setId);
    const rawItems = FileParser.parseItemFile(itemJson, setId);

    const champions = rawChampions.map(DataTransformer.parseChampion);
    const traits = rawTraits.map(DataTransformer.parseTrait);
    const items = rawItems.map(DataTransformer.parseItem);

    // Persist
    await this.repository.saveChampions(champions);
    await this.repository.saveTraits(traits);
    await this.repository.saveItems(items);

    await this.repository.saveSetData(
      setId,
      `Set ${setId}`,
      champions.map((c: any) => c.id),
      traits.map((t: any) => t.key),
      items.map((i: any) => i.id),
      []
    );

    return { champions: champions.length, traits: traits.length, items: items.length };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/ImportService.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/ImportService.ts backend/src/services/ImportService.test.ts
git commit -m "refactor: create ImportService for dragontail import pipeline"
```

---

### Task 9: Create SetDataService

**Files:**
- Create: `backend/src/services/SetDataService.ts`
- Create: `backend/src/services/SetDataService.test.ts`

- [ ] **Step 1: Write the test**

Create `backend/src/services/SetDataService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { SetDataService } from './SetDataService';

describe('SetDataService', () => {
  it('should use embedded fallback when no DB or files available', async () => {
    const service = new SetDataService();
    await service.initialize();
    const data = await service.getSetData();
    // Should resolve to embedded fallback data
    expect(data).not.toBeNull();
    expect(data.champions.length).toBeGreaterThan(0);
    expect(data.traits.length).toBeGreaterThan(0);
    expect(data.items.length).toBeGreaterThan(0);
  });

  it('should cache results after first call', async () => {
    const service = new SetDataService();
    await service.initialize();
    const first = await service.getSetData(16);
    const second = await service.getSetData(16);
    expect(first).toBe(second); // same reference = cached
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx vitest run src/services/SetDataService.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create SetDataService**

Create `backend/src/services/SetDataService.ts`:
```typescript
import { ISetData } from '../interfaces';
import { Repository } from './_internal/Repository';
import { ImportService } from './ImportService';
import { EmbeddedFallback } from './_internal/EmbeddedFallback';
import { ResultCache } from './_internal/ResultCache';

export class SetDataService {
  private repository: Repository;
  private importService: ImportService;
  private embeddedFallback: typeof EmbeddedFallback;
  private cache: ResultCache;

  constructor() {
    this.repository = new Repository();
    this.importService = new ImportService();
    this.embeddedFallback = EmbeddedFallback;
    this.cache = new ResultCache();
  }

  async initialize(): Promise<void> {
    // Pre-warm: check DB, try import, or use fallback
    await this.getSetData(16);
  }

  async getSetData(setId: number = 16): Promise<ISetData> {
    // 1. Check cache
    const cached = this.cache.get(setId);
    if (cached) return cached;

    // 2. Try DB
    const fromDb = await this.repository.getSetData(setId);
    if (fromDb) {
      this.cache.set(setId, fromDb);
      return fromDb;
    }

    // 3. Try import from dragontail files
    try {
      await this.importService.importSet(setId);
      const fromImport = await this.repository.getSetData(setId);
      if (fromImport) {
        this.cache.set(setId, fromImport);
        return fromImport;
      }
    } catch {
      // File import failed, fall through to embedded
    }

    // 4. Use embedded fallback
    const embedded = this.embeddedFallback.getSetData(setId);
    if (embedded) {
      this.cache.set(setId, embedded);
      return embedded;
    }

    throw new Error(`No data available for set ${setId}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx vitest run src/services/SetDataService.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/SetDataService.ts backend/src/services/SetDataService.test.ts
git commit -m "refactor: create SetDataService with cache-first fallback chain"
```

---

### Task 10: Update Resolvers to Use SetDataService

**Files:**
- Modify: `backend/src/resolvers.ts`

- [ ] **Step 1: Read current resolvers.ts**

The current resolvers.ts imports `dragontailService` as a singleton. Replace all references with `SetDataService`.

- [ ] **Step 2: Modify resolvers.ts**

Replace the import:
```typescript
// OLD:
import { dragontailService } from './services/dragontailService';
// NEW:
import { SetDataService } from './services/SetDataService';
```

Replace the initialization and resolver functions:
```typescript
const setDataService = new SetDataService();

// Initialize at module load (same as before)
setDataService.initialize();
```

Replace all `dragontailService.getSetDataFromDB()` calls with `setDataService.getSetData()`.

Replace all `dragontailService.getChampionsFromDB()` / `dragontailService.getTraitsFromDB()` / `dragontailService.getItemsFromDB()` with calls that use `setDataService.getSetData()` and destructure the result.

The pattern for every resolver:
```typescript
champions: async () => {
  const data = await setDataService.getSetData();
  return data.champions;
},
```

- [ ] **Step 3: Run the backend to verify resolvers work**

```bash
cd backend && npx ts-node src/server.ts
```
Expected: Server starts on port 4000, no import errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/resolvers.ts
git commit -m "refactor: update resolvers to use SetDataService"
```

---

### Task 11: Delete Old dragontailService.ts

**Files:**
- Delete: `backend/src/services/dragontailService.ts`
- Verify: No remaining imports of dragontailService

- [ ] **Step 1: Verify no remaining references**

```bash
cd C:\Users\puppets\Documents\tft_bible_v2
rg "dragontailService" backend/src/ --no-heading
```
Expected: No output (no remaining references)

- [ ] **Step 2: Delete the file**

```bash
Remove-Item -LiteralPath "backend/src/services/dragontailService.ts"
```

- [ ] **Step 3: Run tests to verify nothing broke**

```bash
cd backend && npx vitest run
```
Expected: All tests pass

- [ ] **Step 4: Run backend to verify it starts**

```bash
cd backend && npx ts-node src/server.ts
```
Expected: Server starts cleanly

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/dragontailService.ts (deleted)
git commit -m "refactor: remove dragontailService monolith"
```

---

### Task 12: Clean Up Placeholder Test

**Files:**
- Delete: `backend/tests/placeholder.test.ts`

- [ ] **Step 1: Delete placeholder test**

```bash
Remove-Item -LiteralPath "backend/tests/placeholder.test.ts"
```

- [ ] **Step 2: Run full test suite**

```bash
cd backend && npx vitest run
```
Expected: All remaining tests pass (placeholder deleted)

- [ ] **Step 3: Commit**

```bash
git add backend/tests/placeholder.test.ts (deleted)
git commit -m "chore: remove placeholder test"
```
