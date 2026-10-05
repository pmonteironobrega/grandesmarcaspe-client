import type { NextFunction, Request, Response } from 'express';

const LEGACY_PAGINATION = /^(\/c\/.+?)\/(\d+)\/?$/;

/**
 * Old site paginated listings as `/c/.../{uf}/{N}`; the canonical form is `/c/.../{uf}?page=N`
 * (no query on page 1). Valid listing paths always end in the UF, so a numeric tail is never a slug.
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

export function legacyRedirectMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD') {
    const target = legacyPaginationRedirect(req.originalUrl);
    if (target) {
      res.redirect(301, target);
      return;
    }
  }
  next();
}
