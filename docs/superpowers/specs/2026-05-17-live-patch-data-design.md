# Live Patch Data — Design

## Summary

Three-phase rollout to keep game data current and surface live meta composition data. Phases are independent and deliverable in order.

## Phase 1: Auto-Download Game Data

Automatically detect and download the latest Dragontail data on startup so `PathResolver` always points to the current patch.

### Module: `DragontailUpdater`

```
backend/src/services/
  DragontailUpdater.ts    ← NEW
  _internal/
    PathResolver.ts       ← MODIFIED: accept dynamic version
```

**Flow:**
1. On startup, fetch `https://ddragon.leagueoflegends.com/api/versions.json`
2. First element is latest version (e.g., `"16.10.1"`)
3. Compare against `dataDir/dragontail-{version}` directory existence
4. If missing, download `https://ddragon.leagueoflegends.com/cdn/dragontail-{version}.tgz`
5. Extract `.tgz` to `dataDir/dragontail-{version}/`
6. Update `PathResolver` to use new base directory

**Download considerations:**
- `.tgz` file is ~1GB — stream to disk, don't hold in memory
- Use Node's `https` + `zlib` + `tar` (or `extract-zip`) for extraction
- Lock file to prevent concurrent downloads
- On failure: log warning, keep using existing data (graceful degradation)

**Integration point:** `PathResolver` currently has two hardcoded paths (`DOCKER_BASE`, `LOCAL_BASE`). Refactor to accept a dynamic version or scan for the latest local directory.

### Files

| File | Action |
|---|---|
| `services/DragontailUpdater.ts` | Create — auto-download + extract orchestrator |
| `services/_internal/PathResolver.ts` | Modify — accept dynamic version |
| `.env` or `config.ts` | Add `DRAGONTAIL_DATA_DIR` path |
| `services/SetDataService.ts` | Modify — call `DragontailUpdater` on init |

## Phase 2: Third-Party Meta Links

Add a `/meta` route that embeds external meta sites via iframes for immediate value while Phase 3 is built.

### Frontend

```
frontend/src/pages/
  Meta.tsx                ← NEW: iframe container page
frontend/src/
  App.tsx                 ← MODIFIED: add /meta route
```

**Iframe targets** (check X-Frame-Options before shipping):
- `https://tactics.tools` (comps overview)
- `https://metatft.com/comps`
- `https://mobalytics.gg/tft/team-comps`
- `https://tftactics.gg/tierlist/team-comps`

**Fallback:** If a site blocks iframes, show a direct link button instead. Detect via `onError` handler on the iframe or server-side HEAD check.

### Files

| File | Action |
|---|---|
| `frontend/src/pages/Meta.tsx` | Create — tabbed iframe container |
| `frontend/src/App.tsx` | Add route `/meta` |
| `frontend/src/components/Navbar.tsx` | Add "Meta" nav link |

## Phase 3: Riot API Meta Computation

Fetch challenger/Grandmaster match data via Riot's official TFT API, compute composition statistics via champion co-occurrence clustering, and serve aggregated results via GraphQL.

### Architecture

```
Cron schedule ──→ MetaService ──→ RiotApiClient ──→ Riot TFT API
                      │
                      ├── MatchFetcher (batch match detail)
                      ├── CompAnalyzer (co-occurrence clustering)
                      └── MetaComposition model (MongoDB)

GraphQL resolvers ──→ MetaComposition model (read)
```

### Module Layout

```
backend/src/services/
  RiotApiClient.ts        ← NEW: rate-limited HTTP client
  MetaService.ts          ← NEW: orchestrator (fetch → analyze → persist)
  _internal/
    MatchFetcher.ts       ← NEW: batch match ID + detail fetching
    CompAnalyzer.ts       ← NEW: co-occurrence matrix + clustering
    RateLimiter.ts        ← NEW: token bucket rate limiter
  models/
    MetaComposition.ts    ← NEW: Mongoose schema
  resolvers.ts            ← MODIFIED: add meta queries
  schema.ts               ← MODIFIED: add MetaComposition types
```

### Data Flow

