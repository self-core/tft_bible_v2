# Image Proxy + Disk Cache Design

## Problem

All champion, item, augment, and trait images are served directly from the
CommunityDragon CDN. This causes:

- Slow first loads (each image is a separate HTTPS round-trip)
- No offline support
- CDN dependency for every page render
- No control over caching headers

## Solution

A backend image proxy that fetches CDN images once, caches them to disk,
and serves them locally on subsequent requests. Frontend rewrites `<img>`
src attributes to route through the proxy.

## Architecture

```
Browser → /api/images/proxy?url=<encoded> → Backend
                                              ↓
                                    Disk cache hit? → stream from disk
                                    Disk cache miss? → fetch CDN → write disk → stream
```

## Backend: Image Proxy Endpoint

### Route

`GET /api/images/proxy?url=<encodedCdnUrl>`

### Flow

1. Decode `url` query parameter
2. Validate URL is from whitelisted host (`raw.communitydragon.org`)
3. Generate cache filename: SHA-256 of full URL, first 16 hex chars + `.png`
4. Check disk at `/app/dragontail-data/images/<hash>.png`
5. If found → stream file with `Cache-Control: public, max-age=86400`
6. If not found → fetch from CDN (10s timeout) → write to disk → stream to client
7. On CDN error → return 404 (frontend `onerror` handles fallback)

### Security

- **Whitelist:** Only `raw.communitydragon.org` URLs allowed (prevents open proxy)
- **Timeout:** 10-second fetch timeout
- **Max size:** 500KB file size sanity check
- **Extension:** Derived from Content-Type header or URL path (`.png`, `.jpg`)

### Location in codebase

New file: `backend/src/routes/imageProxy.ts`
Registered in: `backend/src/server.ts` (after existing middleware, before Apollo)

## Frontend: URL Rewriting

### Utility function

```typescript
// src/lib/imageProxy.ts
const PROXY_BASE = '/api/images/proxy';

export function proxyUrl(cdnUrl: string | null | undefined): string | null {
  if (!cdnUrl) return null;
  return `${PROXY_BASE}?url=${encodeURIComponent(cdnUrl)}`;
}
```

### Components to update

Replace `<img src={item.imageUrl}>` with `<img src={proxyUrl(item.imageUrl)}>`:

| File                     | Fields to wrap           |
|--------------------------|--------------------------|
| `Champions.tsx`          | `champion.iconUrl`       |
| `Items.tsx`              | `item.imageUrl`          |
| `Augments.tsx`           | `augment.imageUrl`       |
| `SetDetail.tsx`          | `champion.iconUrl`, `item.imageUrl`, `augment.imageUrl` |
| `Home.tsx`               | `champ.iconUrl`          |
| `ImprovedTeamBuilder.tsx` | `champion.iconUrl`, `champion.imageUrl` |
| `TraitTrackerPage.tsx`   | `champion.imageUrl`      |
| `TFTBoard.tsx`           | `unit.iconUrl`           |
| `CompositionDetail.tsx`  | via `icon_url` mapping   |

### No data layer changes

CDN URLs remain in the database and embedded fallback data. The proxy is
transparent — only the `<img>` rendering layer changes.

## Proxy Configuration

### Vite dev (both configs)

Add to proxy object in `vite.config.ts` and `vite.mock.config.ts`:

```typescript
'/api/images': {
  target: 'http://localhost:4000',
  changeOrigin: true,
}
```

### Nginx production

Add to `nginx.conf` and `nginx.railway.conf`:

```nginx
location /api/images/ {
  proxy_pass http://backend:4000;
}
```

## Docker

### Existing bind mount

Images are cached to `/app/dragontail-data/images/` inside the backend
container. This uses the existing bind mount — no new Docker volumes.

### Backend Dockerfile

The Dockerfile already creates `/app/dragontail-data` as a directory.
No Dockerfile changes needed — the proxy writes subdirectories on demand.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Missing `url` param | 400 Bad Request |
| URL not on whitelist | 403 Forbidden |
| CDN returns 404 | 404 from proxy (frontend shows placeholder) |
| CDN timeout | 504 Gateway Timeout |
| Disk write failure | Stream from CDN anyway (no cache, still works) |
| Cache dir doesn't exist | Create on first write (`mkdirSync recursive`) |

## Testing

1. Unit tests for URL validation, hashing, whitelist logic
2. Integration test: mock CDN response, verify disk write + cache hit
3. Manual test: load Champions page, verify images load, check disk for cached files
