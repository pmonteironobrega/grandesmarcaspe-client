import {
  CategoriaSummary,
  ClienteEndereco,
  ClienteImagem,
  ClienteTag,
  ClienteTelefone,
  PlanoSummary,
} from './cliente-shared.model';

export interface ClienteDetail {
  id: number;
  slug: string;
  nome: string;
  slogan: string | null;
  descricao: string | null;
  subdescricao: string | null;
  email: string | null;
  site: string | null;
  dataCadastro: string | null;
  avaliacao: number;
  cartaoDesconto: string | null;
  categoria: CategoriaSummary | null;
  plano: PlanoSummary | null;
  endereco: ClienteEndereco;
  enderecos: ClienteEndereco[];
  telefones: ClienteTelefone[];
  imagens: ClienteImagem[];
  tags: ClienteTag[];
}
