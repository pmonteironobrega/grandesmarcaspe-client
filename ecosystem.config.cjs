/** PM2 — GMPE Catalog Site (Angular SSR) */
module.exports = {
  apps: [
    {
      name: 'catalog-site',
      script: 'dist/grandesmarcaspe-site/server/server.mjs',
      cwd: '/var/www/catalog-site',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      env_production: {
        NODE_ENV: 'production',
        PORT: '4001',
        API_URL: 'http://127.0.0.1:3001',
        NG_ALLOWED_HOSTS: 'catalog.pmonteirodev.com.br',
        SSR_CACHE_TTL: '300',
      },
    },
  ],
};
