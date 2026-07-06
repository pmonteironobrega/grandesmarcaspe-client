import {
  buildListRouteFromFilters,
  buildListUrlFromFilters,
  parseListFiltersFromLegacyPath,
  resolveClienteImageUrl,
  resolveImageUrl,
} from './catalog-url';



describe('catalog-url', () => {

  describe('buildListRouteFromFilters', () => {

    it('builds categoria + uf without query on page 1', () => {

      expect(

        buildListRouteFromFilters({ categoria: 'academias', uf: 'pe', cidade: null, bairro: null }, 1),

      ).toEqual({

        commands: ['/c', 'academias', 'pe'],

        queryParams: {},

      });

    });



    it('builds page query param separately from path', () => {

      expect(

        buildListRouteFromFilters({ categoria: 'academias', uf: 'pe', cidade: null, bairro: null }, 2),

      ).toEqual({

        commands: ['/c', 'academias', 'pe'],

        queryParams: { page: '2' },

      });

    });



    it('builds categoria + cidade + uf path', () => {

      expect(

        buildListRouteFromFilters(

          { categoria: 'academias', uf: 'pe', cidade: 'recife', bairro: null },

          1,

        ),

      ).toEqual({

        commands: ['/c', 'academias', 'recife', 'pe'],

        queryParams: {},

      });

    });

  });



  describe('parseListFiltersFromLegacyPath', () => {
    it('parses categoria + uf', () => {
      expect(parseListFiltersFromLegacyPath('c/academias/pe')).toEqual({
        categoria: 'academias',
        uf: 'pe',
        cidade: null,
        bairro: null,
      });
    });

    it('parses categoria + cidade + bairro + uf', () => {
      expect(parseListFiltersFromLegacyPath('c/academias/recife/boa-viagem/pe')).toEqual({
        categoria: 'academias',
        uf: 'pe',
        cidade: 'recife',
        bairro: 'boa-viagem',
      });
    });
  });

  describe('buildListUrlFromFilters', () => {

    it('joins path and query for navigateByUrl', () => {

      expect(

        buildListUrlFromFilters({ categoria: 'academias', uf: 'pe', cidade: null, bairro: null }, 2),

      ).toBe('/c/academias/pe?page=2');

    });

  });

  describe('resolveImageUrl', () => {
    it('uses default marca when caminho is missing', () => {
      expect(resolveImageUrl(null, 'http://localhost:3000')).toBe(
        'http://localhost:3000/clientes/default.png',
      );
    });

    it('resolves relative caminho against assets base', () => {
      expect(resolveImageUrl('clientes/10/marca.jpg', 'https://www.grandesmarcaspe.com.br')).toBe(
        'https://www.grandesmarcaspe.com.br/clientes/10/marca.jpg',
      );
    });

    it('maps legacy nologo.png to default marca', () => {
      expect(resolveImageUrl('nologo.png', 'https://api.catalog.pmonteirodev.com.br')).toBe(
        'https://api.catalog.pmonteirodev.com.br/clientes/default.png',
      );
    });
  });

  describe('resolveClienteImageUrl', () => {
    it('uses default image when caminho is nologo', () => {
      expect(resolveClienteImageUrl(21572, 'nologo.png')).toBe('/clientes/default.png');
    });

    it('uses default image when caminho is missing', () => {
      expect(resolveClienteImageUrl(10, null)).toBe('/clientes/default.png');
    });

    it('uses caminho from disk layout when present', () => {
      expect(resolveClienteImageUrl(10, 'clientes/10/marca.jpg')).toBe('/clientes/10/marca.jpg');
    });

    it('prefixes absolute url when assetsBaseUrl is provided', () => {
      expect(
        resolveClienteImageUrl(10, 'nologo.png', 'https://api.catalog.pmonteirodev.com.br'),
      ).toBe('https://api.catalog.pmonteirodev.com.br/clientes/default.png');
    });
  });

});


