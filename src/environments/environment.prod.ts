/**
 * Fallback local / defaults de produção.
 * No CI (branch master) este arquivo é SEMPRE sobrescrito pelos secrets
 * antes de `npm run build:production`.
 */
export const environment = {
  production: true,
  appEnv: 'production' as const,
  /** SSR → API no mesmo host (browser usa paths relativos). */
  apiUrl: 'http://127.0.0.1:3001',
  assetsBaseUrl: 'https://api.grandesmarcaspe.com.br',
  siteUrl: 'https://www.grandesmarcaspe.com.br',
  defaultUf: 'pe',
};
