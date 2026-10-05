import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import compression from 'compression';
import { config as loadEnv } from 'dotenv';
import express, { type Request, type Response, type NextFunction } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  getCachedSsrResponse,
  getSsrCacheTtl,
  isPrerenderRoute,
  isServerRenderRoute,
  isSsrCacheRoute,
  isStaticAsset,
  setCachedSsrResponse,
  createApiProxyMiddleware,
} from './server/cache.middleware';
import { legacyRedirectMiddleware } from './server/legacy-redirect';

const envProductionPath = join(import.meta.dirname, '../../../environments/.env.production');
if (existsSync(envProductionPath)) {
  // Written by CI on every deploy; must win over values cached by PM2.
  loadEnv({ path: envProductionPath, override: true });
}

const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000';

const browserDistFolder = join(import.meta.dirname, '../browser');

const port = process.env['PORT'] || '4000';
const defaultAllowedHosts = [
  'localhost',
  `localhost:${port}`,
  'localhost:4000',
  'localhost:4200',
  '127.0.0.1',
];
const envAllowedHosts = process.env['NG_ALLOWED_HOSTS']?.split(',').map((host) => host.trim()).filter(Boolean) ?? [];
const allowedHosts = [...new Set([...defaultAllowedHosts, ...envAllowedHosts])];

const app = express();
// nginx sempre envia X-Forwarded-For; qualquer x-forwarded-* fora desta lista faz o
// Angular abandonar o SSR e servir só o index.csr.html.
const angularApp = new AngularNodeAppEngine({
  allowedHosts,
  trustProxyHeaders: ['x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-for'],
});

app.use(compression({ level: 6 }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (isStaticAsset(req.url)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (isPrerenderRoute(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  } else if (isServerRenderRoute(req.path)) {
    // Same URL also serves JSON via the API proxy — Vary prevents browsers from
    // replaying a cached JSON body as the HTML document after idle/tab discard.
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Vary', 'Accept, Sec-Fetch-Dest');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }

  next();
});

async function proxySitemap(apiPath: string, res: Response): Promise<void> {
  try {
    const response = await fetch(`${apiUrl}${apiPath}`, {
      headers: { accept: 'application/xml' },
    });

    if (!response.ok) {
      res.status(response.status).send('Sitemap unavailable');
      return;
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(await response.text());
  } catch (error) {
    console.error('Sitemap proxy error:', error);
    res.status(500).send('Sitemap unavailable');
  }
}

// Index pointing to /sitemaps/paginas.xml and /sitemaps/clientes-N.xml.
app.get('/sitemap.xml', (_req, res) => proxySitemap('/catalog/sitemap.xml', res));

app.get(/^\/sitemaps\/([a-z0-9-]+\.xml)$/, (req, res) =>
  proxySitemap(`/catalog/sitemaps/${req.params[0]}`, res),
);

app.use(legacyRedirectMiddleware);

app.use(createApiProxyMiddleware(apiUrl));

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    etag: true,
    lastModified: true,
  }),
);

app.use((req: Request, res: Response, next: NextFunction) => {
  const ttl = getSsrCacheTtl();
  const cacheKey = req.originalUrl;

  if (ttl > 0 && isSsrCacheRoute(req.path)) {
    const cached = getCachedSsrResponse(cacheKey);
    if (cached) {
      res.setHeader('X-SSR-Cache', 'HIT');
      res.status(cached.status);
      for (const [key, value] of Object.entries(cached.headers)) {
        res.setHeader(key, value);
      }
      res.send(cached.body);
      return;
    }
    res.setHeader('X-SSR-Cache', 'MISS');
  } else {
    res.setHeader('X-SSR-Cache', 'BYPASS');
  }

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).send('Gateway Timeout');
    }
  }, 30000);

  angularApp
    .handle(req)
    .then(async (response) => {
      clearTimeout(timeout);
      if (response) {
        if (isServerRenderRoute(req.path)) {
          response.headers.set('cache-control', 'no-cache');
          response.headers.set('vary', 'Accept, Sec-Fetch-Dest');
        }

        if (ttl > 0 && isSsrCacheRoute(req.path)) {
          const body = Buffer.from(await response.clone().arrayBuffer());
          const headers: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          setCachedSsrResponse(cacheKey, {
            body,
            headers,
            status: response.status,
            expiresAt: Date.now() + ttl,
          });
        }
        return writeResponseToNodeResponse(response, res);
      }
      return next();
    })
    .catch((error) => {
      clearTimeout(timeout);
      console.error('Error rendering application:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      } else {
        next(error);
      }
    });
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const host =
    process.env['HOST'] ||
    (process.env['NODE_ENV'] === 'production' ? '127.0.0.1' : '0.0.0.0');
  app.listen(Number(port), host, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://${host}:${port}`);
    console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
