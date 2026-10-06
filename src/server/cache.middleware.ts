import type { IncomingHttpHeaders } from 'node:http';
import type { Request, Response, NextFunction } from 'express';

export const PRERENDER_ROUTES = new Set([
  '/sobre',
  '/anuncie',
  '/termos-privacidade',
  '/fale-conosco',
]);

const STATIC_ASSET_PATTERN = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/;

/** Headers that must not be forwarded from the upstream API. */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  // Dual HTML/JSON URLs must not inherit API cache semantics.
  'cache-control',
  'expires',
  'pragma',
  'etag',
  'last-modified',
  'vary',
  'age',
]);

export interface SsrCacheEntry {
  body: Buffer;
  headers: Record<string, string>;
  status: number;
  expiresAt: number;
}

/**
 * Páginas SSR já renderizadas. O TTL sozinho não libera memória: o Google pede
 * cada URL uma vez, e a entrada vencida só era removida se a mesma URL voltasse.
 * Qualquer acesso varre o que expirou. Quantidade e bytes têm teto; acima dele
 * a página continua sendo renderizada e respondida, só não fica retida.
 */
const ssrCache = new Map<string, SsrCacheEntry>();
let ssrCacheBytes = 0;

const DEFAULT_SSR_CACHE_MAX_ENTRIES = 400;
const DEFAULT_SSR_CACHE_MAX_BYTES = 32 * 1024 * 1024;

export function getSsrCacheTtl(): number {
  const ttl = parseInt(process.env['SSR_CACHE_TTL'] ?? '300', 10);
  return ttl > 0 ? ttl * 1000 : 0;
}

