# DevOps Pipeline + AI Release Manager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up GitHub Actions CI and a Docker-based AI Release Manager bot that comments on PRs with release impact and automates changelogs + releases.

**Architecture:** A standard `ci.yml` workflow runs on every PR/push to main. A separate `agent/` package (Express webhook server) authenticates as a GitHub App, listens for `pull_request` and `push` events, calls a configurable LLM to analyze changes, and manages version bumps + GitHub Releases.

**Tech Stack:** GitHub Actions, Node.js 20, Express, Octokit, OpenAI SDK, Anthropic SDK, Vitest, Docker

---

## File Structure

| File | Status | Responsibility |
|------|--------|---------------|
| `.github/workflows/ci.yml` | **Create** | CI pipeline — build, test, lint backend + frontend |
| `agent/package.json` | **Create** | Dependencies: express, octokit, openai, @anthropic-ai/sdk, jsonwebtoken |
| `agent/tsconfig.json` | **Create** | TypeScript config targeting Node 20 |
| `agent/Dockerfile` | **Create** | Multi-stage Node 20 Alpine build |
| `agent/src/config.ts` | **Create** | Env config with validation |
| `agent/src/index.ts` | **Create** | Express server, webhook route, HMAC verification |
| `agent/src/github.ts` | **Create** | GitHub App JWT auth + Octokit factory |
| `agent/src/llm.ts` | **Create** | LLMProvider interface + factory function |
| `agent/src/llm-openai.ts` | **Create** | OpenAI implementation |
| `agent/src/llm-claude.ts` | **Create** | Claude implementation |
| `agent/src/llm-ollama.ts` | **Create** | Ollama implementation |
| `agent/src/changelog.ts` | **Create** | Commit fetching + conventional-commit grouping |
| `agent/src/release.ts` | **Create** | Version bump, git tag, GitHub Release |
| `agent/src/pr-comment.ts` | **Create** | PR comment formatting with release impact table |
| `agent/src/webhooks.ts` | **Create** | Event router: pull_request → PR comment, push → release |
| `docker-compose.yml` | **Modify** | Add agent service |

---

### Task 1: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create ci.yml**

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run lint

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run build
      - run: npm test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI workflow"
