# GitHub Actions — secrets de deploy (gmpe-site)

Cadastre em **Settings → Secrets and variables → Actions** do repositório `pmonteironobrega/grandesmarcaspe-client`.

O workflow só roda nesse repo (`if: github.repository == 'pmonteironobrega/grandesmarcaspe-client'`).

## Secrets obrigatórios

| Secret | Valor |
|--------|-------|
| `SSH_PRIVATE_KEY` | Chave privada SSH de deploy |
| `SSH_HOST` | `191.252.222.63` |
| `SSH_TARGET` | `/var/www/catalog-site/` |

## Secrets opcionais

| Secret | Default / valor típico |
|--------|------------------------|
| `SSH_USER` | `root` |
| `SSH_PORT` | `22` |
| `API_INTERNAL_URL` | `http://127.0.0.1:3001` (SSR → API no servidor) |
| `ASSETS_BASE_URL` | `https://api.catalog.pmonteirodev.com.br` (imagens `/clientes`) |
| `SITE_DOMAIN` | `catalog.pmonteirodev.com.br` (`NG_ALLOWED_HOSTS`) |
| `SITE_URL` | `https://catalog.pmonteirodev.com.br` (canonical / SEO) |
| `SSR_PORT` | `4001` |

## Build de produção

O workflow gera `src/environments/environment.prod.ts` antes do `ng build`:

- `apiUrl` → `API_INTERNAL_URL` (chamadas SSR server-side)
- `assetsBaseUrl` → `ASSETS_BASE_URL` (URLs de imagem no HTML)
- `siteUrl` → `SITE_URL`
- No browser, chamadas JSON usam paths relativos e o proxy SSR encaminha para `API_URL`

No servidor, reescreve `environments/.env.production` (PM2/SSR) e faz rsync de `package.json` / `ecosystem.config.cjs` + `dist/`.

## Secrets compartilhados com a API

`SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER` e `SSH_PORT` podem ser os mesmos do deploy da API.

### CLI (requer `gh auth login`)

```bash
gh secret set SSH_HOST -R pmonteironobrega/grandesmarcaspe-client -b "191.252.222.63"
gh secret set SSH_USER -R pmonteironobrega/grandesmarcaspe-client -b "root"
gh secret set SSH_TARGET -R pmonteironobrega/grandesmarcaspe-client -b "/var/www/catalog-site/"
gh secret set SSH_PRIVATE_KEY -R pmonteironobrega/grandesmarcaspe-client < ~/.ssh/sua_chave_deploy

gh secret set API_INTERNAL_URL -R pmonteironobrega/grandesmarcaspe-client -b "http://127.0.0.1:3001"
gh secret set ASSETS_BASE_URL -R pmonteironobrega/grandesmarcaspe-client -b "https://api.catalog.pmonteirodev.com.br"
gh secret set SITE_DOMAIN -R pmonteironobrega/grandesmarcaspe-client -b "catalog.pmonteirodev.com.br"
gh secret set SITE_URL -R pmonteironobrega/grandesmarcaspe-client -b "https://catalog.pmonteirodev.com.br"
gh secret set SSR_PORT -R pmonteironobrega/grandesmarcaspe-client -b "4001"
```
