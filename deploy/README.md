# Deploy — GMPE Site (Angular SSR)

## Bundle Angular

| Script | Config | Arquivo | Uso |
|--------|--------|---------|-----|
| `npm run build:catalog` | `catalog` | `environment.catalog.ts` | develop → servidor de dev |
| `npm run build:production` | `production` | `environment.prod.ts` | master → servidor de produção |
| `npm start` | development | `environment.ts` | local |

O CI **sempre sobrescreve** o `environment.*.ts` com secrets (`API_INTERNAL_URL`, `ASSETS_BASE_URL`, `SITE_URL`) antes do build, e reescreve `environments/.env.production` no servidor no deploy (`API_URL`, `NG_ALLOWED_HOSTS`, `APP_ENV`).

## Ambientes

| Branch | Ambiente | Host | URL | Diretório |
|--------|----------|------|-----|-----------|
| `develop` | Desenvolvimento | `191.252.222.63` | `https://catalog.pmonteirodev.com.br` | `/var/www/catalog-site/` |
| `master` | Produção | `191.252.223.249` | `https://www.grandesmarcaspe.com.br` | `/var/www/gmpe-site/` |

## Produção

- **PM2:** `gmpe-site` (`ecosystem.production.cjs`)
- **Porta SSR:** `4001`
- **API interna:** `http://127.0.0.1:3001`
- **Workflow:** [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml)
- **Secrets:** environment GitHub **production** — ver [`GITHUB-SECRETS.md`](GITHUB-SECRETS.md)

### Nginx + SSL (após DNS)

```bash
sudo bash deploy/scripts/setup-nginx-prod-site.sh   # se ainda não instalado
sudo bash deploy/scripts/certbot-prod-site.sh
```

DNS:

- **A** `grandesmarcaspe.com.br` → `191.252.223.249`
- **A** `www.grandesmarcaspe.com.br` → `191.252.223.249`

## Desenvolvimento

Ver tabela acima; workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) (só `develop`).

## Imagens

Em produção, preferir `ASSETS_BASE_URL=https://www.grandesmarcaspe.com.br` (ou a API) e sincronizar `clientes/` no servidor da API (`/var/www/gmpe-api/clientes/`) ou na origem configurada no build.
