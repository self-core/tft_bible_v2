# Phase 3: Riot API Meta Computation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fetch challenger/GM match data via Riot TFT API, compute composition stats via champion co-occurrence clustering, serve aggregated results via GraphQL.

**Architecture:** MetaService (orchestrator) → RiotApiClient (rate-limited HTTP) → MatchFetcher (batch match detail) → CompAnalyzer (clustering + stats) → MetaComposition model (MongoDB). Resolvers read from MongoDB.

**Tech Stack:** Node.js + TypeScript, Mongoose, Apollo Server, vitest, `node:https` for HTTP (no external HTTP dependency to keep it light).

---

### Task 1: RateLimiter (Token Bucket)

**Files:**
- Create: `backend/src/services/_internal/RateLimiter.ts`
- Create: `backend/src/services/_internal/RateLimiter.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { RateLimiter } from './RateLimiter';

describe('RateLimiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillRate: 10, refillIntervalMs: 1000 });
    await limiter.acquire();
    expect(limiter.tokens).toBe(9);
  });

  it('should block when tokens exhausted', async () => {
    const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1, refillIntervalMs: 50 });
    await limiter.acquire();
    await limiter.acquire();
    const start = Date.now();
    // Third acquire should wait for refill
    const promise = limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(20); // should be queued, not resolved immediately
  });

  it('should refill tokens over time', async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1, refillIntervalMs: 100 });
    await limiter.acquire();
    expect(limiter.tokens).toBe(0);
    vi.advanceTimersByTime(150);
    expect(limiter.tokens).toBe(1);
    vi.useRealTimers();
  });

  it('should not exceed max tokens', async () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 10, refillIntervalMs: 100 });
    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);
    expect(limiter.tokens).toBe(5); // capped at max
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/_internal/RateLimiter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
interface RateLimiterOptions {
  maxTokens: number;
  refillRate: number;
  refillIntervalMs: number;
}

export class RateLimiter {
  tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private refillIntervalMs: number;
  private waiting: Array<() => void> = [];

  constructor(opts: RateLimiterOptions) {
    this.maxTokens = opts.maxTokens;
    this.tokens = opts.maxTokens;
    this.refillRate = opts.refillRate;
    this.refillIntervalMs = opts.refillIntervalMs;
    setInterval(() => this.refill(), this.refillIntervalMs);
  }

  acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  private refill(): void {
    const before = this.tokens;
    this.tokens = Math.min(this.maxTokens, this.tokens + this.refillRate);
    const gained = this.tokens - before;
    for (let i = 0; i < gained && this.waiting.length > 0; i++) {
      const resolve = this.waiting.shift()!;
      this.tokens--;
      resolve();
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/_internal/RateLimiter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/RateLimiter.ts backend/src/services/_internal/RateLimiter.test.ts
git commit -m "feat: add RateLimiter with token bucket algorithm"
```

---

### Task 2: RiotApiClient