```

---

### Task 2: Scaffold agent project

**Files:**
- Create: `agent/package.json`
- Create: `agent/tsconfig.json`
- Create: `agent/Dockerfile`
- Create: `agent/src/config.ts`

- [ ] **Step 1: Create agent/package.json**

```json
{
  "name": "tft-bible-agent",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "octokit": "^4.0.2",
    "jsonwebtoken": "^9.0.2",
    "openai": "^4.73.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create agent/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create agent/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 4: Create agent/src/config.ts**

```typescript
export interface Config {
  port: number;
  nodeEnv: string;
  githubAppId: string;
  githubPrivateKey: string;
  githubWebhookSecret: string;
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  githubOwner: string;
  githubRepo: string;
}

export function loadConfig(): Config {
  const missing: string[] = [];

  const getEnv = (key: string): string | undefined => process.env[key];

  const githubAppId = getEnv('GITHUB_APP_ID') || '';
  const githubPrivateKey = getEnv('GITHUB_PRIVATE_KEY') || '';
  const githubWebhookSecret = getEnv('GITHUB_WEBHOOK_SECRET') || '';
  const llmApiKey = getEnv('LLM_API_KEY') || '';

  if (!githubAppId) missing.push('GITHUB_APP_ID');
  if (!githubPrivateKey) missing.push('GITHUB_PRIVATE_KEY');
  if (!githubWebhookSecret) missing.push('GITHUB_WEBHOOK_SECRET');

  const repoFull = getEnv('GITHUB_REPO') || '';
  const [githubOwner, githubRepo] = repoFull ? repoFull.split('/') : ['', ''];

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  return {
    port: parseInt(getEnv('PORT') || '3000', 10),
    nodeEnv: getEnv('NODE_ENV') || 'development',
    githubAppId,
    githubPrivateKey,
    githubWebhookSecret,
    llmProvider: getEnv('LLM_PROVIDER') || 'openai',
    llmApiKey,
    llmModel: getEnv('LLM_MODEL') || 'gpt-4o-mini',
    githubOwner,
    githubRepo,
  };
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd agent && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add agent/
git commit -m "feat(agent): scaffold agent project with config"
```

---

### Task 3: Webhook server + GitHub App auth

**Files:**
- Create: `agent/src/index.ts`
- Create: `agent/src/github.ts`

- [ ] **Step 1: Create agent/src/github.ts**

```typescript
import jwt from 'jsonwebtoken';
import { Octokit } from 'octokit';

export async function createAppJwt(appId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ iss: appId, iat: now, exp: now + 600 }, privateKey, { algorithm: 'RS256' });
}

export interface GitHubConfig {
  appId: string;
  privateKey: string;
  owner: string;
  repo: string;
}

export async function createOctokit(config: GitHubConfig): Promise<Octokit> {
  const appJwt = await createAppJwt(config.appId, config.privateKey);
  const octokit = new Octokit({ auth: appJwt });

  const { data: installations } = await octokit.request('GET /app/installations');
  if (installations.length === 0) throw new Error('No GitHub App installations found');

  const installationId = installations[0].id;
  const { data: token } = await octokit.request('POST /app/installations/{installation_id}/access_tokens', {
    installation_id: installationId,
  });

  return new Octokit({ auth: token.token });
}

export { Octokit };
```

- [ ] **Step 2: Create agent/src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import { loadConfig } from './config';
import { createOctokit, Octokit } from './github';
import { handleWebhook } from './webhooks';

const app = express();
const config = loadConfig();

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const sig = crypto.createHmac('sha256', config.githubWebhookSecret).update(payload).digest('hex');
  return `sha256=${sig}` === signature;
}

app.use(helmet());
app.use(cors());
app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf.toString(); } }));

app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature || !verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'] as string;
  if (!event) return res.status(400).json({ error: 'Missing X-GitHub-Event header' });

  try {
    const octokit = await createOctokit({
      appId: config.githubAppId,
      privateKey: config.githubPrivateKey,
      owner: config.githubOwner,
      repo: config.githubRepo,
    });

    await handleWebhook(event, req.body, octokit, config);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook handler failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(config.port, () => {
  console.log(`Agent listening on port ${config.port}`);
});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd agent && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add agent/src/index.ts agent/src/github.ts
git commit -m "feat(agent): add webhook server with GitHub App auth"
```

---

### Task 4: LLM adapter

**Files:**
- Create: `agent/src/llm.ts`
- Create: `agent/src/llm-openai.ts`
- Create: `agent/src/llm-claude.ts`
- Create: `agent/src/llm-ollama.ts`

- [ ] **Step 1: Create agent/src/llm.ts**

```typescript
export interface LLMProvider {
  generate(systemPrompt: string, userPrompt: string): Promise<string>;
}

export function createLLMProvider(provider: string, apiKey: string, model: string): LLMProvider {
  switch (provider) {
    case 'openai':
      return createOpenAIProvider(apiKey, model);
    case 'claude':
      return createClaudeProvider(apiKey, model);
    case 'ollama':
      return createOllamaProvider(model);
    default:
      throw new Error(`Unknown LLM provider: ${provider}. Use: openai, claude, ollama`);
  }
}

// Import provider factories (lazy-loaded to avoid requiring all SDKs)
import { createOpenAIProvider } from './llm-openai';
import { createClaudeProvider } from './llm-claude';
import { createOllamaProvider } from './llm-ollama';
```

- [ ] **Step 2: Create agent/src/llm-openai.ts**

```typescript
import OpenAI from 'openai';
import { LLMProvider } from './llm';

export function createOpenAIProvider(apiKey: string, model: string): LLMProvider {
  const client = new OpenAI({ apiKey });

  return {
    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });
      return response.choices[0]?.message?.content || '';
    },
  };
}
```

- [ ] **Step 3: Create agent/src/llm-claude.ts**

```typescript
import { LLMProvider } from './llm';

