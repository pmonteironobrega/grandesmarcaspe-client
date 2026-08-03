import { ClienteDetail } from '../models/cliente-detail.model';
import { buildClientePageTitle, SITE_TITLE_BRAND } from './cliente-page-title';

function buildDetail(overrides: Partial<ClienteDetail> = {}): ClienteDetail {
  return {
    id: 1,
    slug: 'academia-corpo-e-energia',
    nome: 'Academia Corpo e Energia',
    slogan: null,
    descricao: null,
    subdescricao: null,
    email: null,
    site: null,
    dataCadastro: null,
    avaliacao: 4,
    cartaoDesconto: null,
    categoria: { id: 1, nome: 'academias', slug: 'academias' },
    plano: null,
    endereco: {
      id: 1,
      logradouro: 'Rua Teste',
      complemento: null,
      numero: '100',
      cep: '50000-000',
      latitude: null,
      longitude: null,
      uf: { id: 1, nome: 'Pernambuco', sigla: 'pe' },
      cidade: { id: 1, nome: 'recife', slug: 'recife' },
      bairro: { id: 1, nome: 'boa viagem', slug: 'boa-viagem' },
    },
    enderecos: [],
    telefones: [],
    imagens: [],
    tags: [],
    ...overrides,
  };
}

describe('buildClientePageTitle', () => {
  it('should follow Nome - Bairro, Cidade - UF | Categoria | brand', () => {
    expect(buildClientePageTitle(buildDetail())).toBe(
      `Academia Corpo e Energia - Boa Viagem, Recife - PE | Academias | ${SITE_TITLE_BRAND}`,
    );
  });

  it('should omit missing location parts', () => {
    const detail = buildDetail({
      endereco: {
        id: 1,
        logradouro: 'Rua Teste',
        complemento: null,
        numero: '100',
        cep: '50000-000',
        latitude: null,
        longitude: null,
        uf: { id: 1, nome: 'Pernambuco', sigla: 'pe' },
        cidade: { id: 1, nome: 'recife', slug: 'recife' },
        bairro: null,
      },
    });

    expect(buildClientePageTitle(detail)).toBe(
      `Academia Corpo e Energia - Recife - PE | Academias | ${SITE_TITLE_BRAND}`,
    );
  });

  it('should omit categoria when absent', () => {
    expect(buildClientePageTitle(buildDetail({ categoria: null }))).toBe(
      `Academia Corpo e Energia - Boa Viagem, Recife - PE | ${SITE_TITLE_BRAND}`,
    );
  });
});
