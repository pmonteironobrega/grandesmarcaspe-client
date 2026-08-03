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
    expect(payload.jsonLd['@type']).toEqual(['LocalBusiness', 'ProfessionalService']);
    expect(payload.jsonLd['telephone']).toBe('+5581999999999');
    expect(payload.jsonLd['aggregateRating']).toEqual(
      jasmine.objectContaining({ ratingValue: 4 }),
    );
  });

  it('should truncate long meta descriptions', () => {
    const detail = buildDetail({
      slogan: null,
      descricao: 'A'.repeat(200),
    });

    expect(buildClienteMetaDescription(detail).length).toBeLessThanOrEqual(160);
  });
});
