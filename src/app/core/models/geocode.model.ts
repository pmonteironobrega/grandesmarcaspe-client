export interface GeocodeQuery {
  logradouro: string;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/** Monta query textual para Nominatim / Google Maps. */
export function buildGeocodeSearchText(query: GeocodeQuery, options?: { includeNumero?: boolean }): string {
  const includeNumero = options?.includeNumero !== false;
  const cep = normalizeCep(query.cep);
  const parts = [
    query.logradouro?.trim(),
    includeNumero ? query.numero?.trim() : null,
    query.bairro?.trim(),
    query.cidade?.trim(),
    query.uf?.trim()?.toUpperCase(),
    cep,
    'Brasil',
  ].filter((part): part is string => !!part && part.length > 0);

  return parts.join(', ');
}

export function geocodeCacheKey(query: GeocodeQuery): string {
  return [
    query.logradouro,
    query.numero,
    query.bairro,
    query.cidade,
    query.uf,
    query.cep,
  ]
    .map((part) => (part ?? '').trim().toLowerCase())
    .join('|');
}

export function normalizeCep(cep: string | null | undefined): string | null {
  const digits = (cep ?? '').replace(/\D/g, '');
  if (digits.length !== 8) {
    return null;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
