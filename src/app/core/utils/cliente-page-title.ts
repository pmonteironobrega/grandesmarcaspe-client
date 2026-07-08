import { ClienteDetail } from '../models/cliente-detail.model';
import { capitalizeWords } from './format-text';

export const SITE_TITLE_BRAND = 'GrandesMarcasPE';

/** Title SEO da página de detalhe: `Nome - Bairro, Cidade - UF | Categoria | GrandesMarcasPE`. */
export function buildClientePageTitle(detail: ClienteDetail): string {
  const estabelecimento = detail.nome.trim();
  const bairro = capitalizeWords(detail.endereco.bairro?.nome ?? '');
  const cidade = capitalizeWords(detail.endereco.cidade?.nome ?? '');
  const uf = (detail.endereco.uf?.sigla ?? '').toUpperCase();
  const categoria = capitalizeWords(detail.categoria?.nome ?? '');

  const localParts = [bairro, cidade].filter(Boolean);
  const local =
    localParts.length === 2
      ? `${localParts[0]}, ${localParts[1]}`
      : localParts[0] ?? '';

  const location = [local, uf].filter(Boolean).join(' - ');
  const left = [estabelecimento, location].filter(Boolean).join(' - ');
  const segments = [left, categoria, SITE_TITLE_BRAND].filter(Boolean);

  return segments.join(' | ');
}
