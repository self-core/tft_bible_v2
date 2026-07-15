import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { access, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const CACHE_DIR =
  process.env.IMAGE_CACHE_DIR ||
  (process.env.NODE_ENV === 'production'
    ? '/app/dragontail-data/images'
    : './cache/images');
const ALLOWED_HOSTS = ['raw.communitydragon.org'];
const FETCH_TIMEOUT_MS = 10_000;
const MAX_FILE_SIZE = 500_000;

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const inflight = new Map<string, Promise<string>>();

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
  if (contentType?.includes('jpeg') || contentType?.includes('jpg'))
    return '.jpg';
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  const urlPath = new URL(url).pathname;
  if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) return '.jpg';
  if (urlPath.endsWith('.webp')) return '.webp';
  return '.png';
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

async function findCachedFile(hash: string): Promise<string | null> {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
    const path = join(CACHE_DIR, `${hash}${ext}`);
    try {
      await access(path);
      return path;
    } catch {
      // not found, continue
    }
  }
  return null;
}

async function fetchAndCache(
  targetUrl: string,
  cachePath: string,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const response = await fetch(targetUrl, {
    signal: controller.signal,
    headers: { 'User-Agent': 'TFT-Bible/1.0' },
    redirect: 'error',
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`CDN returned ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
    throw new Error('Response too large');
  }

  if (!response.body) {
    throw new Error('Empty response from CDN');
  }

  // Node.js ReadableStream and Web ReadableStream have incompatible types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeStream = Readable.fromWeb(response.body as any);

  const fileStream = createWriteStream(cachePath);
  let totalBytes = 0;

  return new Promise<string>((resolve, reject) => {
    nodeStream.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_FILE_SIZE) {
        fileStream.destroy();
        reject(new Error('Response too large'));
      }
    });

    pipeline(nodeStream, fileStream)
      .then(() => resolve(cachePath))
      .catch(reject);
  });
}

async function serveFile(filePath: string, res: Response): Promise<void> {
  const ext = (filePath.split('.').pop() || 'png').toLowerCase();
  const fileStat = await stat(filePath);
  res.setHeader('Content-Type', MIME_MAP[ext] || 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Content-Length', fileStat.size);
  createReadStream(filePath).pipe(res);
}

export async function imageProxyHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const targetUrl = req.query.url as string | undefined;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  if (!isAllowedUrl(targetUrl)) {
    res.status(403).json({ error: 'URL host not on allowlist' });
    return;
  }

  const hash = hashUrl(targetUrl);

  await ensureCacheDir();

  const cachedFile = await findCachedFile(hash);
  if (cachedFile) {
    serveFile(cachedFile, res);
    return;
  }

  const ext = getExtension(targetUrl, null);
  const cachePath = join(CACHE_DIR, `${hash}${ext}`);

  try {
    if (!inflight.has(hash)) {
      inflight.set(hash, fetchAndCache(targetUrl, cachePath));
    }

    const servedPath = await inflight.get(hash)!;
    inflight.delete(hash);
    serveFile(servedPath, res);
  } catch (err: unknown) {
    inflight.delete(hash);
    const message =
      err instanceof Error ? err.message : 'Failed to fetch from CDN';

    if (message.includes('timed out') || (err as Error).name === 'AbortError') {
      res.status(504).json({ error: 'CDN fetch timed out' });
      return;
    }
    if (message.includes('Response too large')) {
      res.status(413).json({ error: 'Response exceeds size limit' });
      return;
    }
    if (message.includes('CDN returned')) {
      const status = Number(message.split(' ').pop()) || 502;
      res.status(status).json({ error: message });
      return;
    }
    res.status(502).json({ error: 'Failed to fetch from CDN' });
  }
}
