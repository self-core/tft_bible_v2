# Image Proxy + Disk Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend image proxy that caches CommunityDragon CDN images to disk, and rewrite frontend `<img>` src attributes to route through it.

**Architecture:** New `GET /api/images/proxy?url=<encoded>` Express endpoint fetches CDN images once, writes to `/app/dragontail-data/images/`, and serves from disk on subsequent requests. Frontend wraps all image URLs with a `proxyUrl()` utility.

**Tech Stack:** Node.js/Express (backend), native `fetch` API (Node 18+), React (frontend), Vite proxy, Nginx proxy

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `backend/src/routes/imageProxy.ts` | Image proxy endpoint handler |
| Modify | `backend/src/server.ts:82-85` | Register the `/api/images` route |
| Create | `frontend/src/lib/imageProxy.ts` | `proxyUrl()` utility function |
| Modify | `frontend/src/pages/Champions.tsx:93` | Wrap `iconUrl` with `proxyUrl()` |
| Modify | `frontend/src/pages/Items.tsx:74` | Wrap `imageUrl` with `proxyUrl()` |
| Modify | `frontend/src/pages/Augments.tsx:78` | Wrap `imageUrl` with `proxyUrl()` |
| Modify | `frontend/src/pages/SetDetail.tsx:69,148,182` | Wrap iconUrl/imageUrl/augmentUrl |
| Modify | `frontend/src/pages/Home.tsx:286` | Wrap `champ.iconUrl` |
| Modify | `frontend/src/pages/ImprovedTeamBuilder.tsx:29,74` | Wrap iconUrl/imageUrl |
| Modify | `frontend/src/pages/TraitTrackerPage.tsx:96,143,167,188` | Wrap `champion.imageUrl` |
| Modify | `frontend/src/components/TFTBoard.tsx:232` | Wrap SVG `<image>` href |
| Modify | `frontend/vite.config.ts:9-21` | Add `/api/images` proxy |
| Modify | `frontend/vite.mock.config.ts:15-23` | Add `/api/images` proxy |

---

## Task 1: Create the Image Proxy Endpoint

**Files:**
- Create: `backend/src/routes/imageProxy.ts`

- [ ] **Step 1: Create the image proxy route file**

```typescript
// backend/src/routes/imageProxy.ts
import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

const CACHE_DIR = process.env.IMAGE_CACHE_DIR || '/app/dragontail-data/images';
const ALLOWED_HOSTS = ['raw.communitydragon.org'];
const FETCH_TIMEOUT_MS = 10_000;
const MAX_FILE_SIZE = 500_000; // 500KB

function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

function getExtension(url: string, contentType: string | null): string {
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  // Fallback: guess from URL path
  const urlPath = new URL(url).pathname;
  if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) return '.jpg';
  if (urlPath.endsWith('.webp')) return '.webp';
  return '.png';
}

export async function imageProxyHandler(req: Request, res: Response) {
  const targetUrl = req.query.url as string | undefined;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  if (!isAllowedUrl(targetUrl)) {
    return res.status(403).json({ error: 'URL host not on allowlist' });
  }

  const hash = hashUrl(targetUrl);

  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Check for any cached file with this hash
  const cachedFile = findCachedFile(hash);
  if (cachedFile) {
    return serveFile(cachedFile, res);
  }

  // Fetch from CDN
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'TFT-Bible/1.0' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: `CDN returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type');
    const ext = getExtension(targetUrl, contentType);
    const cachePath = join(CACHE_DIR, `${hash}${ext}`);

    // Stream response to disk and to client simultaneously
    if (response.body) {
      const nodeStream = readableFromWeb(response.body);
      const diskWrite = pipeline(nodeStream, createWriteStream(cachePath));

      // Also serve to client — read the file after write completes
      await diskWrite;
      serveFile(cachePath, res);
    } else {
      return res.status(502).json({ error: 'Empty response from CDN' });
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'CDN fetch timed out' });
    }
    return res.status(502).json({ error: 'Failed to fetch from CDN' });
  }
}

function findCachedFile(hash: string): string | null {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
    const path = join(CACHE_DIR, `${hash}${ext}`);
    if (existsSync(path)) return path;
  }
  return null;
}