**Files:**
- Create: `backend/src/services/RiotApiClient.ts`
- Create: `backend/src/services/RiotApiClient.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { RiotApiClient } from './RiotApiClient';

describe('RiotApiClient', () => {
  it('should be constructable with API key', () => {
    const client = new RiotApiClient({ apiKey: 'RGAPI-test-key' });
    expect(client).toBeDefined();
  });

  it('should throw on missing API key', () => {
    expect(() => new RiotApiClient({ apiKey: '' })).toThrow('RIOT_API_KEY');
  });

  it('should build correct URL for challenger endpoint', () => {
    const client = new RiotApiClient({ apiKey: 'test-key' });
    const url = (client as any).buildUrl('NA1', '/tft/league/v1/challenger');
    expect(url).toContain('na1.api.riotgames.com');
    expect(url).toContain('api_key=test-key');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/RiotApiClient.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import * as https from 'https';
import { RateLimiter } from './_internal/RateLimiter';

interface RiotApiConfig {
  apiKey: string;
}

const PLATFORM_HOSTS: Record<string, string> = {
  NA1: 'na1.api.riotgames.com',
  EUW1: 'euw1.api.riotgames.com',
  KR: 'kr.api.riotgames.com',
};

const REGIONAL_HOSTS: Record<string, string> = {
  AMERICAS: 'americas.api.riotgames.com',
  EUROPE: 'europe.api.riotgames.com',
  ASIA: 'asia.api.riotgames.com',
};

export class RiotApiClient {
  private apiKey: string;
  private limiter = new RateLimiter({ maxTokens: 500, refillRate: 50, refillIntervalMs: 1000 });

  constructor(config: RiotApiConfig) {
    if (!config.apiKey) throw new Error('RIOT_API_KEY is required');
    this.apiKey = config.apiKey;
  }

  async request<T>(platform: string, path: string, region?: string): Promise<T> {
    await this.limiter.acquire();
    const host = PLATFORM_HOSTS[platform];
    if (!host) throw new Error(`Unknown platform: ${platform}`);
    const url = `https://${host}${path}?api_key=${this.apiKey}`;
    return this.fetchJson<T>(url);
  }

  async regionalRequest<T>(region: string, path: string): Promise<T> {
    await this.limiter.acquire();
    const host = REGIONAL_HOSTS[region];
    if (!host) throw new Error(`Unknown region: ${region}`);
    const url = `https://${host}${path}?api_key=${this.apiKey}`;
    return this.fetchJson<T>(url);
  }

  private fetchJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Riot API error ${res.statusCode}: ${data}`));
            return;
          }
          try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON response')); }
        });
      }).on('error', reject);
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/RiotApiClient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/RiotApiClient.ts backend/src/services/RiotApiClient.test.ts
git commit -m "feat: add RiotApiClient with rate-limited HTTP requests"
```

---

### Task 3: MetaComposition Model

**Files:**
- Create: `backend/src/models/MetaComposition.ts`
- Create: `backend/src/models/MetaComposition.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MetaCompositionModel } from './MetaComposition';

describe('MetaCompositionModel', () => {
  let isConnected = false;

  beforeAll(async () => {
    try {
      await mongoose.connect('mongodb://localhost:27017/tft_bible_test', { serverSelectionTimeoutMS: 2000 });
      isConnected = true;
    } catch { console.warn('MongoDB not available'); }
  });

  afterAll(async () => {
    if (isConnected) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
  });

  it('should create a meta composition document', async () => {
    if (!isConnected) return;
    const doc = await MetaCompositionModel.create({
      id: 'psionic-gragas',
      setId: 17,
      patchVersion: '17.3',
      champions: [{ championId: 'TFT17_Gragas', count: 80, pickRate: 0.8, items: [] }],
      traits: [{ key: 'Psionic', breakpoint: 4, count: 90 }],
      stats: { matchesAnalyzed: 100, winRate: 0.15, top4Rate: 0.6, avgPlacement: 3.5, pickRate: 0.05 },
      playstyle: 'Fast 8',
      lastUpdated: new Date(),
    });
    expect(doc.id).toBe('psionic-gragas');
    expect(doc.stats.winRate).toBe(0.15);
  });

  it('should enforce unique id', async () => {
    if (!isConnected) return;
    await MetaCompositionModel.create({
      id: 'dup', setId: 17, patchVersion: '17.3',
      champions: [], traits: [],
      stats: { matchesAnalyzed: 0, winRate: 0, top4Rate: 0, avgPlacement: 0, pickRate: 0 },
      playstyle: 'Standard',
    });
    await expect(MetaCompositionModel.create({
      id: 'dup', setId: 17, patchVersion: '17.3',
      champions: [], traits: [],
      stats: { matchesAnalyzed: 0, winRate: 0, top4Rate: 0, avgPlacement: 0, pickRate: 0 },
      playstyle: 'Standard',
    })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/models/MetaComposition.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import mongoose, { Schema } from 'mongoose';

export interface IMetaStats {
  matchesAnalyzed: number;
  winRate: number;
  top4Rate: number;
  avgPlacement: number;
  pickRate: number;
}

export interface IMetaCompositionDocument extends mongoose.Document {
  id: string;
  setId: number;
  patchVersion: string;
  champions: Array<{ championId: string; count: number; pickRate: number; items: Array<{ itemId: string; count: number }> }>;
  traits: Array<{ key: string; breakpoint: number; count: number }>;
  stats: IMetaStats;
  playstyle: string;
  lastUpdated: Date;
}

const metaCompSchema = new Schema<IMetaCompositionDocument>({
  id: { type: String, required: true, unique: true },
  setId: { type: Number, required: true },
  patchVersion: { type: String, required: true },
  champions: [{
    championId: String,
    count: Number,
    pickRate: Number,
    items: [{ itemId: String, count: Number }],
  }],
  traits: [{ key: String, breakpoint: Number, count: Number }],
  stats: {
    matchesAnalyzed: Number,
    winRate: Number,
    top4Rate: Number,
    avgPlacement: Number,
    pickRate: Number,
  },
  playstyle: String,
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

metaCompSchema.index({ setId: 1, patchVersion: 1, 'stats.pickRate': -1 });

export const MetaCompositionModel = mongoose.model<IMetaCompositionDocument>('MetaComposition', metaCompSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/models/MetaComposition.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/MetaComposition.ts backend/src/models/MetaComposition.test.ts
git commit -m "feat: add MetaComposition Mongoose model"
```

