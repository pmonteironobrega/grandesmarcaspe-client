import { ClienteDetail } from '../models/cliente-detail.model';
import { buildClienteListagemLinks } from './cliente-listagem-links';

function buildDetail(endereco: Partial<ClienteDetail['endereco']> = {}): ClienteDetail {
  return {
    id: 1,
    slug: 'cliente-exemplo',
    nome: 'Cliente Exemplo',
    slogan: null,
    descricao: null,
    subdescricao: null,
    email: null,
    site: null,
    dataCadastro: null,
    avaliacao: 0,
    cartaoDesconto: null,
    categoria: { id: 1, nome: 'Padarias e Confeitarias', slug: 'padarias-e-confeitarias' },
    plano: null,
    endereco: {
      id: 1,
      logradouro: 'Rua Exemplo',
      complemento: null,
      numero: '10',
      cep: '50000-000',
      latitude: null,
      longitude: null,
      uf: { id: 1, nome: 'Pernambuco', sigla: 'pe' },
      cidade: { id: 1, nome: 'Cidade Exemplo', slug: 'cidade-exemplo' },
      bairro: { id: 1, nome: 'BAIRRO DO EXEMPLO', slug: 'bairro-do-exemplo' },
      ...endereco,
    },
    enderecos: [],
    telefones: [],
    imagens: [],
    tags: [],
  };
}

describe('buildClienteListagemLinks', () => {
  it('should link the categoria in the uf, cidade and bairro', () => {
    const links = buildClienteListagemLinks(buildDetail());

    expect(links.uf).toEqual({
      page: 'Padarias e Confeitarias',
      label: 'Padarias e Confeitarias em Pernambuco',
      url: '/c/padarias-e-confeitarias/pe',
    });
    expect(links.cidade).toEqual({
      page: 'Cidade Exemplo',
      label: 'Padarias e Confeitarias em Cidade Exemplo - PE',
      url: '/c/padarias-e-confeitarias/cidade-exemplo/pe',
    });
    expect(links.bairro).toEqual({
      page: 'Bairro do Exemplo',
      label: 'Padarias e Confeitarias em Bairro do Exemplo, Cidade Exemplo - PE',
      url: '/c/padarias-e-confeitarias/cidade-exemplo/bairro-do-exemplo/pe',
    });
  });

  it('should skip the bairro link when the endereco has no bairro', () => {
    const links = buildClienteListagemLinks(buildDetail({ bairro: null }));

    expect(links.cidade).not.toBeNull();
    expect(links.bairro).toBeNull();
  });

  it('should return no links without categoria', () => {
    const detail = { ...buildDetail(), categoria: null };

    expect(buildClienteListagemLinks(detail)).toEqual({ uf: null, cidade: null, bairro: null });
  });
});
