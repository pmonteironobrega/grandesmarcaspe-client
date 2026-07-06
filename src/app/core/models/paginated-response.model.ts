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

export interface PaginatedBusca {
  data: ClienteListItem[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    filters: BuscaFilters;
  };
}
