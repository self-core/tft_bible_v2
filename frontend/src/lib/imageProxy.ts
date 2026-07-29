const PROXY_BASE = '/api/images/proxy';

/**
 * Rewrite a CDN image URL to route through the backend image proxy.
 * Returns null if input is null/undefined (preserves falsy handling).
 */
export function proxyUrl(cdnUrl: string | null | undefined): string | undefined {
  if (!cdnUrl) return undefined;
  return `${PROXY_BASE}?url=${encodeURIComponent(cdnUrl)}`;
}