```
1. MetaService.fetchAndAnalyze()
2.   RiotApiClient.getChallengerEntries()
       → List of ~200 challenger PUUIDs + summoner info
3.   MatchFetcher.fetchMatches(puuid[], { count, startTime })
       → For each PUUID: GET /tft/match/v1/matches/by-puuid/{puuid}/ids
       → For each match ID: GET /tft/match/v1/matches/{matchId}
       → Returns: raw MatchDto[]
4.   CompAnalyzer.cluster(matchDto[])
       a. Extract participant boards: { units[], traits[], placement }
       b. Build champion co-occurrence matrix
          - For each pair of champions, count matches where both appear
          - Normalize by total matches
       c. Cluster: champions with co-occurrence > threshold (e.g., 0.6)
          form a "comp cluster"
       d. For each cluster, assign matches where ≥70% of cluster
          champions are present
       e. Compute stats per cluster:
          - winRate (placement=1 matches / total matches)
          - top4Rate (placement≤4 matches / total matches)
          - avgPlacement (mean placement)
          - pickRate (cluster matches / all challenger matches)
       f. Compute item recommendations per champion in cluster:
          - For each champion, count which items were equipped in wins
          - Top 3 most frequent items = recommended items
5.   MetaCompositionModel.bulkUpsert(clusters[])
       → Upsert by unique comp fingerprint
```

### Data Model

```typescript
interface MetaComposition {
  id: string;                     // auto slug from top champions
  setId: number;
  patchVersion: string;
  champions: MetaChampionUnit[];
  traits: MetaTraitUnit[];
  stats: MetaStats;
  playstyle: "Fast 8" | "Slow Roll" | "Standard" | "Reroll";
  lastUpdated: Date;
}

interface MetaChampionUnit {
  championId: string;
  count: number;                  // matches containing this champ
  pickRate: number;               // % of comp matches
  items: { itemId: string; count: number }[];
}

interface MetaTraitUnit {
  key: string;
  breakpoint: number;
  count: number;
}

interface MetaStats {
  matchesAnalyzed: number;
  winRate: number;
  top4Rate: number;
  avgPlacement: number;
  pickRate: number;
}
```

### Rate Limiting

**TokenBucket** algorithm in `RateLimiter.ts`:
- Production tier: 500 tokens max, refill 50/sec
- Each HTTP request consumes 1 token
- If bucket empty, request is queued (Promise resolves when token available)
- Separate bucket per regional cluster (AMERICAS, ASIA, EUROPE)
- Retry with exponential backoff on 429 (rate limit exceeded)

**Resource budget** (challenger analysis):
- Challenger tier: ~200 players
- Match list: 200 requests
- Match details: ~4000 requests (20 recent matches per player)
- Total: ~4200 requests
- At production rate: ~84 seconds wall time
- Well within 30,000 req/10min limit

### Mongoose Schema

```typescript
const metaCompositionSchema = new Schema({
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
}, {
  timestamps: true,
});
```

Composite index: `{ setId: 1, patchVersion: 1, "stats.pickRate": -1 }` — for the "meta comps by set/patch sorted by popularity" query.

### GraphQL Schema

```graphql
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

type MetaChampion {
  championId: String!
  count: Int!
  pickRate: Float!
  items: [MetaItem!]!
}

type MetaItem {
  itemId: String!
  count: Int!
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

extend type Query {
  metaCompositions(setId: Int, patchVersion: String): [MetaComposition!]!
  metaComposition(id: ID!): MetaComposition
}
```

### Scheduling

Manual trigger via GraphQL mutation (`refreshMetaData(setId: Int!): Boolean!`) plus cron schedule:
- Dev: every 6 hours
- Production: every hour during peak play times, every 6 hours otherwise
- Implementation: `setInterval` in `MetaService` or external cron (docker/systemd)

### Error Handling

- **API key missing:** log critical error, don't attempt fetching, meta queries return empty
- **Rate limited:** back off per RateLimiter, queue remaining requests
- **Network failure:** retry 3x with exponential backoff, then skip batch
- **Partial data:** if some matches fail, process what we have — better than nothing
- **Stale data:** `lastUpdated` timestamp lets consumers know freshness; serve stale data while refresh runs

### GraphQL Mutations

```graphql
extend type Mutation {
  refreshMetaData(setId: Int!): Boolean!
}
```

### Playstyle Detection

Inferred from average champion cost at final board state:
- **Fast 8:** average cost ≥ 3.5, many 4-cost carries
- **Slow Roll:** average cost ~2.0–3.0, multiple 3-star units
- **Reroll:** average cost < 2.0, 1-cost carries
- **Standard:** everything else

### Tunable Parameters

All clustering thresholds stored as constants in `CompAnalyzer`:
- `CO_OCCURRENCE_THRESHOLD = 0.6` — minimum co-occurrence rate to form a cluster
- `MATCH_ASSIGNMENT_THRESHOLD = 0.7` — minimum fraction of cluster champions present to assign a match
- `MIN_MATCHES_PER_COMP = 20` — minimum matches to publish a comp (filter noise)

## Out of Scope

- Per-user meta (personal performance, match history) — Phase 3 is global challenger stats only
- Real-time in-game overlay — pre-game analysis only per Riot policies
- Augment-specific meta — tracked via `traits` but not individual augment stats
- Machine learning for comp predictions — simple statistics only
