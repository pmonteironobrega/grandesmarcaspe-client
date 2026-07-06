import {
  CategoriaSummary,
  ClienteEndereco,
  ClienteImagem,
  PlanoSummary,
} from './cliente-shared.model';

export interface ClienteListItem {
  id: number;
  slug: string;
  nome: string;
  slogan: string | null;
  avaliacao: number;
  categoria: CategoriaSummary | null;
  plano: PlanoSummary | null;
  endereco: ClienteEndereco | null;
  imagemPrincipal: ClienteImagem | null;
}
