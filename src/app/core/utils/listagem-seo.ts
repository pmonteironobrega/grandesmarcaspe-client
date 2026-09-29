import { PaginatedClientes } from '../models/paginated-response.model';
import { buildClienteDetailUrlFromListItem, buildListUrlFromFilters } from './catalog-url';
import { SITE_TITLE_BRAND } from './cliente-page-title';
import { capitalizeWords } from './format-text';

const META_DESCRIPTION_MAX = 160;

export interface ListagemSeoPayload {
  heading: string;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  jsonLd: Record<string, unknown>[];
}

interface ListagemNames {
  categoria: string;
  cidade: string;
  bairro: string;
  uf: string;
  ufNome: string;
}

/** Heading: `Categoria em Bairro, Cidade - UF` / `Categoria em Cidade - UF` / `Categoria em Estado`. */
export function buildListagemSeoPayload(
  siteUrl: string,
  listagem: PaginatedClientes,
): ListagemSeoPayload {
  const { meta } = listagem;
  const base = siteUrl.replace(/\/$/, '');
  const names = resolveNames(listagem);
  const location = buildLocation(names);
  const heading = `${names.categoria} em ${location}`;
  const pageSuffix = meta.page >= 2 ? ` - Página ${meta.page}` : '';
  const canonicalUrl = `${base}${buildListUrlFromFilters(meta.filters, meta.page)}`;

  const estabelecimentos = meta.total === 1 ? '1 estabelecimento' : `${meta.total} estabelecimentos`;
  const description = truncate(
    `${names.categoria} em ${location}: ${estabelecimentos} com endereço, telefone e avaliações no Grandes Marcas PE.${meta.page >= 2 ? ` Página ${meta.page}.` : ''}`,
  );

  return {
    heading,
    title: `${heading}${pageSuffix} | ${SITE_TITLE_BRAND}`,
    description,
    canonicalUrl,
    robots: meta.total > 0 ? 'index, follow' : 'noindex, follow',
    jsonLd: [
      buildBreadcrumbJsonLd(base, listagem, names),
      buildItemListJsonLd(base, listagem, heading),
    ],
  };
}

/** Page past the last one (API returns 200 with no items). */
export function isListagemPageOutOfRange(listagem: PaginatedClientes): boolean {
  return listagem.data.length === 0 && listagem.meta.total > 0;
}

function resolveNames(listagem: PaginatedClientes): ListagemNames {
  const { filters } = listagem.meta;
  const first = listagem.data[0];
  const endereco = first?.endereco;

  return {
    categoria: capitalizeWords(first?.categoria?.nome ?? slugToWords(filters.categoria)),
    cidade: filters.cidade
      ? capitalizeWords(endereco?.cidade?.nome ?? slugToWords(filters.cidade))
      : '',
    bairro: filters.bairro
      ? capitalizeWords(endereco?.bairro?.nome ?? slugToWords(filters.bairro))
      : '',
    uf: (filters.uf ?? '').toUpperCase(),
    ufNome: capitalizeWords(endereco?.uf?.nome ?? ''),
  };
}

function buildLocation(names: ListagemNames): string {
  if (!names.cidade) {
    return names.ufNome || names.uf;
  }
  const local = [names.bairro, names.cidade].filter(Boolean).join(', ');
  return [local, names.uf].filter(Boolean).join(' - ');
}

function buildBreadcrumbJsonLd(
  base: string,
  listagem: PaginatedClientes,
  names: ListagemNames,
): Record<string, unknown> {
  const { filters } = listagem.meta;
  const crumbs: { name: string; url: string }[] = [
    { name: 'Início', url: `${base}/` },
    {
      name: `${names.categoria} em ${names.ufNome || names.uf}`,
      url: `${base}${buildListUrlFromFilters({ ...filters, cidade: null, bairro: null })}`,
    },
  ];

  if (filters.cidade) {
    crumbs.push({
      name: names.cidade,
      url: `${base}${buildListUrlFromFilters({ ...filters, bairro: null })}`,
    });
  }
  if (filters.bairro) {
    crumbs.push({ name: names.bairro, url: `${base}${buildListUrlFromFilters(filters)}` });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

function buildItemListJsonLd(
  base: string,
  listagem: PaginatedClientes,
  heading: string,
): Record<string, unknown> {
  const { page, perPage, total } = listagem.meta;
  const offset = (page - 1) * perPage;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: heading,
    numberOfItems: total,
    itemListElement: listagem.data
      .map((cliente, index) => {
        const path = buildClienteDetailUrlFromListItem(cliente);
        return path
          ? {
              '@type': 'ListItem',
              position: offset + index + 1,
              name: cliente.nome.trim(),
              url: `${base}${path}`,
            }
          : null;
      })
      .filter((item) => item !== null),
  };
}

function slugToWords(slug: string): string {
  return slug.replace(/-/g, ' ');
}

function truncate(text: string, max = META_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}
