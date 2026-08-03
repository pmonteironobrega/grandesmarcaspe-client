const API_TARGET = 'http://localhost:3000';

/**
 * Dual HTML/JSON routes (/c, /r, /busca): navigations stay in the SPA;
 * fetch/XHR go to the API. Prefer Sec-Fetch-Dest over Accept alone.
 */
function shouldServeSpa(req) {
  const dest = String(req.headers['sec-fetch-dest'] ?? '')
    .split(',')[0]
    ?.trim()
    .toLowerCase();

  if (dest === 'document' || dest === 'iframe') {
    return true;
  }

  if (dest === 'empty' || dest === 'cors') {
    return false;
  }

  const accept = req.headers.accept ?? '';
  return accept.includes('text/html');
}

/** @type {import('http-proxy-middleware').Options} */
const apiDefaults = {
  target: API_TARGET,
  secure: false,
  changeOrigin: true,
};

const dualRouteProxy = {
  ...apiDefaults,
  bypass(req) {
    if (shouldServeSpa(req)) {
      return '/index.html';
    }
  },
  onProxyRes(proxyRes) {
    // Avoid browser caching JSON under the same URL as the HTML page.
    proxyRes.headers['cache-control'] = 'private, no-store';
    proxyRes.headers['vary'] = 'Accept, Sec-Fetch-Dest';
    delete proxyRes.headers['etag'];
    delete proxyRes.headers['last-modified'];
    delete proxyRes.headers['expires'];
  },
};

module.exports = {
  '/geography': apiDefaults,
  '/catalog': apiDefaults,
  '/categorias': apiDefaults,
  '/clientes': apiDefaults,
  '/busca': dualRouteProxy,
  '/auth': apiDefaults,
  '/usuarios': apiDefaults,
  '/c/': dualRouteProxy,
  '/r/': dualRouteProxy,
};
