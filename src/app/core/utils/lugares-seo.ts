import { PaginatedLugares } from '../models/paginated-response.model';
import { buildClienteDetailUrlFromListItem, buildLugaresUrl } from './catalog-url';
import { SITE_TITLE_BRAND } from './cliente-page-title';
import { capitalizeWords } from './format-text';
import { ListagemSeoPayload } from './listagem-seo';

const META_DESCRIPTION_MAX = 160;

export interface LugaresNames {
  cidade: string;
  bairro: string;
  uf: string;
  /** `Bairro, Cidade - UF` or `Cidade - UF`. */
  location: string;
}

export function resolveLugaresNames(lugares: PaginatedLugares): LugaresNames {
  const { geografia } = lugares.meta;
  const cidade = capitalizeWords(geografia.cidade.nome);
  const bairro = geografia.bairro ? capitalizeWords(geografia.bairro.nome) : '';
  const uf = geografia.uf.sigla.toUpperCase();
  const local = [bairro, cidade].filter(Boolean).join(', ');
  return { cidade, bairro, uf, location: `${local} - ${uf}` };
}

/** Heading: `Estabelecimentos em Bairro, Cidade - UF` / `Estabelecimentos em Cidade - UF`. */
export function buildLugaresSeoPayload(
  siteUrl: string,
  lugares: PaginatedLugares,
): ListagemSeoPayload {
  const { meta } = lugares;
  const { geografia } = meta;
  const base = siteUrl.replace(/\/$/, '');
  const names = resolveLugaresNames(lugares);
  const heading = `Estabelecimentos em ${names.location}`;
  const pageSuffix = meta.page >= 2 ? ` - Página ${meta.page}` : '';
  const bairroSlug = geografia.bairro?.slug ?? null;
  const canonicalUrl = `${base}${buildLugaresUrl(geografia.cidade.slug, bairroSlug, geografia.uf.sigla, meta.page)}`;

  const estabelecimentos = meta.total === 1 ? '1 estabelecimento' : `${meta.total} estabelecimentos`;
  const categoriasTop = lugares.categorias
    .slice(0, 3)
    .map((categoria) => capitalizeWords(categoria.nome))
    .join(', ');
  const description = truncate(
    `${estabelecimentos} em ${names.location}${categoriasTop ? `: ${categoriasTop} e mais` : ''}, com endereço, telefone e avaliações no Grandes Marcas PE.${meta.page >= 2 ? ` Página ${meta.page}.` : ''}`,
  );

  const crumbs = [
    { name: 'Início', url: `${base}/` },
    {
      name: `${names.cidade} - ${names.uf}`,
      url: `${base}${buildLugaresUrl(geografia.cidade.slug, null, geografia.uf.sigla)}`,
    },
  ];
  if (geografia.bairro) {
    crumbs.push({
      name: names.bairro,
      url: `${base}${buildLugaresUrl(geografia.cidade.slug, geografia.bairro.slug, geografia.uf.sigla)}`,
    });
  }

  const offset = (meta.page - 1) * meta.perPage;

  return {
    heading,
    title: `${heading}${pageSuffix} | ${SITE_TITLE_BRAND}`,
    description,
    canonicalUrl,
    robots: meta.total > 0 ? 'index, follow' : 'noindex, follow',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: heading,
        numberOfItems: meta.total,
        itemListElement: lugares.data
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
      },
    ],
  };
}

/** Page past the last one (API returns 200 with no items). */
export function isLugaresPageOutOfRange(lugares: PaginatedLugares): boolean {
  return lugares.data.length === 0 && lugares.meta.total > 0;
}

function truncate(text: string, max = META_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}
