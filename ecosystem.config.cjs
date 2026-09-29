/** PM2 — GMPE Catalog Site (Angular SSR) — desenvolvimento remoto */
module.exports = {
  apps: [
    {
      name: 'catalog-site',
      script: 'dist/grandesmarcaspe-site/server/server.mjs',
      cwd: '/var/www/catalog-site',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      // Runtime config comes from environments/.env.production (written by CI).
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