function serveFile(filePath: string, res: Response) {
  const data = readFileSync(filePath);
  const ext = filePath.split('.').pop() || 'png';
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  res.setHeader('Content-Type', mimeMap[ext] || 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(data);
}

// Convert a web ReadableStream to a Node.js Readable stream
function readableFromWeb(webStream: ReadableStream<Uint8Array>): import('stream').Readable {
  const { Readable } = require('stream');
  const reader = webStream.getReader();
  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
      } else {
        this.push(Buffer.from(value));
      }
    },
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && npx tsc --noEmit src/routes/imageProxy.ts`
Expected: No errors

---

## Task 2: Register the Route in server.ts

**Files:**
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Add import and route registration**

Add the import at the top of `server.ts` (after line 12):
```typescript
import { imageProxyHandler } from './routes/imageProxy';
```

Add the route after the health check (after line 85, before `app.listen`):
```typescript
  // Image proxy endpoint — caches CDN images to disk
  app.get('/api/images/proxy', imageProxyHandler);
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && npm run build`
Expected: Build succeeds with no errors

---

## Task 3: Create Frontend proxyUrl Utility

**Files:**
- Create: `frontend/src/lib/imageProxy.ts`

- [ ] **Step 1: Create the utility file**

```typescript
// frontend/src/lib/imageProxy.ts

const PROXY_BASE = '/api/images/proxy';

/**
 * Rewrite a CDN image URL to route through the backend image proxy.
 * Returns null if input is null/undefined (preserves falsy handling).
 */
export function proxyUrl(cdnUrl: string | null | undefined): string | null {
  if (!cdnUrl) return null;
  return `${PROXY_BASE}?url=${encodeURIComponent(cdnUrl)}`;
}
```

---

## Task 4: Update Frontend Pages to Use proxyUrl

**Files:**
- Modify: `frontend/src/pages/Champions.tsx`
- Modify: `frontend/src/pages/Items.tsx`
- Modify: `frontend/src/pages/Augments.tsx`
- Modify: `frontend/src/pages/SetDetail.tsx`
- Modify: `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/pages/ImprovedTeamBuilder.tsx`
- Modify: `frontend/src/pages/TraitTrackerPage.tsx`
- Modify: `frontend/src/components/TFTBoard.tsx`

- [ ] **Step 1: Champions.tsx — wrap iconUrl**

At the top of the file, add the import:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On line 93, change:
```tsx
src={champion.iconUrl}
```
to:
```tsx
src={proxyUrl(champion.iconUrl)}
```

- [ ] **Step 2: Items.tsx — wrap imageUrl**

Add import at top:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On line 74, change:
```tsx
<img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover"
```
to:
```tsx
<img src={proxyUrl(item.imageUrl)} alt={item.name} className="w-16 h-16 rounded-lg object-cover"
```

- [ ] **Step 3: Augments.tsx — wrap imageUrl**

Add import at top:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On line 78, change:
```tsx
<img src={augment.imageUrl} alt={augment.name} className="w-full h-full rounded object-cover"
```
to:
```tsx
<img src={proxyUrl(augment.imageUrl)} alt={augment.name} className="w-full h-full rounded object-cover"
```

- [ ] **Step 4: SetDetail.tsx — wrap iconUrl, imageUrl, augment.imageUrl**

Add import at top:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On line 69, change:
```tsx
src={champion.iconUrl}
```
to:
```tsx
src={proxyUrl(champion.iconUrl)}
```

On line 148, change:
```tsx
src={item.imageUrl}
```
to:
```tsx
src={proxyUrl(item.imageUrl)}
```

On line 182, change:
```tsx
src={augment.imageUrl}
```
to:
```tsx
src={proxyUrl(augment.imageUrl)}
```

- [ ] **Step 5: Home.tsx — wrap champ.iconUrl**

Add import at top:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On line 286, change:
```tsx
src={champ.iconUrl}
```
to:
```tsx
src={proxyUrl(champ.iconUrl)}
```

- [ ] **Step 6: ImprovedTeamBuilder.tsx — wrap iconUrl/imageUrl in drag data and img src**

Add import at top:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On line 29, change:
```tsx
e.dataTransfer.setData('text/champion-icon', champion.iconUrl || champion.imageUrl || '');
```
to:
```tsx
e.dataTransfer.setData('text/champion-icon', proxyUrl(champion.iconUrl || champion.imageUrl) || '');
```

On line 74, change:
```tsx
<img src={champion.iconUrl || champion.imageUrl} alt={champion.name}
```
to:
```tsx
<img src={proxyUrl(champion.iconUrl || champion.imageUrl)} alt={champion.name}
```

- [ ] **Step 7: TraitTrackerPage.tsx — wrap champion.imageUrl (4 occurrences)**

Add import at top:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On lines 96, 143, 167, and 188, change each:
```tsx
src={champion.imageUrl}
```
to:
```tsx
src={proxyUrl(champion.imageUrl)}
```

And on line 188:
```tsx
src={selectedChampion.imageUrl}
```
to:
```tsx
src={proxyUrl(selectedChampion.imageUrl)}
```

- [ ] **Step 8: TFTBoard.tsx — wrap SVG image href**

Add import at top:
```typescript
import { proxyUrl } from '../lib/imageProxy';
```

On line 232, change:
```tsx
href={unit.iconUrl}
```
to:
```tsx
href={proxyUrl(unit.iconUrl) || ''}
```

- [ ] **Step 9: Verify frontend compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

---

## Task 5: Update Vite Dev Proxy

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/vite.mock.config.ts`

