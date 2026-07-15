import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const CACHE_DIR = process.env.IMAGE_CACHE_DIR || '/app/dragontail-data/images';
const ALLOWED_HOSTS = ['raw.communitydragon.org'];
const FETCH_TIMEOUT_MS = 10_000;
const MAX_FILE_SIZE = 500_000;

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

  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  const cachedFile = findCachedFile(hash);
  if (cachedFile) {
    return serveFile(cachedFile, res);
  }

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

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as any);
      await pipeline(nodeStream, createWriteStream(cachePath));
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
