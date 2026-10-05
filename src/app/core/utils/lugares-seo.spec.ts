import { PaginatedLugares } from '../models/paginated-response.model';
import { buildLugaresSeoPayload, isLugaresPageOutOfRange } from './lugares-seo';

const lugares = (overrides: Partial<PaginatedLugares['meta']> = {}): PaginatedLugares => ({
  data: [],
  categorias: [
    { slug: 'academias', nome: 'academias', total: 20 },
    { slug: 'padarias', nome: 'Padarias', total: 10 },
  ],
  meta: {
    page: 1,
    perPage: 15,
    total: 30,
    totalPages: 2,
    geografia: {
      uf: { sigla: 'pe', nome: 'Pernambuco' },
      cidade: { slug: 'cidade-exemplo', nome: 'Cidade Exemplo' },
      bairro: { slug: 'bairro-exemplo', nome: 'Bairro Exemplo' },
    },
    ...overrides,
  },
});

describe('buildLugaresSeoPayload', () => {
  it('builds heading, canonical and breadcrumb for a bairro', () => {
    const seo = buildLugaresSeoPayload('https://site.example/', lugares());

    expect(seo.heading).toBe('Estabelecimentos em Bairro Exemplo, Cidade Exemplo - PE');
    expect(seo.title).toContain('Estabelecimentos em Bairro Exemplo, Cidade Exemplo - PE |');
    expect(seo.canonicalUrl).toBe('https://site.example/r/lugares/cidade-exemplo/bairro-exemplo/pe');
    expect(seo.robots).toBe('index, follow');
    expect(seo.description).toContain('Academias, Padarias');

    const breadcrumb = seo.jsonLd[0] as { itemListElement: { item: string }[] };
    expect(breadcrumb.itemListElement.map((crumb) => crumb.item)).toEqual([
      'https://site.example/',
      'https://site.example/r/lugares/cidade-exemplo/pe',
      'https://site.example/r/lugares/cidade-exemplo/bairro-exemplo/pe',
    ]);
  });

  it('keeps page in canonical query and noindexes empty listings', () => {
    const paged = buildLugaresSeoPayload('https://site.example', lugares({ page: 2 }));
    expect(paged.canonicalUrl).toBe('https://site.example/r/lugares/cidade-exemplo/bairro-exemplo/pe?page=2');
    expect(paged.title).toContain(' - Página 2 |');

    const empty = buildLugaresSeoPayload('https://site.example', lugares({ total: 0, totalPages: 0 }));
    expect(empty.robots).toBe('noindex, follow');
  });

  it('flags pages past the last one', () => {
    expect(isLugaresPageOutOfRange(lugares({ page: 5 }))).toBe(true);
    expect(isLugaresPageOutOfRange(lugares({ total: 0 }))).toBe(false);
  });
});
