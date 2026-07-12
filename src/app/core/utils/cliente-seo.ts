import { ClienteDetail } from '../models/cliente-detail.model';
import {
  buildClienteDetailPath,
  resolveClienteImageUrl,
} from './catalog-url';
import { buildClientePageTitle } from './cliente-page-title';
import { capitalizeWords } from './format-text';

const META_DESCRIPTION_MAX = 160;

export interface ClienteSeoContext {
  siteUrl: string;
  assetsBaseUrl: string;
}

export interface ClienteSeoPayload {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  jsonLd: Record<string, unknown>;
}

export function buildClienteCanonicalUrl(siteUrl: string, detail: ClienteDetail): string {
  const base = normalizeSiteUrl(siteUrl);
  const cidade = detail.endereco.cidade?.slug;
  const bairro = detail.endereco.bairro?.slug;
  const uf = detail.endereco.uf?.sigla?.toLowerCase();

  if (!cidade || !bairro || !uf) {
    return base;
  }

  return `${base}/${buildClienteDetailPath(detail.slug, cidade, bairro, uf)}`;
}

export function buildClienteMetaDescription(detail: ClienteDetail): string {
  const candidatos = [
    detail.slogan?.trim(),
    detail.descricao?.trim(),
    detail.subdescricao?.trim(),
    buildDefaultMetaDescription(detail),
  ].filter((value): value is string => Boolean(value));

  return truncateMetaDescription(candidatos[0] ?? buildDefaultMetaDescription(detail));
}

export function buildClienteSeoPayload(
  context: ClienteSeoContext,
  detail: ClienteDetail,
): ClienteSeoPayload {
  const title = buildClientePageTitle(detail);
  const description = buildClienteMetaDescription(detail);
  const canonicalUrl = buildClienteCanonicalUrl(context.siteUrl, detail);
  const imageUrl = resolveClientePrimaryImageUrl(context, detail);

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    jsonLd: buildClienteLocalBusinessJsonLd(context, detail, {
      title,
      description,
      canonicalUrl,
      imageUrl,
    }),
  };
}

function buildDefaultMetaDescription(detail: ClienteDetail): string {
  const bairro = capitalizeWords(detail.endereco.bairro?.nome ?? '');
  const cidade = capitalizeWords(detail.endereco.cidade?.nome ?? '');
  const uf = (detail.endereco.uf?.sigla ?? '').toUpperCase();
  const categoria = capitalizeWords(detail.categoria?.nome ?? '');

  const local = [bairro, cidade].filter(Boolean).join(', ');
  const location = [local, uf].filter(Boolean).join(' - ');

  const parts = [
    `${detail.nome.trim()} em ${location}.`,
    categoria ? `${categoria}.` : '',
    'Encontre no Grandes Marcas PE.',
  ].filter(Boolean);

  return parts.join(' ');
}

function resolveClientePrimaryImageUrl(
  context: ClienteSeoContext,
  detail: ClienteDetail,
): string {
  const principal =
    detail.imagens.find((imagem) => imagem.principal)?.caminho ??
    detail.imagens[0]?.caminho ??
    null;

  const relative = resolveClienteImageUrl(detail.id, principal, context.assetsBaseUrl);
  if (relative.startsWith('http://') || relative.startsWith('https://')) {
    return relative;
  }

  return `${normalizeSiteUrl(context.siteUrl)}${relative.startsWith('/') ? relative : `/${relative}`}`;
}

function buildClienteLocalBusinessJsonLd(
  context: ClienteSeoContext,
  detail: ClienteDetail,
  seo: Pick<ClienteSeoPayload, 'title' | 'description' | 'canonicalUrl' | 'imageUrl'>,
): Record<string, unknown> {
  const endereco = detail.endereco;
  const streetAddress = [endereco.logradouro, endereco.numero]
    .filter(Boolean)
    .join(', ')
    .trim();

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: detail.nome.trim(),
    description: seo.description,
    url: seo.canonicalUrl,
    image: seo.imageUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality: capitalizeWords(endereco.cidade?.nome ?? ''),
      addressRegion: (endereco.uf?.sigla ?? '').toUpperCase(),
      postalCode: endereco.cep,
      addressCountry: 'BR',
    },
  };

  if (detail.categoria?.nome) {
    schema['@type'] = ['LocalBusiness', 'ProfessionalService'];
    schema['category'] = capitalizeWords(detail.categoria.nome);
  }

  const telephone = formatSchemaTelephone(detail.telefones[0]?.ddd, detail.telefones[0]?.telefone);
  if (telephone) {
    schema['telephone'] = telephone;
  }

  if (detail.email) {
    schema['email'] = detail.email;
  }

  if (detail.site) {
    schema['sameAs'] = [detail.site];
  }

  if (detail.avaliacao > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: detail.avaliacao,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (context.siteUrl) {
    schema['isPartOf'] = {
      '@type': 'WebSite',
      name: 'Grandes Marcas PE',
      url: normalizeSiteUrl(context.siteUrl),
    };
  }

  return schema;
}

function formatSchemaTelephone(ddd?: string, telefone?: string): string | null {
  if (!ddd || !telefone) {
    return null;
  }

  const digits = `${ddd}${telefone}`.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  return `+55${digits}`;
}

function truncateMetaDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/$/, '');
}
