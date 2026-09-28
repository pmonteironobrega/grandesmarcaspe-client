# GitHub Actions — secrets (gmpe-site)

O CI **sempre sobrescreve** os arquivos de environment antes do build e o `.env.production` no servidor no deploy.

| Branch | Arquivo sobrescrito no build | Script |
|--------|------------------------------|--------|
| `develop` | `src/environments/environment.catalog.ts` | `build:catalog` |
| `master` | `src/environments/environment.prod.ts` | `build:production` |

Arquivos commitados em `src/environments/` são só fallback local; o valor efetivo em deploy vem dos secrets/defaults do workflow.

## Desenvolvimento (repo-level) — servidor `191.252.222.63`

| Secret | Valor típico |
|--------|----------------|
| `SSH_PRIVATE_KEY` | Chave privada SSH |
| `SSH_HOST` | `191.252.222.63` |
| `SSH_TARGET` | `/var/www/catalog-site/` |
| `SSH_USER` | `root` (opcional) |
| `API_INTERNAL_URL` | `http://127.0.0.1:3001` |
| `ASSETS_BASE_URL` | `https://api.catalog.pmonteirodev.com.br` |
| `SITE_DOMAIN` | `catalog.pmonteirodev.com.br` |
| `SITE_URL` | `https://catalog.pmonteirodev.com.br` |
| `SSR_PORT` | `4001` |

## Produção (GitHub Environment `production`) — `191.252.223.249`

| Secret | Valor típico |
|--------|----------------|
| `SSH_PRIVATE_KEY` | Chave com acesso a `root@191.252.223.249` |
| `SSH_HOST` | `191.252.223.249` |
| `SSH_TARGET` | `/var/www/gmpe-site/` |
| `SSH_USER` | `root` |
| `API_INTERNAL_URL` | `http://127.0.0.1:3001` |
| `ASSETS_BASE_URL` | `https://api.grandesmarcaspe.com.br` |
| `SITE_DOMAIN` | `grandesmarcaspe.com.br,www.grandesmarcaspe.com.br` |
| `SITE_URL` | `https://www.grandesmarcaspe.com.br` |
| `SSR_PORT` | `4001` |

### CLI

```bash
gh secret set SSH_HOST -R pmonteironobrega/grandesmarcaspe-client -e production -b "191.252.223.249"
gh secret set SSH_USER -R pmonteironobrega/grandesmarcaspe-client -e production -b "root"
gh secret set SSH_TARGET -R pmonteironobrega/grandesmarcaspe-client -e production -b "/var/www/gmpe-site/"
gh secret set SSH_PRIVATE_KEY -R pmonteironobrega/grandesmarcaspe-client -e production < ~/.ssh/id_ed25519
gh secret set ASSETS_BASE_URL -R pmonteironobrega/grandesmarcaspe-client -e production -b "https://api.grandesmarcaspe.com.br"
gh secret set SITE_URL -R pmonteironobrega/grandesmarcaspe-client -e production -b "https://www.grandesmarcaspe.com.br"
gh secret set SITE_DOMAIN -R pmonteironobrega/grandesmarcaspe-client -e production -b "grandesmarcaspe.com.br,www.grandesmarcaspe.com.br"
```
