import { ClienteDetail } from '../models/cliente-detail.model';
import {
  buildClienteCanonicalUrl,
  buildClienteMetaDescription,
  buildClienteSeoPayload,
} from './cliente-seo';
import { SITE_TITLE_BRAND } from './cliente-page-title';

function buildDetail(overrides: Partial<ClienteDetail> = {}): ClienteDetail {
  return {
    id: 1,
    slug: 'academia-corpo-e-energia',
    nome: 'Academia Corpo e Energia',
    slogan: 'Saúde e bem-estar em Boa Viagem',
    descricao: null,
    subdescricao: null,
    email: 'contato@academia.com',
    site: 'https://academia.com',
    dataCadastro: '2024-01-15',
    avaliacao: 4,
    cartaoDesconto: null,
    categoria: { id: 1, nome: 'academias', slug: 'academias' },
    plano: null,
    endereco: {
      id: 1,
      logradouro: 'Av. Boa Viagem',
      complemento: null,
      numero: '1000',
      cep: '51020-000',
      latitude: -8.12,
      longitude: -34.9,
      uf: { id: 1, nome: 'Pernambuco', sigla: 'pe' },
      cidade: { id: 1, nome: 'recife', slug: 'recife' },
      bairro: { id: 1, nome: 'boa viagem', slug: 'boa-viagem' },
    },
    enderecos: [],
    telefones: [{ id: 1, ddd: '81', telefone: '999999999' }],
    imagens: [{ id: 1, caminho: 'clientes/1/marca.jpg', tipo: 'marca', principal: true }],
    tags: [],
    ...overrides,
  };
}

const seoContext = {
  siteUrl: 'https://www.grandesmarcaspe.com.br',
  assetsBaseUrl: 'https://www.grandesmarcaspe.com.br',
};

describe('cliente SEO helpers', () => {
  it('should build canonical url for cliente detail', () => {
    expect(buildClienteCanonicalUrl(seoContext.siteUrl, buildDetail())).toBe(
      'https://www.grandesmarcaspe.com.br/r/academia-corpo-e-energia/recife/boa-viagem/pe',
    );
  });

  it('should build canonical url without bairro segment when endereco has no bairro', () => {
    const base = buildDetail();
    const detail = buildDetail({ endereco: { ...base.endereco, bairro: null } });

    expect(buildClienteCanonicalUrl(seoContext.siteUrl, detail)).toBe(
      'https://www.grandesmarcaspe.com.br/r/academia-corpo-e-energia/recife/pe',
    );
  });

  it('should prefer slogan for meta description', () => {
    expect(buildClienteMetaDescription(buildDetail())).toBe('Saúde e bem-estar em Boa Viagem');
  });

  it('should build seo payload with title, description, canonical and json-ld', () => {
    const payload = buildClienteSeoPayload(seoContext, buildDetail());

    expect(payload.title).toBe(
      `Academia Corpo e Energia - Boa Viagem, Recife - PE | Academias | ${SITE_TITLE_BRAND}`,
    );
    expect(payload.canonicalUrl).toContain('/r/academia-corpo-e-energia/recife/boa-viagem/pe');
    expect(payload.imageUrl).toContain('/clientes/1/marca.jpg');
    const [business] = payload.jsonLd;
    expect(business['@type']).toEqual(['LocalBusiness', 'ProfessionalService']);
    expect(business['telephone']).toBe('+5581999999999');
    expect(business['aggregateRating']).toEqual(jasmine.objectContaining({ ratingValue: 4 }));
  });

  it('should include geo coordinates when precision is at street level or better', () => {
    const base = buildDetail();
    const detail = buildDetail({ endereco: { ...base.endereco, geoPrecisao: 'endereco' } });
    const [business] = buildClienteSeoPayload(seoContext, detail).jsonLd;

    expect(business['geo']).toEqual({ '@type': 'GeoCoordinates', latitude: -8.12, longitude: -34.9 });
  });

  it('should omit geo coordinates when precision is only cep/bairro or unknown', () => {
    const base = buildDetail();
    for (const geoPrecisao of ['cep', 'bairro', null, undefined]) {
      const detail = buildDetail({ endereco: { ...base.endereco, geoPrecisao } });
      const [business] = buildClienteSeoPayload(seoContext, detail).jsonLd;
      expect(business['geo']).toBeUndefined();
    }
  });

  it('should build breadcrumb json-ld through categoria and cidade listings', () => {
    const [, breadcrumb] = buildClienteSeoPayload(seoContext, buildDetail()).jsonLd;

    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb['itemListElement']).toEqual([
      jasmine.objectContaining({ position: 1, name: 'Início' }),
      jasmine.objectContaining({
        position: 2,
        name: 'Academias em Pernambuco',
        item: 'https://www.grandesmarcaspe.com.br/c/academias/pe',
      }),
      jasmine.objectContaining({
        position: 3,
        name: 'Academias em Recife - PE',
        item: 'https://www.grandesmarcaspe.com.br/c/academias/recife/pe',
      }),
      jasmine.objectContaining({
        position: 4,
        name: 'Academia Corpo e Energia',
        item: 'https://www.grandesmarcaspe.com.br/r/academia-corpo-e-energia/recife/boa-viagem/pe',
      }),
    ]);
  });

  it('should truncate long meta descriptions', () => {
    const detail = buildDetail({
      slogan: null,
      descricao: 'A'.repeat(200),
    });

    expect(buildClienteMetaDescription(detail).length).toBeLessThanOrEqual(160);
  });
});