function readCacheLimit(name: string, fallback: number): number {
  const raw = globalThis.process?.env?.[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

/** `SSR_CACHE_MAX_ENTRIES`. `0` desliga a retenção. */
export function getSsrCacheMaxEntries(): number {
  return readCacheLimit('SSR_CACHE_MAX_ENTRIES', DEFAULT_SSR_CACHE_MAX_ENTRIES);
}

/** `SSR_CACHE_MAX_BYTES`. `0` desliga a retenção. */
export function getSsrCacheMaxBytes(): number {
  return readCacheLimit('SSR_CACHE_MAX_BYTES', DEFAULT_SSR_CACHE_MAX_BYTES);
}

export function getSsrCacheStats(): { entries: number; bytes: number } {
  return { entries: ssrCache.size, bytes: ssrCacheBytes };
}

export function clearSsrCache(): void {
  ssrCache.clear();
  ssrCacheBytes = 0;
}

function removeCachedSsrResponse(cacheKey: string): void {
  const cached = ssrCache.get(cacheKey);
  if (!cached) {
    return;
  }
  ssrCacheBytes -= cached.body.byteLength;
  ssrCache.delete(cacheKey);
}

function sweepExpiredSsrResponses(now: number): void {
  for (const [cacheKey, cached] of ssrCache) {
    if (cached.expiresAt <= now) {
      removeCachedSsrResponse(cacheKey);
    }
  }
}

function evictOverflowingSsrResponses(maxEntries: number, maxBytes: number): void {
  while (
    ssrCache.size > 0 &&
    (ssrCache.size > maxEntries || ssrCacheBytes > maxBytes)
  ) {
    const oldest = ssrCache.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    removeCachedSsrResponse(oldest);
  }
}

export function getCachedSsrResponse(cacheKey: string): SsrCacheEntry | undefined {
  sweepExpiredSsrResponses(Date.now());
  const cached = ssrCache.get(cacheKey);
  if (!cached) {
    return undefined;
  }
  // Map preserves insertion order; reinserting marks this URL as recently used.
  ssrCache.delete(cacheKey);
  ssrCache.set(cacheKey, cached);
  return cached;
}

export function setCachedSsrResponse(
  cacheKey: string,
  entry: SsrCacheEntry,
  limits?: { maxEntries: number; maxBytes: number },
): void {
  if (entry.status >= 500) {
    return;
  }

  const maxEntries = limits?.maxEntries ?? getSsrCacheMaxEntries();
  const maxBytes = limits?.maxBytes ?? getSsrCacheMaxBytes();
  if (maxEntries < 1 || maxBytes < 1 || entry.body.byteLength > maxBytes) {
    return;
  }

  sweepExpiredSsrResponses(Date.now());
  removeCachedSsrResponse(cacheKey);
  ssrCache.set(cacheKey, entry);
  ssrCacheBytes += entry.body.byteLength;
  evictOverflowingSsrResponses(maxEntries, maxBytes);
}

export function isStaticAsset(url: string): boolean {
  return STATIC_ASSET_PATTERN.test(url);
}

export function isPrerenderRoute(path: string): boolean {
  return PRERENDER_ROUTES.has(path);
}

export function isServerRenderRoute(path: string): boolean {
  return path.startsWith('/c/') || path.startsWith('/r/') || path === '/busca';
}

/** Rendered per request with catalog data (the build host cannot reach the API). */
export function isSsrCacheRoute(path: string): boolean {
  return path === '/' || isServerRenderRoute(path);
}

export function isApiProxyRoute(path: string): boolean {
  return (
    path.startsWith('/catalog') ||
    path.startsWith('/geography') ||
    path.startsWith('/categorias') ||
    path.startsWith('/clientes') ||
    path.startsWith('/busca') ||
    path.startsWith('/auth') ||
    path.startsWith('/usuarios') ||
    path.startsWith('/c/') ||
    path.startsWith('/r/')
  );
}

/**
 * Decide if a request to a dual HTML/JSON path should go to the API.
 * Prefer Sec-Fetch-Dest (document → SSR) so browsers never get JSON as the page.
 */
export function shouldProxyToApi(req: {
  path: string;
  headers: IncomingHttpHeaders;
}): boolean {
  if (!isApiProxyRoute(req.path)) {
    return false;
  }

  const dest = String(req.headers['sec-fetch-dest'] ?? '')
    .split(',')[0]
    ?.trim()
    .toLowerCase();

  // Top-level navigations must always render Angular HTML.
  if (dest === 'document' || dest === 'iframe') {
    return false;
  }

  // fetch()/XHR from the app (same URL as the page for /c, /r, /busca).
  if (dest === 'empty' || dest === 'cors') {
    return true;
  }

  const accept = String(req.headers.accept ?? '').toLowerCase();

  // Paths that are also pages: crawlers and link-preview bots (bingbot, facebookexternalhit,
  // WhatsApp) send `Accept: */*` without Sec-Fetch-Dest and must get the HTML page.
  if (isServerRenderRoute(req.path)) {
    return accept.includes('application/json');
  }

  if (accept.includes('text/html')) {
    return false;
  }

  return true;
}

function applyApiProxyCacheHeaders(res: Response): void {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Accept, Sec-Fetch-Dest');
}

export function createApiProxyMiddleware(apiUrl: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!shouldProxyToApi(req)) {
      next();
      return;
    }

    try {
      const target = `${apiUrl}${req.originalUrl}`;
      const headers = new Headers();

      for (const [name, value] of Object.entries(req.headers)) {
        if (value === undefined) {
          continue;
        }

        const lower = name.toLowerCase();
        if (['host', 'connection', 'transfer-encoding'].includes(lower)) {
          continue;
        }

        if (typeof value === 'string') {
          headers.set(name, value);
        } else if (Array.isArray(value)) {
          headers.set(name, value.join(', '));
        }
      }

      if (!headers.has('accept')) {
        headers.set('accept', 'application/json');
      }

      const init: RequestInit & { duplex?: 'half' } = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = req as unknown as BodyInit;
        init.duplex = 'half';
      }

      const response = await fetch(target, init);

      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      applyApiProxyCacheHeaders(res);

      const body = Buffer.from(await response.arrayBuffer());
      res.send(body);
    } catch (error) {
      console.error('API proxy error:', error);
      next(error);
    }
  };
}
