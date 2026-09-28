/**
 * Fallback local / defaults do ambiente de desenvolvimento remoto.
 * No CI (branch develop) este arquivo é SEMPRE sobrescrito pelos secrets
 * antes de `npm run build:catalog`.
 */
export const environment = {
  production: true,
  appEnv: 'catalog' as const,
  /** SSR → API no mesmo host (browser usa paths relativos). */
  apiUrl: 'http://127.0.0.1:3001',
  assetsBaseUrl: 'https://api.catalog.pmonteirodev.com.br',
  siteUrl: 'https://catalog.pmonteirodev.com.br',
  defaultUf: 'pe',
};
