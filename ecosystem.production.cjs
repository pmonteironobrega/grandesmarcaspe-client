/** PM2 — GMPE Site produção (Angular SSR — 191.252.223.249) */
module.exports = {
  apps: [
    {
      name: 'gmpe-site',
      script: 'dist/grandesmarcaspe-site/server/server.mjs',
      cwd: '/var/www/gmpe-site',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      env_production: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '4001',
        API_URL: 'http://127.0.0.1:3001',
        NG_ALLOWED_HOSTS: 'grandesmarcaspe.com.br,www.grandesmarcaspe.com.br',
        SSR_CACHE_TTL: '300',
      },
    },
  ],
};
