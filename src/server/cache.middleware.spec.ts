import {
  clearSsrCache,
  getCachedSsrResponse,
  getSsrCacheStats,
  isApiProxyRoute,
  isServerRenderRoute,
  isSsrCacheRoute,
  setCachedSsrResponse,
  shouldProxyToApi,
  type SsrCacheEntry,
} from './cache.middleware';

describe('cache.middleware routing', () => {
  it('identifies dual HTML/JSON server routes', () => {
    expect(isServerRenderRoute('/r/academia/recife/boa-viagem/pe')).toBeTrue();
    expect(isServerRenderRoute('/c/academias/pe')).toBeTrue();
    expect(isServerRenderRoute('/busca')).toBeTrue();
    expect(isServerRenderRoute('/sobre')).toBeFalse();
  });

  it('caches the home and catalog SSR routes, but not static pages', () => {
    expect(isSsrCacheRoute('/')).toBeTrue();
    expect(isSsrCacheRoute('/c/academias/pe')).toBeTrue();
    expect(isSsrCacheRoute('/sobre')).toBeFalse();
    expect(isServerRenderRoute('/')).toBeFalse();
  });

  it('identifies API proxy routes', () => {
    expect(isApiProxyRoute('/r/academia/recife/boa-viagem/pe')).toBeTrue();
    expect(isApiProxyRoute('/catalog/destaques')).toBeTrue();
    expect(isApiProxyRoute('/sobre')).toBeFalse();
  });

  it('never proxies document navigations even without text/html Accept', () => {
    expect(
      shouldProxyToApi({
        path: '/r/academia-brenda-physicus/amaraji/centro/pe',
        headers: {
          'sec-fetch-dest': 'document',
          accept: '*/*',
        },
      }),
    ).toBeFalse();
  });

  it('proxies fetch/XHR on the same path as the HTML page', () => {
    expect(
      shouldProxyToApi({
        path: '/r/academia-brenda-physicus/amaraji/centro/pe',
        headers: {
          'sec-fetch-dest': 'empty',
          accept: 'application/json, text/plain, */*',
        },
      }),
    ).toBeTrue();
  });

  it('falls back to Accept when Sec-Fetch-Dest is missing', () => {
    expect(
      shouldProxyToApi({
        path: '/busca',
        headers: { accept: 'text/html,application/xhtml+xml' },
      }),
    ).toBeFalse();

    expect(
      shouldProxyToApi({
        path: '/busca',
        headers: { accept: 'application/json' },
      }),
    ).toBeTrue();
  });

  it('serves the HTML page to crawlers and link-preview bots on page paths', () => {
    const bots = [
      { accept: '*/*' },
      {},
      { accept: 'text/plain' },
    ];

    for (const headers of bots) {
      expect(shouldProxyToApi({ path: '/c/imobiliarias/pe', headers })).toBeFalse();
      expect(
        shouldProxyToApi({ path: '/r/academia-exemplo/recife/boa-viagem/pe', headers }),
      ).toBeFalse();
      expect(shouldProxyToApi({ path: '/busca', headers })).toBeFalse();
    }
  });

  it('keeps proxying API-only paths for generic Accept headers', () => {
    expect(
      shouldProxyToApi({ path: '/catalog/destaques', headers: { accept: '*/*' } }),
    ).toBeTrue();
    expect(
      shouldProxyToApi({ path: '/clientes/123/marca.jpg', headers: { accept: 'image/*' } }),
    ).toBeTrue();
  });
});

describe('SSR response cache bounds', () => {
  const limits = { maxEntries: 2, maxBytes: 100 };

  function entry(body: string, expiresAt = Date.now() + 60_000, status = 200): SsrCacheEntry {
    return {
      body: { byteLength: body.length, toString: () => body } as Buffer,
      headers: {},
      status,
      expiresAt,
    };
  }

  beforeEach(() => {
    clearSsrCache();
  });

  it('returns a fresh page and drops it after the TTL without another request for that URL', () => {
    const home = entry('home');
    setCachedSsrResponse('/', home, limits);

    expect(getCachedSsrResponse('/')?.body.toString()).toBe('home');

    home.expiresAt = Date.now() - 1;
    setCachedSsrResponse('/c/academias/pe', entry('lista'), limits);

    expect(getCachedSsrResponse('/')).toBeUndefined();
    expect(getSsrCacheStats()).toEqual({ entries: 1, bytes: 5 });
  });

  it('evicts the least recently used page when the entry cap is reached', () => {
    setCachedSsrResponse('/r/a', entry('a'), limits);
    setCachedSsrResponse('/r/b', entry('bb'), limits);
    getCachedSsrResponse('/r/a');
    setCachedSsrResponse('/r/c', entry('ccc'), limits);

    expect(getCachedSsrResponse('/r/b')).toBeUndefined();
    expect(getCachedSsrResponse('/r/a')?.body.toString()).toBe('a');
    expect(getCachedSsrResponse('/r/c')?.body.toString()).toBe('ccc');
  });

  it('evicts older pages when the byte cap is reached', () => {
    const byteLimits = { maxEntries: 10, maxBytes: 10 };
    setCachedSsrResponse('/r/a', entry('12345'), byteLimits);
    setCachedSsrResponse('/r/b', entry('123456'), byteLimits);

    expect(getCachedSsrResponse('/r/a')).toBeUndefined();
    expect(getSsrCacheStats()).toEqual({ entries: 1, bytes: 6 });
  });

  it('does not retain a page larger than the byte cap or a server error', () => {
    const tight = { maxEntries: 2, maxBytes: 4 };
    setCachedSsrResponse('/r/ok', entry('ok'), tight);
    setCachedSsrResponse('/r/grande', entry('12345'), tight);
    setCachedSsrResponse('/r/erro', entry('x', Date.now() + 60_000, 500), tight);

    expect(getSsrCacheStats().entries).toBe(1);
    expect(getCachedSsrResponse('/r/ok')?.body.toString()).toBe('ok');
    expect(getCachedSsrResponse('/r/grande')).toBeUndefined();
    expect(getCachedSsrResponse('/r/erro')).toBeUndefined();
  });
});
