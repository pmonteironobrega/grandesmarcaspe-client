import type { Request, Response, NextFunction } from 'express';

export const PRERENDER_ROUTES = new Set([
  '/',
  '/sobre',
  '/anuncie',
  '/termos-privacidade',
  '/fale-conosco',
]);

const STATIC_ASSET_PATTERN = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/;

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

export function createApiProxyMiddleware(apiUrl: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!isApiProxyRoute(req.path)) {
      next();
      return;
    }

    const accept = req.headers.accept ?? '';
    if (accept.includes('text/html')) {
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
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });

      const body = Buffer.from(await response.arrayBuffer());
      res.send(body);
    } catch (error) {
      console.error('API proxy error:', error);
      next(error);
    }
  };
}
