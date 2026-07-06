# Deploy — GMPE Site (Angular SSR)

Mesmo servidor da API de catálogo (`191.252.222.63`).

## Domínios

| App | URL | Porta interna |
|-----|-----|----------------|
| Site (SSR) | `https://catalog.pmonteirodev.com.br` | `4001` |
| API | `https://api.catalog.pmonteirodev.com.br` | `3001` |

## Servidor

- **Diretório:** `/var/www/catalog-site/`
- **PM2:** `catalog-site` (`ecosystem.config.cjs`)
- **Workflow:** [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- **Secrets:** [`GITHUB-SECRETS.md`](GITHUB-SECRETS.md)

## Primeira vez no servidor

```bash
mkdir -p /var/www/catalog-site/environments
sudo bash deploy/scripts/setup-nginx-catalog-site.sh
sudo bash deploy/scripts/certbot-catalog-site.sh
```

DNS: registro **A** `catalog.pmonteirodev.com.br` → `191.252.222.63`

## Fluxo do deploy

1. Gera `environment.prod.ts` com secrets (`API_INTERNAL_URL`, `ASSETS_BASE_URL`)
2. `npm ci` + `ng build`
3. rsync `dist/`, `package.json`, `ecosystem.config.cjs`
4. Escreve `environments/.env.production` (`API_URL`, `PORT`, `NG_ALLOWED_HOSTS`)
5. `npm ci --omit=dev` + `pm2 restart catalog-site`

## Imagens

Servidas pela API em `https://api.catalog.pmonteirodev.com.br/clientes/...`  
(`ASSETS_BASE_URL` no build de produção).
