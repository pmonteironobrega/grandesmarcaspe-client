# Otimizações SSR — Angular 20.3.6

Documentação alinhada com a implementação atual do projeto.

## Arquitetura

- **Build:** `outputMode: "server"` em `angular.json`
- **Servidor:** Express 5 em `src/server.ts`
- **Cache helpers:** `src/server/cache.middleware.ts`
- **Rotas SSR:** `src/app/app.routes.server.ts`

## Cache implementado

### 1. Compressão Gzip (`server.ts`)

Middleware `compression({ level: 6 })` reduz tamanho das respostas HTTP.

### 2. Headers por tipo de rota (`server.ts` + `cache.middleware.ts`)

| Tipo | Cache-Control |
|------|---------------|
| Assets (js, css, img, fonts) | `public, max-age=31536000, immutable` |
| Prerender (`/`, `/sobre`, `/anuncie`, `/termos-privacidade`, `/fale-conosco`) | `public, max-age=3600, stale-while-revalidate=86400` |
| SSR dinâmico (`/c/**`, `/r/**`) | `no-cache` |

### 3. Cache LRU de rota SSR (`cache.middleware.ts`)

- Aplica-se a rotas `/c/**` e `/r/**`
- TTL configurável via env `SSR_CACHE_TTL` (segundos, default: 300)
- Header de debug: `X-SSR-Cache: HIT|MISS|BYPASS`
- Desabilitar: `SSR_CACHE_TTL=0`

### 4. HTTP Transfer Cache (`app.config.ts`)

```typescript
provideClientHydration(
  withHttpTransferCacheOptions({
    includeRequestsWithAuthHeaders: false,
    filter: (req) => req.method === 'GET',
  }),
  withEventReplay(),
)
```

Evita requisições GET duplicadas entre servidor e cliente após hidratação.

### 5. Home híbrida (`pages/home/home.component.ts`)

- Rota `/` permanece `RenderMode.Prerender`
- Destaques e categorias populares via `CatalogService` em `afterNextRender()` apenas no browser
- HTML prerenderizado leve e cacheável; dados sempre frescos no cliente

### 6. API proxy SSR (`server.ts` + `cache.middleware.ts`)

Requisições JSON em `/catalog`, `/geography`, `/categorias`, `/c/`, `/r/` são proxyadas para `environment.apiUrl`. Navegação HTML em `/c/` e `/r/` continua no Angular.

### 7. Assets estáticos Express

`express.static` com `maxAge: '1y'`, `etag: true`, `lastModified: true`.

## Render modes por rota

| Rota | RenderMode |
|------|------------|
| `/` | Prerender |
| `/c/**` | Server |
| `/r/**` | Server |
| `/sobre`, `/anuncie`, `/termos-privacidade`, `/fale-conosco` | Prerender |

## Comandos

```bash
npm install
npm start
npm run build
npm run serve:ssr:grandesmarcaspe-site
```

## Deploy

PM2 entrypoint: `dist/grandesmarcaspe-site/server/server.mjs` (ver `.github/workflows/deploy.yml`).

Hosts autorizados no SSR (patch de segurança SSRF): configurados em `angular.json` (`security.allowedHosts`) e `src/server.ts` (`AngularNodeAppEngine`). Para produção, defina `NG_ALLOWED_HOSTS=seudominio.com` no servidor.

## Futuro (não implementado)

- Redis para cache distribuído
- Nginx `proxy_cache` na frente do Express
- Service Worker para cache offline