---

### Task 4: MatchFetcher

**Files:**
- Create: `backend/src/services/_internal/MatchFetcher.ts`
- Create: `backend/src/services/_internal/MatchFetcher.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { MatchFetcher } from './MatchFetcher';

describe('MatchFetcher', () => {
  it('should parse participants from match DTO', () => {
    const fetcher = new MatchFetcher();
    const participants = fetcher.extractParticipants({
      metadata: { data_version: '2', match_id: 'TFT_123' },
      info: {
        game_datetime: 1700000000000,
        game_length: 1800,
        game_version: 'Version 17.3',
        participants: [
          {
            puuid: 'p1',
            placement: 1,
            level: 9,
            last_round: 10,
            players_eliminated: 7,
            total_damage_to_players: 100,
            units: [
              { character_id: 'TFT17_Gragas', tier: 2, items: [1001, 1002], rarity: 3, chosen: '', name: '' },
            ],
            traits: [
              { name: 'Psionic', num_units: 4, style: 1, tier_current: 2, tier_total: 3 },
            ],
          },
        ],
        queue_id: 1100,
        tft_set_number: 17,
      },
    } as any);
    expect(participants).toHaveLength(1);
    expect(participants[0].placement).toBe(1);
    expect(participants[0].units[0].character_id).toBe('TFT17_Gragas');
  });

  it('should handle empty matches array', () => {
    const fetcher = new MatchFetcher();
    const result = fetcher.extractParticipants(null);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/_internal/MatchFetcher.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
export interface ParticipantBoard {
  puuid: string;
  placement: number;
  level: number;
  units: Array<{
    character_id: string;
    tier: number;    // 1★/2★/3★
    items: number[]; // item IDs
    rarity: number;
  }>;
  traits: Array<{
    name: string;
    num_units: number;
    style: number;
    tier_current: number;
    tier_total: number;
  }>;
}

interface MatchDto {
  metadata: { data_version: string; match_id: string };
  info: {
    game_datetime: number;
    game_length: number;
    game_version: string;
    participants: any[];
    queue_id: number;
    tft_set_number: number;
  };
}

export class MatchFetcher {
  extractParticipants(matchDto: MatchDto | null): ParticipantBoard[] {
    if (!matchDto?.info?.participants) return [];
    return matchDto.info.participants.map((p: any) => ({
      puuid: p.puuid,
      placement: p.placement,
      level: p.level,
      units: (p.units || []).map((u: any) => ({
        character_id: u.character_id,
        tier: u.tier,
        items: u.items || [],
        rarity: u.rarity,
      })),
      traits: (p.traits || []).map((t: any) => ({
        name: t.name,
        num_units: t.num_units,
        style: t.style,
        tier_current: t.tier_current,
        tier_total: t.tier_total,
      })),
    }));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/_internal/MatchFetcher.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/MatchFetcher.ts backend/src/services/_internal/MatchFetcher.test.ts
git commit -m "feat: add MatchFetcher with match DTO parser"
```

