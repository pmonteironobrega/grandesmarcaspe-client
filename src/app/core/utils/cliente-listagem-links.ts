import { ClienteDetail } from '../models/cliente-detail.model';
import { buildListUrlFromFilters } from './catalog-url';
import { capitalizeWords } from './format-text';

export interface ClienteListagemLink {
  /** Short crumb label (`Academias`, `Caruaru`). */
  page: string;
  /** Descriptive anchor text (`Academias em Caruaru - PE`). */
  label: string;
  url: string;
}

export interface ClienteListagemLinks {
  uf: ClienteListagemLink | null;
  cidade: ClienteListagemLink | null;
  bairro: ClienteListagemLink | null;
}

/** Listing pages (`/c/...`) that contain this cliente: categoria in its UF, cidade and bairro. */
export function buildClienteListagemLinks(detail: ClienteDetail): ClienteListagemLinks {
  const categoria = detail.categoria;
  const { cidade, bairro, uf } = detail.endereco ?? {};
  const ufSigla = uf?.sigla?.toLowerCase();

  if (!categoria?.slug || !ufSigla) {
    return { uf: null, cidade: null, bairro: null };
  }

  const categoriaNome = capitalizeWords(categoria.nome);
  const ufLabel = uf?.nome ? capitalizeWords(uf.nome) : ufSigla.toUpperCase();
  const filters = { categoria: categoria.slug, uf: ufSigla, cidade: null, bairro: null };

  const ufLink: ClienteListagemLink = {
    page: categoriaNome,
    label: `${categoriaNome} em ${ufLabel}`,
    url: buildListUrlFromFilters(filters),
  };

  if (!cidade?.slug) {
    return { uf: ufLink, cidade: null, bairro: null };
  }

  const cidadeNome = capitalizeWords(cidade.nome);
  const cidadeLink: ClienteListagemLink = {
    page: cidadeNome,
    label: `${categoriaNome} em ${cidadeNome} - ${ufSigla.toUpperCase()}`,
    url: buildListUrlFromFilters({ ...filters, cidade: cidade.slug }),
  };

  const bairroLink: ClienteListagemLink | null = bairro?.slug
    ? {
        page: capitalizeWords(bairro.nome),
        label: `${categoriaNome} em ${capitalizeWords(bairro.nome)}, ${cidadeNome} - ${ufSigla.toUpperCase()}`,
        url: buildListUrlFromFilters({ ...filters, cidade: cidade.slug, bairro: bairro.slug }),
      }
    : null;

  return { uf: ufLink, cidade: cidadeLink, bairro: bairroLink };
}
