# AGENTS.md — Grandes Marcas PE Site

Site institucional e de listagem de empresas da **Grandes Marcas PE**, construído com **Angular 20** e **SSR (Server-Side Rendering)** via Express. O conteúdo da interface é em **português brasileiro**.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Angular 20.3.x (standalone components) |
| Linguagem | TypeScript 5.8 (strict mode) |
| Estilos | SCSS |
| SSR | `@angular/ssr` + Express 5 |
| UI | ngx-bootstrap 20, ngx-owl-carousel-o |
| HTTP | `@angular/common/http` com `withFetch()` |
| Testes | Jasmine + Karma |
| Deploy | GitHub Actions → VPS (rsync + PM2) |

## Estrutura do projeto

```
src/
├── app/
│   ├── core/
│   │   ├── models/       # Interfaces (categoria, cliente-*, paginated-response, estado)
│   │   ├── constants/    # Dados estáticos (estados.ts)
│   │   ├── services/     # Serviços singleton (catalog.service.ts)
│   │   └── utils/        # Helpers de URL (catalog-url.ts)
│   ├── layout/
│   │   ├── header/       # Shell: cabeçalho
│   │   └── footer/       # Shell: rodapé
│   ├── shared/
│   │   └── components/   # Widgets reutilizáveis (breadcrumb, share, anuncie-banner…)
│   ├── pages/            # Smart components de rota
│   ├── app.ts
│   ├── app.config.ts
│   ├── app.config.server.ts
│   ├── app.routes.ts
│   └── app.routes.server.ts
├── environments/
├── server.ts
├── server/
│   └── cache.middleware.ts
└── styles.scss

public/                   # Assets estáticos (img/, variables/variables.scss)
proxy.conf.js            # Proxy dev → API :3000; /c/ e /r/ ignoram HTML (SPA)
```

## Comandos

```bash
npm install
npm start                                          # http://localhost:4200 (proxy → API :3000)
npm run build                                      # dist/grandesmarcaspe-site/
npm run serve:ssr:grandesmarcaspe-site             # porta 4000
npm test
ng generate component nome-do-componente
```

**Deploy:**
- **Desenvolvimento** (servidor atual): push na branch `develop` → `.github/workflows/deploy.yml` → rsync + PM2 (`server/server.mjs`).
- **Produção:** branch `master` (workflow ainda não configurado).

### Imagens de clientes

- Arquivos legado: `clientes/{id}/marca.{jpg|png|gif}`, `galeria1.*`, `galeria2.*`…
- Banco: `clientes_imagens.caminho` → `clientes/{id}/{arquivo}` (servido em `assetsBaseUrl`); sem marca → `clientes/default.png`
- Importação: no repo `grandesmarcaspe-server`, pasta `clientes/` na raiz do backend; `npm run db:import:images -- --replace`
- Dry-run: acrescentar `--dry-run` antes de gravar no banco
- Deploy das imagens: pasta `clientes/` deve existir na raiz web de produção (`https://www.grandesmarcaspe.com.br/clientes/...`), fora do build Angular

## Servidores de desenvolvimento

**Quem levanta os servidores é o usuário, não o agente.**

- Não executar `npm start`, `npm run serve:ssr:*` nem matar processos em portas (4000, 4200, 3000, etc.) sem pedido explícito.
- Informar os comandos necessários e deixar o usuário iniciar/parar os servidores — evita conflito de porta e processos órfãos em background.
- Para validar mudanças, preferir `npm run build` e `npm test`. Testes visuais no browser dependem do usuário subir o servidor e a API.

## API Backend (grandesmarcaspe-server)

Backend NestJS read-only em `http://localhost:3000` (sem prefixo `/api`). Produção: `environment.prod.ts` → `https://api.grandesmarcaspe.com.br`.

### Catálogo público implementado (GET)

