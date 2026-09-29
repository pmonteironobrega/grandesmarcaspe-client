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
      // Runtime config comes from environments/.env.production (written by CI).
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
