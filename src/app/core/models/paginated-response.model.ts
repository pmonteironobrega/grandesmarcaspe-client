import { ClienteListItem } from './cliente-list-item.model';

export interface ClienteListFilters {
  categoria: string;
  uf: string | null;
  cidade: string | null;
  bairro: string | null;
}

export interface BuscaFilters {
  q: string;
  uf: string;
  categoria: string | null;
  cidade: string | null;
  bairro: string | null;
}

export interface BuscaParams {
  q: string;
  uf: string;
  categoria?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  page?: number;
}

export interface PaginatedClientes {
  data: ClienteListItem[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    filters: ClienteListFilters;
  };
}

export interface LugaresGeografia {
  uf: { sigla: string; nome: string };
  cidade: { slug: string; nome: string };
  bairro: { slug: string; nome: string } | null;
}

export interface LugaresCategoria {
  slug: string;
  nome: string;
  total: number;
}

export interface PaginatedLugares {
  data: ClienteListItem[];
  categorias: LugaresCategoria[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    geografia: LugaresGeografia;
  };
}

export interface BuscaCategoriaGroup {
  categoria: {
    id: number;
    nome: string;
    slug: string;
  };
  total: number;
  data: ClienteListItem[];
}

export interface PaginatedBusca {
  data: ClienteListItem[];
  groups?: BuscaCategoriaGroup[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    groupedByCategoria: boolean;
    filters: BuscaFilters;
  };
}