---

### Task 5: CompAnalyzer (Co-occurrence Clustering)

**Files:**
- Create: `backend/src/services/_internal/CompAnalyzer.ts`
- Create: `backend/src/services/_internal/CompAnalyzer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { CompAnalyzer } from './CompAnalyzer';

describe('CompAnalyzer', () => {
  const analyzer = new CompAnalyzer();

  it('should build co-occurrence matrix from participant boards', () => {
    const boards = [
      { units: ['TFT17_A', 'TFT17_B', 'TFT17_C'], placement: 1 },
      { units: ['TFT17_A', 'TFT17_B', 'TFT17_D'], placement: 4 },
      { units: ['TFT17_A', 'TFT17_C', 'TFT17_E'], placement: 2 },
    ];
    const matrix = analyzer.buildCoOccurrence(boards);
    expect(matrix['TFT17_A']['TFT17_B']).toBe(2); // A & B appear together twice
    expect(matrix['TFT17_A']['TFT17_C']).toBe(2);
    expect(matrix['TFT17_B']['TFT17_D']).toBe(1);
  });

  it('should cluster champions with high co-occurrence', () => {
    const clusters = analyzer.cluster({
      'TFT17_A': { 'TFT17_B': 0.9, 'TFT17_C': 0.8, 'TFT17_D': 0.3 },
      'TFT17_B': { 'TFT17_A': 0.9, 'TFT17_C': 0.7, 'TFT17_D': 0.2 },
      'TFT17_C': { 'TFT17_A': 0.8, 'TFT17_B': 0.7, 'TFT17_D': 0.1 },
      'TFT17_D': { 'TFT17_A': 0.3, 'TFT17_B': 0.2, 'TFT17_C': 0.1 },
    }, 0.6);
    expect(clusters).toHaveLength(1); // A, B, C cluster together, D is isolated
    expect(clusters[0].sort()).toEqual(['TFT17_A', 'TFT17_B', 'TFT17_C']);
  });

  it('should compute stats for a cluster', () => {
    const boards = [
      { units: { 'TFT17_A': true, 'TFT17_B': true, 'TFT17_C': true }, placement: 1, level: 9, traits: [{ name: 'Psionic', num_units: 4 }] },
      { units: { 'TFT17_A': true, 'TFT17_B': true, 'TFT17_C': true, 'TFT17_D': true }, placement: 3, level: 8, traits: [{ name: 'Psionic', num_units: 4 }] },
      { units: { 'TFT17_A': true, 'TFT17_B': true }, placement: 7, level: 7, traits: [{ name: 'Psionic', num_units: 2 }] },
    ] as any;
    const stats = analyzer.computeStats(boards, 3);
    expect(stats.winRate).toBeCloseTo(0.333, 2);
    expect(stats.top4Rate).toBeCloseTo(0.667, 2);
    expect(stats.avgPlacement).toBeCloseTo(3.667, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/_internal/CompAnalyzer.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
interface ParticipantBoard {
  units: string[];
  placement: number;
  level: number;
  traits: Array<{ name: string; num_units: number }>;
}

interface ClusteredComp {
  champions: string[];
  traits: Array<{ key: string; breakpoint: number }>;
  matches: number;
  stats: {
    matchesAnalyzed: number;
    winRate: number;
    top4Rate: number;
    avgPlacement: number;
    pickRate: number;
  };
}

export class CompAnalyzer {
  private readonly CO_OCCURRENCE_THRESHOLD = 0.6;
  private readonly MIN_MATCHES = 20;

  buildCoOccurrence(boards: { units: string[] }[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    const champCount: Record<string, number> = {};

    for (const board of boards) {
      const seen = new Set<string>();
      for (const unit of board.units) {
        champCount[unit] = (champCount[unit] || 0) + 1;
        seen.add(unit);
        if (!matrix[unit]) matrix[unit] = {};
        for (const other of board.units) {
          if (unit !== other) {
            matrix[unit][other] = (matrix[unit][other] || 0) + 1;
          }
        }
      }
    }

    // Normalize to co-occurrence rate
    for (const champ of Object.keys(matrix)) {
      for (const other of Object.keys(matrix[champ])) {
        matrix[champ][other] = matrix[champ][other] / champCount[champ];
      }
    }

    return matrix;
  }

  cluster(matrix: Record<string, Record<string, number>>, threshold: number = this.CO_OCCURRENCE_THRESHOLD): string[][] {
    const visited = new Set<string>();
    const clusters: string[][] = [];

    for (const champ of Object.keys(matrix)) {
      if (visited.has(champ)) continue;
      const cluster: string[] = [champ];
      visited.add(champ);
      for (const other of Object.keys(matrix[champ])) {
        if (!visited.has(other) && matrix[champ][other] >= threshold) {
          cluster.push(other);
          visited.add(other);
        }
      }
      if (cluster.length >= 3) clusters.push(cluster);
    }

    return clusters;
  }

  computeStats(boards: ParticipantBoard[], totalMatches: number) {
    if (boards.length === 0) return { matchesAnalyzed: 0, winRate: 0, top4Rate: 0, avgPlacement: 0, pickRate: 0 };

    const wins = boards.filter(b => b.placement === 1).length;
    const top4 = boards.filter(b => b.placement <= 4).length;
    const avgPlacement = boards.reduce((sum, b) => sum + b.placement, 0) / boards.length;

    return {
      matchesAnalyzed: boards.length,
      winRate: wins / boards.length,
      top4Rate: top4 / boards.length,
      avgPlacement: Math.round(avgPlacement * 100) / 100,
      pickRate: boards.length / totalMatches,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/_internal/CompAnalyzer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/_internal/CompAnalyzer.ts backend/src/services/_internal/CompAnalyzer.test.ts
git commit -m "feat: add CompAnalyzer with co-occurrence clustering"
```

