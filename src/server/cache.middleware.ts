import type { IncomingHttpHeaders } from 'node:http';
import type { Request, Response, NextFunction } from 'express';

export const PRERENDER_ROUTES = new Set([
  '/',
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

const ssrCache = new Map<string, SsrCacheEntry>();

export function getSsrCacheTtl(): number {
  const ttl = parseInt(process.env['SSR_CACHE_TTL'] ?? '300', 10);
  return ttl > 0 ? ttl * 1000 : 0;
}

export function getCachedSsrResponse(cacheKey: string): SsrCacheEntry | undefined {
  const cached = ssrCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }
  if (cached) {
    ssrCache.delete(cacheKey);
  }
  return undefined;
}

export function setCachedSsrResponse(cacheKey: string, entry: SsrCacheEntry): void {
  ssrCache.set(cacheKey, entry);
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

  const accept = String(req.headers.accept ?? '');
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
