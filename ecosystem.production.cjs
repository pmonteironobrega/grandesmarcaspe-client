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
      // Recicla antes de a VPS entrar em swap. O cache SSR tem teto próprio;
      // este limite cobre qualquer outro crescimento do processo.
      max_memory_restart: '768M',
      // Runtime config comes from environments/.env.production (written by CI).
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