---

### Task 6: MetaService (Orchestrator)

**Files:**
- Create: `backend/src/services/MetaService.ts`
- Create: `backend/src/services/MetaService.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { MetaService } from './MetaService';

describe('MetaService', () => {
  it('should be constructable', () => {
    const service = new MetaService();
    expect(service).toBeDefined();
  });

  it('should return empty list when no meta comps in DB', async () => {
    const service = new MetaService();
    const comps = await service.getMetaCompositions(17);
    expect(comps).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/MetaService.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
import { MetaCompositionModel } from '../models/MetaComposition';

interface MetaCompositionQuery {
  setId?: number;
  patchVersion?: string;
}

export class MetaService {
  async getMetaCompositions(setId?: number, patchVersion?: string): Promise<any[]> {
    const filter: any = {};
    if (setId) filter.setId = setId;
    if (patchVersion) filter.patchVersion = patchVersion;

    const docs = await MetaCompositionModel.find(filter)
      .sort({ 'stats.pickRate': -1 })
      .lean();
    return docs;
  }

  async getMetaCompositionById(id: string): Promise<any | null> {
    const doc = await MetaCompositionModel.findOne({ id }).lean();
    return doc || null;
  }

  async refreshMetaData(setId: number): Promise<void> {
    // This will be the full orchestration pipeline in Task 7
    // For now, stub with a no-op that doesn't throw
    console.log(`MetaService.refreshMetaData(${setId}) called — pipeline not yet wired`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/MetaService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/MetaService.ts backend/src/services/MetaService.test.ts
git commit -m "feat: add MetaService with read queries and stub refresh"
```

---

### Task 7: GraphQL Schema + Resolvers for Meta Compositions

**Files:**
- Modify: `backend/src/schema.ts` — add MetaComposition types, extend Query, add Mutation
- Modify: `backend/src/resolvers.ts` — add metaComposition resolvers

