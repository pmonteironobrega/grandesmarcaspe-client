export interface EstadoFallback {
  ID: string;
  Sigla: string;
  Nome: string;
}

/** Lista completa de UFs (fallback de UI + reverse geocode). */
export const LISTA_ESTADOS: EstadoFallback[] = [
  { ID: '1', Sigla: 'AC', Nome: 'Acre' },
  { ID: '2', Sigla: 'AL', Nome: 'Alagoas' },
  { ID: '3', Sigla: 'AP', Nome: 'Amapá' },
  { ID: '4', Sigla: 'AM', Nome: 'Amazonas' },
  { ID: '5', Sigla: 'BA', Nome: 'Bahia' },
  { ID: '6', Sigla: 'CE', Nome: 'Ceará' },
  { ID: '7', Sigla: 'DF', Nome: 'Distrito Federal' },
  { ID: '8', Sigla: 'ES', Nome: 'Espírito Santo' },
  { ID: '9', Sigla: 'GO', Nome: 'Goiás' },
  { ID: '10', Sigla: 'MA', Nome: 'Maranhão' },
  { ID: '11', Sigla: 'MT', Nome: 'Mato Grosso' },
  { ID: '12', Sigla: 'MS', Nome: 'Mato Grosso do Sul' },
  { ID: '13', Sigla: 'MG', Nome: 'Minas Gerais' },
  { ID: '14', Sigla: 'PA', Nome: 'Pará' },
  { ID: '15', Sigla: 'PB', Nome: 'Paraíba' },
  { ID: '16', Sigla: 'PE', Nome: 'Pernambuco' },
  { ID: '17', Sigla: 'PI', Nome: 'Piauí' },
  { ID: '18', Sigla: 'PR', Nome: 'Paraná' },
  { ID: '19', Sigla: 'RJ', Nome: 'Rio de Janeiro' },
  { ID: '20', Sigla: 'RN', Nome: 'Rio Grande do Norte' },
  { ID: '21', Sigla: 'RS', Nome: 'Rio Grande do Sul' },
  { ID: '22', Sigla: 'RO', Nome: 'Rondônia' },
  { ID: '23', Sigla: 'RR', Nome: 'Roraima' },
  { ID: '24', Sigla: 'SC', Nome: 'Santa Catarina' },
  { ID: '25', Sigla: 'SP', Nome: 'São Paulo' },
  { ID: '26', Sigla: 'SE', Nome: 'Sergipe' },
  { ID: '27', Sigla: 'TO', Nome: 'Tocantins' },
];

const UF_BY_NORMALIZED_NAME = new Map(
  LISTA_ESTADOS.map((estado) => [normalizeEstadoNome(estado.Nome), estado.Sigla]),
);

export function normalizeEstadoNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/** Converte nome do estado ou código ISO (BR-PE) para sigla. */
export function resolveUfSigla(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) {
    return null;
  }

  const isoMatch = raw.toUpperCase().match(/^BR-([A-Z]{2})$/);
  if (isoMatch) {
    return isoMatch[1];
  }

  if (/^[A-Za-z]{2}$/.test(raw)) {
    const sigla = raw.toUpperCase();
    return LISTA_ESTADOS.some((estado) => estado.Sigla === sigla) ? sigla : null;
  }

  return UF_BY_NORMALIZED_NAME.get(normalizeEstadoNome(raw)) ?? null;
}