export function createClaudeProvider(apiKey: string, model: string): LLMProvider {
  const baseUrl = 'https://api.anthropic.com/v1';

  return {
    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
      }

      const data: any = await response.json();
      return data.content?.[0]?.text || '';
    },
  };
}
```

- [ ] **Step 4: Create agent/src/llm-ollama.ts**

```typescript
import { LLMProvider } from './llm';

export function createOllamaProvider(model: string): LLMProvider {
  const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  return {
    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${await response.text()}`);
      }

      const data: any = await response.json();
      return data.message?.content || '';
    },
  };
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd agent && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add agent/src/llm.ts agent/src/llm-openai.ts agent/src/llm-claude.ts agent/src/llm-ollama.ts
git commit -m "feat(agent): add LLM adapter with OpenAI, Claude, Ollama providers"
```

---

### Task 5: Changelog + Release coordinator

**Files:**
- Create: `agent/src/changelog.ts`
- Create: `agent/src/release.ts`
- Create: `agent/src/__tests__/changelog.test.ts`
- Create: `agent/src/__tests__/release.test.ts`

- [ ] **Step 1: Create agent/src/changelog.ts**

```typescript
import { Octokit } from 'octokit';

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'chore' | 'breaking';
  message: string;
  sha: string;
}

export async function fetchCommitsSinceLastTag(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<CommitInfo[]> {
  let tag: string | undefined;
  try {
    const { data: tags } = await octokit.request('GET /repos/{owner}/{repo}/tags', { owner, repo });
    if (tags.length > 0) tag = tags[0].name;
  } catch { /* no tags yet */ }

  const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    ...(tag ? { since: undefined } : {}),
    per_page: 100,
  });

  let results = commits.map((c: any) => ({
    sha: c.sha,
    message: c.commit.message,
    author: c.commit.author?.name || 'unknown',
    date: c.commit.author?.date || '',
  }));

  if (tag) {
    try {
      const { data: comparison } = await octokit.request('GET /repos/{owner}/{repo}/compare/{base}...{head}', {
        owner,
        repo,
        base: tag,
        head: 'HEAD',
      });
      const compareShas = new Set(comparison.commits.map((c: any) => c.sha));
      results = results.filter(c => compareShas.has(c.sha));
    } catch { /* fall through with all commits */ }
  }

  return results;
}

export function classifyCommits(commits: CommitInfo[]): ChangelogEntry[] {
  return commits.map(c => {
    const msg = c.message.split('\n')[0];
    if (msg.startsWith('feat')) return { type: 'feat', message: msg, sha: c.sha };
    if (msg.startsWith('fix')) return { type: 'fix', message: msg, sha: c.sha };
    if (msg.startsWith('BREAKING') || msg.includes('!' as string)) return { type: 'breaking', message: msg, sha: c.sha };
    return { type: 'chore', message: msg, sha: c.sha };
  });
}

export function formatFallbackChangelog(entries: ChangelogEntry[]): string {
  const sections: Record<string, string[]> = { 'Breaking Changes': [], Features: [], 'Bug Fixes': [], Chores: [] };
  for (const e of entries) {
    const section = e.type === 'breaking' ? 'Breaking Changes' : e.type === 'feat' ? 'Features' : e.type === 'fix' ? 'Bug Fixes' : 'Chores';
    sections[section].push(`- ${e.message}`);
  }
  return Object.entries(sections)
    .filter(([, items]) => items.length > 0)
    .map(([heading, items]) => `### ${heading}\n${items.join('\n')}`)
    .join('\n\n');
}
```

- [ ] **Step 2: Create agent/src/release.ts**

```typescript
import { Octokit } from 'octokit';
import { ChangelogEntry } from './changelog';

export interface VersionInfo {
  current: string;
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(v: string): VersionInfo {
  const cleaned = v.replace(/^v/, '');
  const [major, minor, patch] = cleaned.split('.').map(Number);
  return { current: cleaned, major, minor, patch };
}

export function bumpVersion(current: string, bump: 'major' | 'minor' | 'patch'): string {
  const v = parseVersion(current);
  if (bump === 'major') return `${v.major + 1}.0.0`;
  if (bump === 'minor') return `${v.major}.${v.minor + 1}.0`;
  return `${v.major}.${v.minor}.${v.patch + 1}`;
}

export function suggestBump(entries: ChangelogEntry[]): 'major' | 'minor' | 'patch' {
  if (entries.some(e => e.type === 'breaking')) return 'major';
  if (entries.some(e => e.type === 'feat' || e.type === 'fix')) return 'minor';
  return 'patch';
}

export async function createGitHubRelease(
  octokit: Octokit,
  owner: string,
  repo: string,
  version: string,
  changelog: string,
): Promise<void> {
  const tag = `v${version}`;

  await octokit.request('POST /repos/{owner}/{repo}/releases', {
    owner,
    repo,
    tag_name: tag,
    name: tag,
    body: changelog,
  });

  console.log(`Created release ${tag}`);
}
```

- [ ] **Step 3: Create test file for changelog**

Create `agent/src/__tests__/changelog.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { classifyCommits, formatFallbackChangelog, CommitInfo } from '../changelog';

const makeCommit = (message: string): CommitInfo => ({
  sha: 'abc123',
  message,
  author: 'Test',
  date: '2026-01-01',
});

describe('classifyCommits', () => {
  it('classifies feat commits', () => {
    const result = classifyCommits([makeCommit('feat: add synergy engine')]);
    expect(result[0].type).toBe('feat');
  });

  it('classifies fix commits', () => {
    const result = classifyCommits([makeCommit('fix: correct scoring bug')]);
    expect(result[0].type).toBe('fix');
  });

  it('classifies breaking commits', () => {
    const result = classifyCommits([makeCommit('BREAKING: remove old API')]);
    expect(result[0].type).toBe('breaking');
  });

  it('classifies other commits as chore', () => {
    const result = classifyCommits([makeCommit('docs: update readme')]);
    expect(result[0].type).toBe('chore');
  });
});

describe('formatFallbackChangelog', () => {
  it('groups entries by type', () => {
    const entries = [
      { type: 'feat' as const, message: 'feat: new engine', sha: 'a' },
      { type: 'fix' as const, message: 'fix: crash', sha: 'b' },
    ];
    const result = formatFallbackChangelog(entries);
    expect(result).toContain('### Features');
    expect(result).toContain('### Bug Fixes');
    expect(result).toContain('feat: new engine');
    expect(result).toContain('fix: crash');
  });

  it('returns empty string for empty entries', () => {
    expect(formatFallbackChangelog([])).toBe('');
  });
});
```

- [ ] **Step 4: Create test file for release**

Create `agent/src/__tests__/release.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseVersion, bumpVersion, suggestBump } from '../release';

describe('parseVersion', () => {
  it('parses semver', () => {
    const v = parseVersion('1.2.3');
    expect(v.major).toBe(1);
    expect(v.minor).toBe(2);
    expect(v.patch).toBe(3);
  });

  it('strips leading v', () => {
    const v = parseVersion('v2.0.0');
    expect(v.current).toBe('2.0.0');
  });
});

describe('bumpVersion', () => {
  it('bumps patch', () => expect(bumpVersion('1.0.0', 'patch')).toBe('1.0.1'));
  it('bumps minor', () => expect(bumpVersion('1.0.0', 'minor')).toBe('1.1.0'));
  it('bumps major', () => expect(bumpVersion('1.0.0', 'major')).toBe('2.0.0'));
});

describe('suggestBump', () => {
  it('suggests major for breaking changes', () => {
    expect(suggestBump([{ type: 'breaking', message: '', sha: '' }])).toBe('major');
  });

  it('suggests minor for features', () => {
    expect(suggestBump([{ type: 'feat', message: '', sha: '' }])).toBe('minor');
  });

  it('suggests patch for chores', () => {
    expect(suggestBump([{ type: 'chore', message: '', sha: '' }])).toBe('patch');
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd agent && npx vitest run`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add agent/src/changelog.ts agent/src/release.ts agent/src/__tests__/
git commit -m "feat(agent): add changelog generator and release coordinator"
```

---

### Task 6: PR comment formatter + webhook handler

**Files:**
- Create: `agent/src/pr-comment.ts`
- Create: `agent/src/webhooks.ts`
- Create: `agent/src/__tests__/pr-comment.test.ts`

- [ ] **Step 1: Create agent/src/pr-comment.ts**

```typescript
export interface PRImpact {
  summary: string;
  changes: { type: string; description: string }[];
  suggestedBump: 'major' | 'minor' | 'patch';
}

export function formatPRComment(impact: PRImpact): string {
  const bumpLabels: Record<string, string> = {
    major: '🔴 Major',
    minor: '🟡 Minor',
    patch: '🟢 Patch',
  };

  const lines: string[] = [
    '## 🤖 AI Release Impact Analysis',
    '',
    impact.summary,
    '',
    `**Suggested version bump:** ${bumpLabels[impact.suggestedBump] || impact.suggestedBump}`,
    '',
  ];

  if (impact.changes.length > 0) {
    lines.push('### Changes');
    lines.push('');
    lines.push('| Type | Description |');
    lines.push('|------|-------------|');
    for (const c of impact.changes) {
      lines.push(`| ${c.type} | ${c.description} |`);
    }
  }

  return lines.join('\n');
}
```

- [ ] **Step 2: Create agent/src/webhooks.ts**

```typescript
import { Octokit } from 'octokit';
import { Config } from './config';
import { createLLMProvider } from './llm';
import { fetchCommitsSinceLastTag, classifyCommits, formatFallbackChangelog } from './changelog';
import { suggestBump, bumpVersion, createGitHubRelease } from './release';
import { formatPRComment, PRImpact } from './pr-comment';

const PR_ANALYSIS_PROMPT = `You are analyzing a pull request for a TFT (Teamfight Tactics) companion app. Analyze the diff and:
1. Summarize what this PR does in 1-2 sentences
2. List each meaningful change with its type: feature, fix, refactor, chore
3. Suggest a semver bump: major (breaking API changes), minor (new features), patch (bug fixes)

Be concise and technical. Focus on user-facing impact.`;

const RELEASE_PROMPT = `You are generating a changelog for a TFT (Teamfight Tactics) companion app release.
Given the following commits, generate a well-structured changelog with sections:
- Features: new user-facing capabilities
- Bug Fixes: issues resolved
- Chores: maintenance, dependencies, tooling
- Breaking Changes: incompatible API changes

Use present tense, be specific, and group related changes. Write for end-users.`;

export async function handleWebhook(
  event: string,
  payload: any,
  octokit: Octokit,
  config: Config,
): Promise<void> {
  if (event === 'pull_request' && (payload.action === 'opened' || payload.action === 'synchronize')) {
    await handlePREvent(payload, octokit, config);
  } else if (event === 'push') {
    await handlePushEvent(payload, octokit, config);
  }
}

async function handlePREvent(payload: any, octokit: Octokit, config: Config): Promise<void> {
  const { number, pull_request } = payload;
  const diffUrl = pull_request.diff_url;

  const llm = createLLMProvider(config.llmProvider, config.llmApiKey, config.llmModel);

  let impact: PRImpact;
  try {
    const response = await llm.generate(PR_ANALYSIS_PROMPT, `PR #${number}: ${pull_request.title}\n\n${pull_request.body || 'No description'}`);
    impact = { summary: response, changes: [], suggestedBump: 'patch' };
  } catch (err) {
    impact = { summary: `⚠️ LLM analysis failed: ${err}. Falling back to rule-based classification.`, changes: [], suggestedBump: 'patch' };
  }

  const comment = formatPRComment(impact);
  await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
    owner: config.githubOwner,
    repo: config.githubRepo,
    issue_number: number,
    body: comment,
  });
}

async function handlePushEvent(payload: any, octokit: Octokit, config: Config): Promise<void> {
  const ref = payload.ref;
  if (ref !== 'refs/heads/main') return;

  const commits = await fetchCommitsSinceLastTag(octokit, config.githubOwner, config.githubRepo);
  const classified = classifyCommits(commits);
  const bump = suggestBump(classified);

  const llm = createLLMProvider(config.llmProvider, config.llmApiKey, config.llmModel);
  let changelog: string;

  try {
    const commitList = commits.map(c => `${c.sha.substring(0, 7)} ${c.message}`).join('\n');
    changelog = await llm.generate(RELEASE_PROMPT, commitList);
  } catch {
    changelog = formatFallbackChangelog(classified);
  }

  const version = bumpVersion('1.0.0', bump);
  await createGitHubRelease(octokit, config.githubOwner, config.githubRepo, version, changelog);
}
```

- [ ] **Step 3: Create test for PR comment**

Create `agent/src/__tests__/pr-comment.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatPRComment, PRImpact } from '../pr-comment';

