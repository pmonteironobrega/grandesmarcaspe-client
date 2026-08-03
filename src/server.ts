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
  isStaticAsset,
  setCachedSsrResponse,
  createApiProxyMiddleware,
} from './server/cache.middleware';

const envProductionPath = join(import.meta.dirname, '../../../environments/.env.production');
if (existsSync(envProductionPath)) {
  loadEnv({ path: envProductionPath });
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
const angularApp = new AngularNodeAppEngine({ allowedHosts });

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

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const response = await fetch(`${apiUrl}/catalog/sitemap.xml`, {
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
});

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

  if (ttl > 0 && isServerRenderRoute(req.path)) {
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

        if (ttl > 0 && isServerRenderRoute(req.path)) {
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
  app.listen(Number(port), (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
    console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
