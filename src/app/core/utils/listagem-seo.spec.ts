import { PaginatedClientes } from '../models/paginated-response.model';
import { ClienteListItem } from '../models/cliente-list-item.model';
import { buildListagemSeoPayload, isListagemPageOutOfRange } from './listagem-seo';

const SITE_URL = 'https://www.example.com.br/';

function buildItem(overrides: Partial<ClienteListItem> = {}): ClienteListItem {
  return {
    id: 1,
    slug: 'academia-exemplo',
    nome: 'Academia Exemplo ',
    slogan: null,
    avaliacao: 0,
    categoria: { id: 1, nome: 'academias', slug: 'academias' },
    plano: null,
    endereco: {
      id: 1,
      logradouro: 'Rua Exemplo',
      complemento: null,
      numero: '10',
      cep: '50000-000',
      latitude: null,
      longitude: null,
      uf: { id: 1, nome: 'pernambuco', sigla: 'PE' },
      cidade: { id: 1, nome: 'recife', slug: 'recife' },
      bairro: { id: 1, nome: 'boa viagem', slug: 'boa-viagem' },
    },
    imagemPrincipal: null,
    ...overrides,
  };
}

function buildListagem(
  filters: Partial<PaginatedClientes['meta']['filters']> = {},
  meta: Partial<Omit<PaginatedClientes['meta'], 'filters'>> = {},
  data: ClienteListItem[] = [buildItem()],
): PaginatedClientes {
  return {
    data,
    meta: {
      page: 1,
      perPage: 10,
      total: 25,
      totalPages: 3,
      filters: { categoria: 'academias', uf: 'pe', cidade: null, bairro: null, ...filters },
      ...meta,
    },
  };
}

describe('listagem SEO helpers', () => {
  it('should use state name when only uf is filtered', () => {
    const seo = buildListagemSeoPayload(SITE_URL, buildListagem());

    expect(seo.heading).toBe('Academias em Pernambuco');
    expect(seo.title).toBe('Academias em Pernambuco | GrandesMarcasPE');
    expect(seo.canonicalUrl).toBe('https://www.example.com.br/c/academias/pe');
    expect(seo.robots).toBe('index, follow');
  });

  it('should include bairro, cidade and uf in heading and canonical', () => {
    const seo = buildListagemSeoPayload(
      SITE_URL,
      buildListagem({ cidade: 'recife', bairro: 'boa-viagem' }),
    );

    expect(seo.heading).toBe('Academias em Boa Viagem, Recife - PE');
    expect(seo.canonicalUrl).toBe('https://www.example.com.br/c/academias/recife/boa-viagem/pe');
    expect(seo.description).toContain('25 estabelecimentos');
    expect(seo.description.length).toBeLessThanOrEqual(160);
  });

  it('should add page suffix and keep page in canonical', () => {
    const seo = buildListagemSeoPayload(
      SITE_URL,
      buildListagem({ cidade: 'recife' }, { page: 2 }),
    );

    expect(seo.title).toBe('Academias em Recife - PE - Página 2 | GrandesMarcasPE');
    expect(seo.canonicalUrl).toBe('https://www.example.com.br/c/academias/recife/pe?page=2');
  });

  it('should build breadcrumb and item list json-ld', () => {
    const seo = buildListagemSeoPayload(SITE_URL, buildListagem({ cidade: 'recife' }, { page: 2 }));
    const [breadcrumb, itemList] = seo.jsonLd;

    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect((breadcrumb['itemListElement'] as unknown[]).length).toBe(3);
    expect(itemList['@type']).toBe('ItemList');
    expect(itemList['itemListElement']).toEqual([
      {
        '@type': 'ListItem',
        position: 11,
        name: 'Academia Exemplo',
        url: 'https://www.example.com.br/r/academia-exemplo/recife/boa-viagem/pe',
      },
    ]);
  });

  it('should fall back to slugs and noindex when listing is empty', () => {
    const seo = buildListagemSeoPayload(
      SITE_URL,
      buildListagem({ categoria: 'pet-shops', cidade: 'cabo-de-santo-agostinho' }, { total: 0, totalPages: 0 }, []),
    );

    expect(seo.heading).toBe('Pet Shops em Cabo de Santo Agostinho - PE');
    expect(seo.robots).toBe('noindex, follow');
  });

  it('should flag pages past the last one', () => {
    expect(isListagemPageOutOfRange(buildListagem({}, { page: 99 }, []))).toBeTrue();
    expect(isListagemPageOutOfRange(buildListagem({}, { total: 0 }, []))).toBeFalse();
    expect(isListagemPageOutOfRange(buildListagem())).toBeFalse();
  });
});