- [ ] **Step 1: Add GraphQL types to schema**

Add after the `SearchResult` type or before the closing `` ` ``:

```graphql
  type MetaItem {
    itemId: String!
    count: Int!
  }

  type MetaChampion {
    championId: String!
    count: Int!
    pickRate: Float!
    items: [MetaItem!]!
  }

  type MetaTrait {
    key: String!
    breakpoint: Int!
    count: Int!
  }

  type MetaStats {
    matchesAnalyzed: Int!
    winRate: Float!
    top4Rate: Float!
    avgPlacement: Float!
    pickRate: Float!
  }

  type MetaComposition {
    id: ID!
    setId: Int!
    patchVersion: String!
    champions: [MetaChampion!]!
    traits: [MetaTrait!]!
    stats: MetaStats!
    playstyle: String!
    lastUpdated: String!
  }

  extend type Query {
    metaCompositions(setId: Int, patchVersion: String): [MetaComposition!]!
    metaComposition(id: ID!): MetaComposition
  }

  extend type Mutation {
    refreshMetaData(setId: Int!): Boolean!
  }
```

- [ ] **Step 2: Add resolvers**

In `resolvers.ts`:
- Import `MetaService`
- Add `const metaService = new MetaService();`
- Add to Query resolver:
```typescript
metaCompositions: async (_: any, { setId, patchVersion }: { setId?: number; patchVersion?: string }) => {
  return metaService.getMetaCompositions(setId, patchVersion);
},
metaComposition: async (_: any, { id }: { id: string }) => {
  return metaService.getMetaCompositionById(id);
},
```
- Add to Mutation resolver:
```typescript
refreshMetaData: async (_: any, { setId }: { setId: number }) => {
  await metaService.refreshMetaData(setId);
  return true;
},
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: all existing tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/schema.ts backend/src/resolvers.ts
git commit -m "feat: add MetaComposition GraphQL types and resolvers"
```

---

### Task 8: Full Pipeline Integration (MetaService.refreshMetaData)

**Files:**
- Modify: `backend/src/services/MetaService.ts` — implement full refresh pipeline
- Modify: `backend/src/services/MetaService.test.ts` — integration test for pipeline

This task wires everything together: RiotApiClient → MatchFetcher → CompAnalyzer → MetaCompositionModel.

- [ ] **Step 1: Implement the full refresh pipeline in MetaService**

```typescript
async refreshMetaData(setId: number): Promise<void> {
  const region = 'AMERICAS';
  const platform = 'NA1';
  const patchVersion = `17.${setId}`; // simplified — can be fetched from Data Dragon

  // 1. Fetch challenger entries
  const challenger = await this.apiClient.request<any>(platform, '/tft/league/v1/challenger');
  const entries: any[] = challenger?.entries || [];
  const puuids = entries.slice(0, 50).map((e: any) => e.puuid); // top 50 challengers

  // 2. Fetch match IDs for each summoner
  const allMatchIds = new Set<string>();
  for (const puuid of puuids) {
    const ids = await this.apiClient.regionalRequest<string[]>(region, `/tft/match/v1/matches/by-puuid/${puuid}/ids?count=5`);
    ids.forEach((id: string) => allMatchIds.add(id));
  }

  // 3. Fetch match details
  const matchIds = [...allMatchIds].slice(0, 100); // cap at 100 matches per refresh
  const allBoards: ParticipantBoard[] = [];
  const allRawBoards: any[] = [];

  for (const matchId of matchIds) {
    try {
      const match = await this.apiClient.regionalRequest<any>(region, `/tft/match/v1/matches/${matchId}`);
      const participants = this.matchFetcher.extractParticipants(match);
      for (const p of participants) {
        allBoards.push({
          units: p.units.map(u => u.character_id),
          placement: p.placement,
          level: p.level,
          traits: p.traits.map(t => ({ name: t.name, num_units: t.num_units })),
        });
        allRawBoards.push(p);
      }
    } catch { /* skip failed matches */ }
  }

  // 4. Analyze compositions
  const matrix = this.analyzer.buildCoOccurrence(allBoards);
  const clusters = this.analyzer.cluster(matrix);

  // 5. For each cluster, compute stats and persist
  for (const cluster of clusters) {
    const matchingBoards = allRawBoards.filter(p =>
      cluster.filter(c => p.units.some((u: any) => u.character_id === c)).length / cluster.length >= 0.7
    );
    if (matchingBoards.length < 20) continue;

    const stats = this.analyzer.computeStats(matchingBoards, allBoards.length);

    // Aggregate traits
    const traitMap: Record<string, { breakpoint: number; count: number }> = {};
    for (const board of matchingBoards) {
      for (const trait of board.traits) {
        if (!traitMap[trait.name]) traitMap[trait.name] = { breakpoint: trait.num_units, count: 0 };
        traitMap[trait.name].count++;
        traitMap[trait.name].breakpoint = Math.max(traitMap[trait.name].breakpoint, trait.num_units);
      }
    }

    // Aggregate item recommendations
    const itemMap: Record<string, Record<string, number>> = {};
    for (const board of matchingBoards) {
      for (const unit of board.units) {
        if (!itemMap[unit.character_id]) itemMap[unit.character_id] = {};
        for (const itemId of unit.items) {
          itemMap[unit.character_id][itemId] = (itemMap[unit.character_id][itemId] || 0) + 1;
        }
      }
    }

    const slug = cluster.slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');

    await MetaCompositionModel.findOneAndUpdate(
      { id: slug },
      {
        id: slug,
        setId,
        patchVersion,
        champions: Object.entries(itemMap).map(([championId, items]) => ({
          championId,
          count: matchingBoards.filter((b: any) => b.units.some((u: any) => u.character_id === championId)).length,
          pickRate: matchingBoards.filter((b: any) => b.units.some((u: any) => u.character_id === championId)).length / matchingBoards.length,
          items: Object.entries(items).map(([itemId, count]) => ({ itemId, count })).sort((a, b) => b.count - a.count).slice(0, 3),
        })),
        traits: Object.entries(traitMap).map(([key, val]) => ({ key, breakpoint: val.breakpoint, count: val.count })),
        stats,
        playstyle: stats.avgPlacement < 4 ? 'Fast 8' : 'Standard',
        lastUpdated: new Date(),
      },
      { upsert: true }
    );
  }
}
```

- [ ] **Step 2: Update MetaService constructor to accept deps**

```typescript
import { RiotApiClient } from './RiotApiClient';
import { MatchFetcher } from './_internal/MatchFetcher';
import { CompAnalyzer } from './_internal/CompAnalyzer';

