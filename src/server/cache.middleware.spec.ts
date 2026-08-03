import { isApiProxyRoute, isServerRenderRoute, shouldProxyToApi } from './cache.middleware';

describe('cache.middleware routing', () => {
  it('identifies dual HTML/JSON server routes', () => {
    expect(isServerRenderRoute('/r/academia/recife/boa-viagem/pe')).toBeTrue();
    expect(isServerRenderRoute('/c/academias/pe')).toBeTrue();
    expect(isServerRenderRoute('/busca')).toBeTrue();
    expect(isServerRenderRoute('/sobre')).toBeFalse();
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
});
