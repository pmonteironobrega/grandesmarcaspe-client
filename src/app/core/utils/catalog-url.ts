import { ClienteListFilters } from '../models/paginated-response.model';
import { ClienteListItem } from '../models/cliente-list-item.model';

export interface ListRoute {
  commands: string[];
  queryParams: Record<string, string>;
}

export function buildListRouteFromFilters(filters: ClienteListFilters, page = 1): ListRoute {
  const commands: string[] = ['/c', filters.categoria];
  if (filters.cidade) {
    commands.push(filters.cidade);
    if (filters.bairro) {
      commands.push(filters.bairro);
    }
  }
  if (filters.uf) {
    commands.push(filters.uf);
  }
  const queryParams: Record<string, string> = {};
  if (page >= 2) {
    queryParams['page'] = String(page);
  }
  return { commands, queryParams };
}

export function buildListUrlFromFilters(filters: ClienteListFilters, page = 1): string {
  const { commands, queryParams } = buildListRouteFromFilters(filters, page);
  const path = commands.join('/');
  const query = new URLSearchParams(queryParams).toString();
  return query ? `${path}?${query}` : path;
}

/** Parses `/c/{categoria}[/{cidade}[/{bairro}]]/{uf}` (path without leading slash). */
export function parseListFiltersFromLegacyPath(path: string): ClienteListFilters | null {
  const parts = path.replace(/^\//, '').split('/').filter(Boolean);
  if (parts[0] !== 'c' || parts.length < 3) {
    return null;
  }

  const uf = parts[parts.length - 1].toLowerCase();
  if (uf.length !== 2) {
    return null;
  }

  const categoria = parts[1];
  if (parts.length === 3) {
    return { categoria, uf, cidade: null, bairro: null };
  }
  if (parts.length === 4) {
    return { categoria, uf, cidade: parts[2], bairro: null };
  }
  if (parts.length === 5) {
    return { categoria, uf, cidade: parts[2], bairro: parts[3] };
  }

  return null;
}

export const DEFAULT_CLIENTE_MARCA_CAMINHO = 'clientes/default.png';

export const CLIENTE_MARCA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif'] as const;

function isNologoPath(caminho: string): boolean {
  const normalized = caminho.replace(/^\/+/, '').toLowerCase();
  return normalized === 'nologo.png' || normalized.endsWith('/nologo.png');
}

function isDefaultClienteImagePath(caminho: string): boolean {
  const normalized = caminho.replace(/^\/+/, '').toLowerCase();
  return (
    normalized === DEFAULT_CLIENTE_MARCA_CAMINHO ||
    normalized === 'default.png' ||
    normalized.endsWith('/default.png')
  );
}

function normalizeClienteImagePath(caminho: string): string {
  const normalized = caminho.replace(/^\/+/, '');
  if (isNologoPath(normalized)) {
    return DEFAULT_CLIENTE_MARCA_CAMINHO;
  }
  if (/^\d+\//.test(normalized) && !normalized.startsWith('clientes/')) {
    return `clientes/${normalized}`;
  }
  return normalized;
}

/** Path relativo da imagem padrão (`/clientes/default.png`). */
export function buildClienteDefaultImagePath(): string {
  return `/${DEFAULT_CLIENTE_MARCA_CAMINHO}`;
}

/** Path relativo servido via proxy SSR → API (`/clientes/{id}/marca.ext`). */
export function buildClienteMarcaPath(clienteId: number, extension = 'jpg'): string {
  return `/clientes/${clienteId}/marca.${extension}`;
}

/**
 * Resolve URL de imagem do cliente a partir do path no disco:
 * `/var/www/catalog-api/clientes/{id}/marca.{ext}`
 *
 * Ignora `nologo.png` do banco legado e monta o path pelo id do cliente.
 */
export function resolveClienteImageUrl(
  clienteId: number,
  caminho: string | null | undefined,
  assetsBaseUrl?: string,
): string {
  let path: string;

  if (!caminho || isNologoPath(caminho)) {
    path = buildClienteDefaultImagePath();
  } else {
    const normalized = normalizeClienteImagePath(caminho);
    path = `/${normalized}`;
  }

  if (assetsBaseUrl) {
    const base = assetsBaseUrl.endsWith('/') ? assetsBaseUrl.slice(0, -1) : assetsBaseUrl;
    return `${base}${path}`;
  }

  return path;
}

/** Fallback quando `marca.*` não existe — tenta extensões e depois default. */
export function nextClienteMarcaFallbackUrl(clienteId: number, failedUrl: string): string {
  if (isDefaultClienteImagePath(failedUrl)) {
    return buildClienteDefaultImagePath();
  }

  const match = failedUrl.match(/\/clientes\/(\d+)\/marca\.(\w+)/i);
  if (!match) {
    return buildClienteDefaultImagePath();
  }

  const id = Number(match[1]);
  const ext = match[2].toLowerCase();
  const order = [...CLIENTE_MARCA_EXTENSIONS];
  const index = order.indexOf(ext as (typeof order)[number]);

  if (index === -1 || index >= order.length - 1) {
    return buildClienteDefaultImagePath();
  }

  return buildClienteMarcaPath(id, order[index + 1]);
}

export function buildClienteDetailPath(
  clienteSlug: string,
  cidadeSlug: string,
  bairroSlug: string,
  uf: string,
): string {
  return `r/${clienteSlug}/${cidadeSlug}/${bairroSlug}/${uf.toLowerCase()}`;
}

export function buildClienteDetailUrlFromListItem(cliente: ClienteListItem): string | null {
  const cidade = cliente.endereco?.cidade?.slug;
  const bairro = cliente.endereco?.bairro?.slug;
  const uf = cliente.endereco?.uf?.sigla;

  if (!cidade || !bairro || !uf) {
    return null;
  }

  return `/${buildClienteDetailPath(cliente.slug, cidade, bairro, uf)}`;
}

export function resolveImageUrl(caminho: string | null | undefined, assetsBaseUrl: string): string {
  if (!caminho || isNologoPath(caminho)) {
    return resolveImageUrl(DEFAULT_CLIENTE_MARCA_CAMINHO, assetsBaseUrl);
  }
  if (caminho.startsWith('http://') || caminho.startsWith('https://')) {
    return caminho;
  }
  const base = assetsBaseUrl.endsWith('/') ? assetsBaseUrl.slice(0, -1) : assetsBaseUrl;
  const path = `/${normalizeClienteImagePath(caminho)}`;
  return `${base}${path}`;
}
