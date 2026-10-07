import type { NextFunction, Request, Response } from 'express';

const LEGACY_PAGINATION = /^(\/c\/.+?)\/(\d+)\/?$/;
const TOTAL_PAGES_TTL_MS = 10 * 60 * 1000;

/**
 * Old site paginated listings as `/c/.../{uf}/{N}`; the canonical form is `/c/.../{uf}?page=N`
 * (no query on page 1). Valid listing paths always end in the UF, so a numeric tail is never a slug.
 *
 * A page past the end (the old site had far more results) redirects to the first page, which is
 * the URL that should stay indexed. Redirecting to `?page=N` when that page 404s is a redirect error.
 */
export function legacyPaginationRedirect(originalUrl: string): string | null {
  const [path, query = ''] = originalUrl.split('?', 2);
  const match = LEGACY_PAGINATION.exec(path);
  if (!match) {
    return null;
  }

  const page = Number(match[2]);
  const params = new URLSearchParams(query);
  params.delete('page');
  if (page >= 2) {
    params.set('page', String(page));
  }

  const search = params.toString();
  return search ? `${match[1]}?${search}` : match[1];
}

/**
 * Same as {@link legacyPaginationRedirect}, except a page beyond `totalPages` goes to page 1.
 * `totalPages === null` means the listing size is unknown, so the numbered canonical is kept.
 */
export function resolveLegacyPaginationTarget(
  originalUrl: string,
  totalPages: number | null,
): string | null {
  const target = legacyPaginationRedirect(originalUrl);
  if (!target) {
    return null;
  }

  const page = legacyPaginationPage(originalUrl);
  if (page != null && page >= 2 && totalPages != null && page > Math.max(totalPages, 1)) {
    return withoutPageQuery(target);
  }

  return target;
}

export function legacyPaginationPage(originalUrl: string): number | null {
  const match = LEGACY_PAGINATION.exec(originalUrl.split('?')[0]);
  return match ? Number(match[2]) : null;
}

export function createLegacyRedirectMiddleware(apiUrl: string) {
  const totals = new Map<string, { totalPages: number; expiresAt: number }>();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const page = legacyPaginationPage(req.originalUrl);
    if (page == null) {
      next();
      return;
    }

    let totalPages: number | null = null;
    if (page >= 2) {
      const listingPath = legacyPaginationRedirect(req.originalUrl)?.split('?')[0];
      if (listingPath) {
        totalPages = await readTotalPages(apiUrl, listingPath, totals);
      }
    }

    const target = resolveLegacyPaginationTarget(req.originalUrl, totalPages);
    if (!target) {
      next();
      return;
    }

    res.redirect(301, target);
  };
}

function withoutPageQuery(url: string): string {
  const [path, query = ''] = url.split('?', 2);
  const params = new URLSearchParams(query);
  params.delete('page');
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

async function readTotalPages(
  apiUrl: string,
  listingPath: string,
  cache: Map<string, { totalPages: number; expiresAt: number }>,
): Promise<number | null> {
  const hit = cache.get(listingPath);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.totalPages;
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}${listingPath}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { meta?: { totalPages?: unknown } };
    const totalPages = body.meta?.totalPages;
    if (typeof totalPages !== 'number' || !Number.isFinite(totalPages)) {
      return null;
    }

    cache.set(listingPath, { totalPages, expiresAt: Date.now() + TOTAL_PAGES_TTL_MS });
    return totalPages;
  } catch {
    return null;
  }
}
