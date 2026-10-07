import { legacyPaginationRedirect, resolveLegacyPaginationTarget } from './legacy-redirect';

describe('legacyPaginationRedirect', () => {
  it('moves the legacy page segment to the page query param', () => {
    expect(legacyPaginationRedirect('/c/academias/pe/2')).toBe('/c/academias/pe?page=2');
    expect(legacyPaginationRedirect('/c/academias/recife/pe/3')).toBe('/c/academias/recife/pe?page=3');
    expect(legacyPaginationRedirect('/c/academias/recife/boa-viagem/pe/12/')).toBe(
      '/c/academias/recife/boa-viagem/pe?page=12',
    );
  });

  it('drops the page param for page 0 or 1', () => {
    expect(legacyPaginationRedirect('/c/academias/pe/1')).toBe('/c/academias/pe');
    expect(legacyPaginationRedirect('/c/academias/pe/0')).toBe('/c/academias/pe');
  });

  it('keeps other query params and replaces an existing page', () => {
    expect(legacyPaginationRedirect('/c/academias/pe/4?page=9&utm_source=x')).toBe(
      '/c/academias/pe?utm_source=x&page=4',
    );
  });

  it('sends a legacy page past the end to the first page', () => {
    const url = '/c/supermercados/vitoria-de-santo-antao/pe/15';
    expect(resolveLegacyPaginationTarget(url, 3)).toBe('/c/supermercados/vitoria-de-santo-antao/pe');
    expect(resolveLegacyPaginationTarget('/c/academias/pe/4?utm_source=x', 2)).toBe(
      '/c/academias/pe?utm_source=x',
    );
  });

  it('keeps an in-range legacy page, and the numbered URL when the size is unknown', () => {
    expect(resolveLegacyPaginationTarget('/c/supermercados/vitoria-de-santo-antao/pe/2', 3)).toBe(
      '/c/supermercados/vitoria-de-santo-antao/pe?page=2',
    );
    expect(resolveLegacyPaginationTarget('/c/supermercados/vitoria-de-santo-antao/pe/15', null)).toBe(
      '/c/supermercados/vitoria-de-santo-antao/pe?page=15',
    );
  });

  it('ignores canonical listing, detail and other paths', () => {
    expect(legacyPaginationRedirect('/c/academias/pe')).toBeNull();
    expect(legacyPaginationRedirect('/c/academias/pe?page=2')).toBeNull();
    expect(legacyPaginationRedirect('/r/academia/recife/boa-viagem/pe')).toBeNull();
    expect(legacyPaginationRedirect('/c/2')).toBeNull();
    expect(legacyPaginationRedirect('/sobre')).toBeNull();
  });
});
