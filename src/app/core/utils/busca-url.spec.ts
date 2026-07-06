import {
  buildBuscaRoute,
  buildBuscaRouteFromFilters,
  buildBuscaUrl,
  parseBuscaParamsFromQuery,
} from './busca-url';

describe('busca-url', () => {
  it('buildBuscaUrl should include q and uf', () => {
    expect(buildBuscaUrl({ q: 'academia', uf: 'pe' })).toBe('/busca?q=academia&uf=pe');
  });

  it('buildBuscaUrl should include optional filters', () => {
    expect(
      buildBuscaUrl({
        q: 'academia',
        uf: 'pe',
        categoria: 'academias',
        cidade: 'recife',
        bairro: 'boa-viagem',
      }),
    ).toBe('/busca?q=academia&uf=pe&categoria=academias&cidade=recife&bairro=boa-viagem');
  });

  it('buildBuscaUrl should include page when >= 2', () => {
    expect(buildBuscaUrl({ q: 'academia', uf: 'pe' }, 2)).toBe(
      '/busca?q=academia&uf=pe&page=2',
    );
  });

  it('buildBuscaRouteFromFilters should mirror filters', () => {
    const route = buildBuscaRouteFromFilters(
      {
        q: 'academia',
        uf: 'pe',
        categoria: 'academias',
        cidade: null,
        bairro: null,
      },
      3,
    );

    expect(route).toEqual({
      commands: ['/busca'],
      queryParams: {
        q: 'academia',
        uf: 'pe',
        categoria: 'academias',
        page: '3',
      },
    });
  });

  it('parseBuscaParamsFromQuery should return null for invalid q', () => {
    expect(parseBuscaParamsFromQuery({ q: 'a', uf: 'pe' })).toBeNull();
  });

  it('parseBuscaParamsFromQuery should parse valid params', () => {
    expect(
      parseBuscaParamsFromQuery({
        q: 'academia',
        uf: 'PE',
        categoria: 'academias',
        page: '2',
      }),
    ).toEqual({
      q: 'academia',
      uf: 'pe',
      categoria: 'academias',
      cidade: null,
      bairro: null,
      page: 2,
    });
  });

  it('buildBuscaRoute should trim q', () => {
    const route = buildBuscaRoute({ q: '  academia  ', uf: 'pe' });
    expect(route.queryParams['q']).toBe('academia');
  });
});