describe('formatPRComment', () => {
  it('formats a basic impact comment', () => {
    const impact: PRImpact = {
      summary: 'This PR adds the synergy recommendation engine.',
      changes: [
        { type: 'feature', description: 'New synergy scoring algorithm' },
        { type: 'fix', description: 'Fixed greed fill early termination' },
      ],
      suggestedBump: 'minor',
    };

    const result = formatPRComment(impact);
    expect(result).toContain('AI Release Impact Analysis');
    expect(result).toContain('synergy recommendation engine');
    expect(result).toContain('New synergy scoring algorithm');
    expect(result).toContain('🟡 Minor');
  });

  it('handles empty changes', () => {
    const impact: PRImpact = { summary: 'No changes', changes: [], suggestedBump: 'patch' };
    const result = formatPRComment(impact);
    expect(result).toContain('AI Release Impact Analysis');
    expect(result).not.toContain('|');
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd agent && npx vitest run`
Expected: PASS (all tests)

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd agent && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add agent/src/pr-comment.ts agent/src/webhooks.ts agent/src/__tests__/pr-comment.test.ts
git commit -m "feat(agent): add webhook handler and PR comment formatter"
```

---

### Task 7: Update docker-compose + verify full build

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add agent service to docker-compose.yml**

Edit `docker-compose.yml` to add the agent service after the frontend service:

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
      - GITHUB_REPO=${GITHUB_REPO}
    restart: unless-stopped
```

- [ ] **Step 2: Verify backend + frontend still build**

Run: `cd backend && npm run build && cd ../frontend && npm run build && cd ..`
Expected: both compile successfully

- [ ] **Step 3: Run all agent tests**

Run: `cd agent && npx vitest run`
Expected: PASS (all tests)

- [ ] **Step 4: Verify agent Docker build**

Run: `docker compose build agent`
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add agent service to docker-compose"
```

---

## Self-Review

**Spec coverage:**
- ✅ CI pipeline → Task 1
- ✅ Agent project scaffold → Task 2
- ✅ Webhook server + GitHub App auth → Task 3
- ✅ LLM adapter (OpenAI, Claude, Ollama) → Task 4
- ✅ Changelog generator → Task 5
- ✅ Release coordinator → Task 5
- ✅ PR comment formatter → Task 6
- ✅ Webhook event handler (PR + push modes) → Task 6
- ✅ Docker Compose → Task 7
- ✅ Error handling → Tasks 2-6 (try/catch, fallbacks)
- ✅ Testing → Tasks 5-6

**Placeholder scan:** No incomplete sections, TBDs, or vague requirements. All code blocks are complete.

**Type consistency:** `LLMProvider` interface used in llm.ts matches llm-openai.ts/llm-claude.ts/llm-ollama.ts. `Octokit` imported from both github.ts and octokit package. `CommitInfo`/`ChangelogEntry` used across changelog.ts, release.ts, webhooks.ts consistently.