| Grupo | Endpoints | Resposta |
|-------|-----------|----------|
| Categorias | `GET /categorias`, `GET /categorias?comClientes=true&uf=` (só com clientes ativos na UF), `GET /categorias/slug/:slug`, `GET /categorias/:id` | `CategoriaResponse` |
| Listagem legada | `GET /c/:categoriaSlug/:a[/:b[/:c[/:d[/:e]]]]` | `PaginatedClientesResponse` (15/página) |
| Destaques home | `GET /catalog/destaques?uf=&limit=` | `ClienteListItemResponse[]` (com imagem → categorias populares → acessos → plano) |
| Categorias populares | `GET /catalog/categorias-populares?uf=&limit=` | `CategoriaResponse[]` (só categorias com clientes na UF) |
| Geography | `GET /geography/uf`, `GET /geography/uf/:uf/cidades?comClientes=&categoria=`, `GET /geography/cidades/:slug/bairros?uf=&comClientes=&categoria=` | `UfResponse`, `CidadeResponse`, `BairroResponse` |
| Detalhe legado | `GET /r/:clienteSlug/:cidadeSlug/:bairroSlug/:uf` | `ClienteDetailResponse` |
| Busca textual | `GET /busca?q=&uf=&categoria=&cidade=&bairro=&page=` | `PaginatedBuscaResponse` (15/página) |

Campos pesquisados em `/busca`: `nome`, `slogan`, `descricao`, `subdescricao`, `categoria.nome`, `tags.nome`, `cidade.nome`, `bairro.nome`, `logradouro` — comparação **sem acentos** (ex.: `São José` = `sao jose`).

**Parsing automático no backend:** frases como `academias em boa viagem` detectam categoria + bairro/cidade na UF; suporta **plural/singular** (`academias` → `academia`). Categorias amplas usam busca associada: clientes da categoria **ou** com o termo no nome/descrição (ex.: "Academia de Dança").

### Auxiliar / observabilidade (não usar no frontend de catálogo)

- `GET /health`, `/health/liveness`, `/health/readiness`, `/health/metrics`
- CRUD `POST|GET|PATCH|DELETE /users` — módulo separado, fora do catálogo

### URLs legadas (contrato SEO)

```
/c/{categoria}/{uf}                          → listagem por categoria+UF
/c/{categoria}/{uf}?page=N                   → paginação (page ≥ 2; omitir ?page=1)
/c/{categoria}/{cidade}/{uf}                 → filtro cidade
/c/{categoria}/{cidade}/{bairro}/{uf}        → filtro bairro
/r/{cliente}/{cidade}/{bairro}/{uf}          → detalhe do cliente
```

Referência completa: `grandesmarcaspe-server/docs/navegacao-legado.md`.

### Mapeamento Angular ↔ API

| Rota Angular | API | Componente |
|--------------|-----|------------|
| `/` | `GET /catalog/destaques` + `GET /catalog/categorias-populares` (por UF) | `HomeComponent` |
| `/c/**` | `GET /c/...` (mesmo path) | `CategoriaListComponent` |
| `/busca` | `GET /busca?q=...&uf=...` | `BuscaResultsComponent` |
| `/r/:cliente/:cidade/:bairro/:uf` | `GET /r/...` | `ClienteDetailComponent` |
| `/sobre`, `/anuncie`, etc. | — (estáticas) | sem mudança |

### HTTP no frontend

- **Browser (`ng serve`):** paths relativos (`/c/academias/pe`) via `proxy.conf.js`. Navegação HTML em `/c/` e `/r/` fica no Angular; chamadas JSON vão para a API.
- **SSR (Node):** `CatalogService` usa `environment.apiUrl` absoluto.
- **SSR Express (`serve:ssr`):** proxy em `server.ts` para requisições JSON em `/catalog`, `/geography`, `/categorias`, `/busca`, `/c/`, `/r/` (navegação HTML continua no Angular).
- **Imagens:** caminhos relativos do banco → `environment.assetsBaseUrl` via `resolveImageUrl()`. Em dev: `http://localhost:3000/clientes/...` (NestJS); produção: `https://www.grandesmarcaspe.com.br/clientes/...`.

## Rotas

| Path | Componente | SSR |
|------|------------|-----|
| `/` | `HomeComponent` | Prerender (dados carregados no cliente) |
| `/c/**` | `CategoriaListComponent` | Server (cache LRU, TTL `SSR_CACHE_TTL`) |
| `/busca` | `BuscaResultsComponent` | Server (cache LRU) |
| `/r/:cliente/:cidade/:bairro/:uf` | `ClienteDetailComponent` | Server (cache LRU) |
| `/sobre` | `SobreComponent` | Prerender |
| `/anuncie` | `AnunciePageComponent` | Prerender |
| `/termos-privacidade` | `TermosPrivacidadeComponent` | Prerender |
| `/fale-conosco` | `FaleConoscoPageComponent` | Prerender |