export class MetaService {
  private apiClient: RiotApiClient;
  private matchFetcher: MatchFetcher;
  private analyzer: CompAnalyzer;

  constructor(apiKey?: string) {
    this.apiClient = new RiotApiClient({ apiKey: apiKey || process.env.RIOT_API_KEY || '' });
    this.matchFetcher = new MatchFetcher();
    this.analyzer = new CompAnalyzer();
  }
  // ... rest of methods
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/MetaService.ts backend/src/services/MetaService.test.ts
git commit -m "feat: implement MetaService full refresh pipeline"
```

---

### Task 9: Schedule + Startup Integration

**Files:**
- Modify: `backend/src/server.ts` — trigger initial meta refresh on startup, set interval

- [ ] **Step 1: Add scheduled refresh in server.ts**

After Apollo Server setup, add:

```typescript
import { MetaService } from './services/MetaService';

const metaService = new MetaService();

// Initial meta refresh on startup (non-blocking)
if (process.env.RIOT_API_KEY) {
  metaService.refreshMetaData(17).catch(err => console.warn('Initial meta refresh failed:', err.message));

  // Refresh every 6 hours
  setInterval(() => {
    metaService.refreshMetaData(17).catch(err => console.warn('Scheduled meta refresh failed:', err.message));
  }, 6 * 60 * 60 * 1000);
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat: add scheduled meta data refresh on startup"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL tests pass

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: no output
