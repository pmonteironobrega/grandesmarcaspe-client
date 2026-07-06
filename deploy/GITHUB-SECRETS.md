# GitHub Actions — secrets de deploy (gmpe-site)

Cadastre em **Settings → Secrets and variables → Actions** do repositório `gmpe-site`.

| Secret | Valor |
|--------|-------|
| `SSH_PRIVATE_KEY` | Mesma chave do servidor Locaweb |
| `SSH_HOST` | `191.252.222.63` |
| `SSH_USER` | `root` |
| `SSH_PORT` | `22` (opcional) |
| `SSH_TARGET` | `/var/www/catalog-site/` |
| `API_INTERNAL_URL` | `http://127.0.0.1:3001` (SSR → API no servidor) |
| `ASSETS_BASE_URL` | `https://api.catalog.pmonteirodev.com.br` (imagens `/clientes`) |
| `SITE_DOMAIN` | `catalog.pmonteirodev.com.br` |
| `SSR_PORT` | `4001` (opcional) |

## Build de produção

O workflow gera `src/environments/environment.prod.ts` antes do `ng build`:

- `apiUrl` → `API_INTERNAL_URL` (chamadas SSR server-side)
- `assetsBaseUrl` → `ASSETS_BASE_URL` (URLs de imagem no HTML)
- No browser, chamadas JSON usam paths relativos e o proxy SSR encaminha para `API_URL`

## Secrets compartilhados com `grandesmarcaspe-site-server`

`SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER` e `SSH_PORT` podem ser os mesmos do deploy da API.