Ao adicionar rotas, atualize **ambos** `app.routes.ts` e `app.routes.server.ts`. Se a rota for prerender, adicione também em `src/server/cache.middleware.ts` (`PRERENDER_ROUTES`).

## Padrões de código

### Convenções de nomenclatura

| Artefato | Padrão |
|----------|--------|
| Arquivo TS | `{nome}.component.ts` |
| Classe | `{Nome}Component` |
| Serviço | `{domínio}.service.ts` em `core/services/` |
| Modelo | `{nome}.model.ts` em `core/models/` |
| Metadata | `styleUrl` (singular), `standalone: true` |

### Angular moderno

- Standalone components — sem NgModules.
- Injeção com `inject()`.
- Signals — `signal()`, `afterNextRender()` para dados client-only.
- Control flow nativo — `@if`, `@for`, `@switch`.
- Home híbrida: prerender estático + `CatalogService.getDestaques()` / `getCategoriasPopulares()` via `afterNextRender()` + `LocationStateService` (UF).

```typescript
@Component({
  selector: 'app-exemplo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './exemplo.component.html',
  styleUrl: './exemplo.component.scss',
})
export class ExemploComponent {
  private catalogService = inject(CatalogService);
}
```

### Serviços e modelos

- Serviços em `src/app/core/services/`, `providedIn: 'root'`.
- Modelos em `src/app/core/models/`.
- Constantes em `src/app/core/constants/`.
- URLs da API via `environment.apiUrl` (SSR) ou paths relativos (browser com proxy).

### Templates e conteúdo

- Textos de UI em **português brasileiro**.
- Imagens em `public/img/` — caminho absoluto (`/img/logo-header.svg`).
- Imagens de clientes — `assetsBaseUrl` + caminho relativo do banco.
- Páginas compõem widgets de `shared/components/`.
- Layout (header/footer) fica em `layout/`.

## Estilos (SCSS)

- Variáveis em `public/variables/variables.scss`.
- Globais em `src/styles.scss`.
- `layout/` e `pages/`: `@use '../../../../public/variables/variables.scss' as *;`
- `shared/components/`: `@use '../../../../../public/variables/variables.scss' as *;`

## SSR e cache

| Camada | Implementação |
|--------|---------------|
| Compressão Gzip | `compression` em `server.ts` |
| Assets estáticos | `max-age=31536000, immutable` |
| Rotas prerender | `max-age=3600, stale-while-revalidate=86400` |
| Rotas `/c/**`, `/r/**` e `/busca` | `no-cache` + cache LRU em memória (TTL via `SSR_CACHE_TTL`, default 300s) |
| HTTP transfer cache | `withHttpTransferCacheOptions()` em `app.config.ts` |
| API proxy SSR | `createApiProxyMiddleware()` em `server.ts` para JSON em `/catalog`, `/geography`, `/categorias`, `/busca`, `/c/`, `/r/` |
| Dev proxy | `proxy.conf.js` no `ng serve` (bypass HTML em `/c/`, `/r/`) |

Documentação: `SSR_OTIMIZACOES.md`.

## Busca no header

- **Texto** (≥ 2 chars) → `/busca?q=...&uf=...` (+ filtros opcionais de categoria/cidade/bairro); navega no **Buscar** ou Enter.
- **Só filtros geo** (categoria obrigatória, sem texto) → `/c/{categoria}/.../{uf}`; navega ao selecionar categoria, cidade ou bairro na busca avançada (ou no Buscar/Enter).
- **Limpar busca:** link **Limpar busca** no header (texto, filtros e volta à home); **Limpar filtros** na busca avançada. Ao remover todos os filtros em rota `/busca` ou `/c/**`, redireciona para `/`. Ao navegar para `/` (logo, menu, etc.), texto e filtros do header são zerados.
- Com filtros geo ativos, o painel da busca avançada permanece **expandido** (sincronizado com a URL em `/c/**` e `/busca?categoria=...`).

## Lacunas conhecidas

- Nenhuma relacionada à busca textual.

## Verificação antes de entregar

1. `npm run build`
2. `npm test` (se alterou lógica com specs)
3. Novas rotas em `app.routes.server.ts` e `cache.middleware.ts`
4. Teste visual: usuário executa `npm start` (API em :3000) ou `npm run serve:ssr:grandesmarcaspe-site` quando necessário
