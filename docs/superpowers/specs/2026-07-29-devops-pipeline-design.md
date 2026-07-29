# DevOps Pipeline with AI Release Manager — Design Spec

## Goal

Build a DevOps pipeline (GitHub Actions CI) plus an AI-powered Release Manager that
runs as a Docker container locally, comments on PRs with release impact, and
automates changelog generation + GitHub Releases on every push to `main`.

## Architecture

```
                     ┌──────────────────┐
                     │   GitHub Repo    │
                     │  (PR, push to    │
                     │      main)       │
                     └────────┬─────────┘
                              │ webhooks
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   AI Release Manager (agent/)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Webhook  │→│   LLM    │→│Changelog│→│  Release         │ │
│  │ Handler  │  │ Adapter  │  │Generator│  │  Coordinator      │ │
│  │(Express) │  │(OpenAI,  │  │         │  │  (GitHub API)     │ │
│  │          │  │ Claude,  │  │         │  │                   │ │
│  │          │  │ Ollama)  │  │         │  │                   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
         │                                      ▲
         │  CI triggers on PR/push              │  Deploy to Docker
         ▼                                      │  Compose locally
┌──────────────────┐                     ┌──────────────────┐
│  GitHub Actions  │                     │  Docker Compose  │
│  CI (ci.yml)     │                     │  (mongo, backend,│
│                  │                     │   frontend,agent)│
└──────────────────┘                     └──────────────────┘
```

## Components

### 1. GitHub Actions CI (`ci.yml`)

**Trigger:** `pull_request` and `push` to `main`.

**Jobs (parallel):**

**Backend:**
- runs-on: ubuntu-latest
- working-directory: backend
- actions/checkout@v4 → actions/setup-node@v4 (node-version: 18, cache: npm) → npm ci → npm run build → npm test → npm run lint

**Frontend:**
- runs-on: ubuntu-latest
- working-directory: frontend
- actions/checkout@v4 → actions/setup-node@v4 (node-version: 20, cache: npm) → npm ci → npm run build → npm test

**Concurrency:** `cancel-in-progress: true` — stale runs on the same branch are cancelled.

**Permissions:** `contents: read` by default — no write tokens for PR workflows.

**Dependency caching:** Per-package `cache-dependency-path` ensures each lockfile is cached independently.

### 2. AI Release Manager (`agent/`)

A Node.js + Express webhook server. Stateless — no database. Runs as a Docker container.

#### File structure

```
agent/
├── Dockerfile                  # Multi-stage: Node 20 Alpine build → run
├── package.json                # express, octokit, openai, @anthropic-ai/sdk
├── tsconfig.json
└── src/
    ├── index.ts                # Express server, webhook route, HMAC-SHA256 verification
    ├── config.ts               # Reads env vars, validates required fields
    ├── github.ts               # GitHub App JWT auth → installation token → Octokit client
    ├── webhooks.ts             # Event router: pull_request → PR comment, push → release
    ├── llm.ts                  # Unified interface: LLMProvider interface + factory
    ├── llm-openai.ts           # OpenAI implementation
    ├── llm-claude.ts           # Claude implementation
    ├── llm-ollama.ts           # Ollama implementation
    ├── changelog.ts            # Fetches commits since last tag, groups by type
    ├── release.ts              # Version bump (semver), git tag, GitHub Release creation
    └── pr-comment.ts           # Formats PR comment with release impact table
```

#### Event flows

**PR opened / synchronized:**
1. GitHub sends `pull_request` webhook → `index.ts` verifies HMAC-SHA256 signature
2. `webhooks.ts` extracts PR number, base ref, head ref
3. `changelog.ts` fetches diff via Octokit (list of files + patch lines)
4. `llm.ts` sends structured prompt: "Analyze this diff. Classify changes as breaking / feature / fix / chore. Suggest semver bump (major/minor/patch)."
5. `pr-comment.ts` formats LLM response into a Markdown table
6. `github.ts` posts comment on PR via Octokit

**Push to main:**
1. GitHub sends `push` webhook → `index.ts` verifies signature
2. `webhooks.ts` extracts commits list
3. `changelog.ts` fetches commits since last git tag (via `git tag --sort=-version:refname` or GitHub compare API)
4. `llm.ts` sends structured prompt: "Generate a changelog from these commits. Sections: Features, Bug Fixes, Chores, Breaking Changes."
5. `release.ts` reads current version from `backend/package.json`, bumps semver, updates both `package.json` files (or just the relevant ones)
6. `github.ts` creates git tag `vX.Y.Z` + GitHub Release with LLM-generated body
7. Push tag and commit back to repo

#### LLM Adapter

```typescript
// llm.ts
interface LLMProvider {
  generate(systemPrompt: string, userPrompt: string): Promise<string>;
}

// Selected via LLM_PROVIDER env var: "openai" | "claude" | "ollama"
// Each implementation file exports a factory function
// Prompt templates are constants, not embedded in adapter logic
```

Supported providers: OpenAI (GPT-4o-mini default), Claude (Sonnet), Ollama (local).

Provider configuration lives entirely in environment variables — no code changes needed.

#### GitHub App

The agent authenticates as a GitHub App:
- App ID + Private Key → JWT → Installation Token → Octokit
- Required webhook events: `pull_request`, `push`
- Required permissions: `contents: write`, `pull_requests: write`, `metadata: read`

Webhook URL points to the agent's public endpoint (via `ngrok` in local dev; via cloud URL in production).

### 3. Docker Compose — Agent Service

```yaml
agent:
  build:
    context: ./agent
    dockerfile: Dockerfile
  container_name: tft-bible-agent
  ports:
    - "3000:3000"
  environment:
    - NODE_ENV=production
    - PORT=3000
    - GITHUB_APP_ID=${GITHUB_APP_ID}
    - GITHUB_PRIVATE_KEY=${GITHUB_PRIVATE_KEY}
    - GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
    - LLM_PROVIDER=${LLM_PROVIDER:-openai}
    - LLM_API_KEY=${LLM_API_KEY}
    - LLM_MODEL=${LLM_MODEL:-gpt-4o-mini}
  restart: unless-stopped
```

The agent does not depend on mongo/backend/frontend. It can run standalone.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Webhook signature mismatch | 401 response, logged, no action |
| LLM API timeout / rate limit | Fall back to rule-based conventional-commit changelog |
| GitHub API rate limit | Respect `Retry-After` header, queue webhook for retry |
| Version bump conflict (concurrent push) | Skip, log warning, comment on commit |
| Non-main branch push | Ignored (webhook filters to main only) |
| Missing env vars | Agent fails to start with clear error message |

## Testing

- **Unit tests** for `changelog.ts`, `llm.ts`, `pr-comment.ts`, `release.ts`
- Mock GitHub API (Octokit) and LLM responses
- Manual end-to-end test with `ngrok` exposing local agent to GitHub webhooks
- No integration test suite initially

## Future: Production Deployment

When ready to move off local Docker:
1. Deploy agent as a single container to Railway / Fly.io / Google Cloud Run
2. Set environment variables there (no `.env`)
3. Point GitHub App webhook URL to deployed endpoint
4. CI stays unchanged — it runs in GitHub Actions

## Self-Review

- No TBDs or placeholders
- Architecture is consistent: webhook → LLM → release pipeline
- Scope focused: CI pipeline + single-purpose AI bot service
- Requirements unambiguous: PR comments, release automation, configurable LLM, Docker-local operation
- Not over-engineered: no database, no kubernetes, no monitoring stack