- [ ] **Step 1: Add /api/images proxy to vite.config.ts**

After the `/health` proxy block (after line 20), add:
```typescript
      '/api/images': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
```

- [ ] **Step 2: Add /api/images proxy to vite.mock.config.ts**

After the `/graphql` proxy block (after line 22), add:
```typescript
      '/api/images': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
```

- [ ] **Step 3: Verify both configs parse**

Run: `cd frontend && npx vite build --mode development 2>&1 | head -5`
Expected: Build starts without config errors

---

## Task 6: Update Nginx Production Configs

**Files:**
- Modify: `frontend/nginx.conf`
- Modify: `frontend/nginx.railway.conf`

- [ ] **Step 1: Add image proxy location to nginx.conf**

After the `/api/` location block (after line 49), add:
```nginx
    # Image proxy — forward to backend cache
    location /api/images/ {
        proxy_pass http://backend:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 15s;
    }
```

Note: The existing `location /api/` block already proxies to the backend, so `/api/images/` will match that first. We should either rely on the existing `/api/` block or add a specific `/api/images/` block before it. Since nginx uses longest-prefix match, adding a specific `/api/images/` block is safer.

Actually, the existing `/api/` block at line 35-49 already covers `/api/images/`. No changes needed to `nginx.conf` — the proxy will work as-is.

- [ ] **Step 2: Add image proxy to nginx.railway.conf**

After the `/health` location block (after line 43), add:
```nginx
    # Image proxy — forward to backend cache
    location /api/images/ {
        proxy_pass http://backend:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 15s;
    }
```

---

## Task 7: Build, Restart, and Verify

- [ ] **Step 1: Build backend**

Run: `cd backend && npm run build`
Expected: Build succeeds

- [ ] **Step 2: Restart backend container**

Run: `docker restart tft-bible-backend`
Expected: Container restarts, logs show server ready

- [ ] **Step 3: Verify proxy endpoint works**

Run: `curl "http://localhost:4000/api/images/proxy?url=https%3A%2F%2Fraw.communitydragon.org%2Flatest%2Fplugins%2Frcp-be-lol-game-data%2Fglobal%2Fdefault%2Fv1%2Fchampion-icons%2F103.png" -o test.png`
Expected: Downloads a PNG file, `file test.png` shows PNG image

- [ ] **Step 4: Verify cache was written**

Run: `ls -la /path/to/dragontail-data/images/`
Expected: A file like `a1b2c3d4e5f6g7h8.png` exists

- [ ] **Step 5: Verify second request is served from cache**

Run: `curl -w "%{time_total}" "http://localhost:4000/api/images/proxy?url=https%3A%2F%2Fraw.communitydragon.org%2Flatest%2Fplugins%2Frcp-be-lol-game-data%2Fglobal%2Fdefault%2Fv1%2Fchampion-icons%2F103.png" -o /dev/null`
Expected: Fast response (< 50ms), no CDN fetch

- [ ] **Step 6: Start frontend dev server and test in browser**

Run: `cd frontend && npx vite --config vite.mock.config.ts`
Expected: Server starts on port 3001

Open browser: `http://localhost:3001`
Navigate to Champions page — images should load through proxy
Check browser DevTools Network tab — image requests should go to `/api/images/proxy?url=...`

- [ ] **Step 7: Commit all changes**

```bash
git add -A
git commit -m "feat: add backend image proxy with disk cache

- New GET /api/images/proxy endpoint caches CDN images to disk
- Frontend proxyUrl() utility rewrites all image src attributes
- Vite dev proxy configured for /api/images
- Nginx production config updated
- Fixes broken CommunityDragon image URLs"
```
