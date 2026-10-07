import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CatalogService } from './catalog.service';
import { GeographyService } from './geography.service';
import { LocationStateService } from './location-state.service';
import { buildListUrlFromFilters } from '../utils/catalog-url';

type ToolInput = Record<string, unknown>;

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(input: ToolInput, options?: { signal?: AbortSignal }): unknown;
  annotations?: { readOnlyHint?: boolean };
}

interface ModelContext {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): unknown;
}

const UF_PARAM = {
  type: 'string',
  description: 'Sigla da UF em minúsculas (ex.: pe). Se omitida, usa a UF selecionada no site.',
};

/** Exposes the read-only catalog to in-browser AI agents (WebMCP imperative API). */
@Injectable({ providedIn: 'root' })
export class WebMcpService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private router = inject(Router);
  private catalog = inject(CatalogService);
  private geography = inject(GeographyService);
  private locationState = inject(LocationStateService);
  private registered = false;

  register(): void {
    if (this.registered || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const doc = this.document as Document & { modelContext?: ModelContext };
    const modelContext = doc.modelContext;
    if (!modelContext || typeof modelContext.registerTool !== 'function') {
      return;
    }
    this.registered = true;
    for (const tool of this.buildTools()) {
      void Promise.resolve(modelContext.registerTool(tool)).catch(() => undefined);
    }
  }

  buildTools(): WebMcpTool[] {
    return [
      {
        name: 'listar_categorias',
        description:
          'Lista as categorias de estabelecimentos com clientes ativos em uma UF. Use o slug retornado nas outras ferramentas.',
        inputSchema: { type: 'object', properties: { uf: UF_PARAM } },
        annotations: { readOnlyHint: true },
        execute: (input, options) => {
          const uf = this.resolveUf(input);
          return this.request(this.catalog.getCategorias(uf), options?.signal).then(
            (categorias) => ({
              uf,
              categorias: categorias.map(({ slug, nome }) => ({ slug, nome })),
            }),
            this.failure(options?.signal),
          );
        },
      },
      {
        name: 'listar_cidades',
        description: 'Lista as cidades de uma UF que têm estabelecimentos na categoria informada.',
        inputSchema: {
          type: 'object',
          properties: {
            categoria: { type: 'string', description: 'Slug da categoria (ver listar_categorias).' },
            uf: UF_PARAM,
          },
          required: ['categoria'],
        },
        annotations: { readOnlyHint: true },
        execute: (input, options) => {
          const uf = this.resolveUf(input);
          const categoria = this.readSlug(input, 'categoria');
          if (!categoria) {
            return { error: 'Informe o slug da categoria.' };
          }
          return this.request(
            this.geography.getCidadesByUf(uf, { comClientes: true, categoria }),
            options?.signal,
          ).then((cidades) => ({
            uf,
            categoria,
            cidades: cidades.map(({ slug, nome }) => ({ slug, nome })),
          }), this.failure(options?.signal));
        },
      },
      {
        name: 'listar_bairros',
        description: 'Lista os bairros de uma cidade que têm estabelecimentos na categoria informada.',
        inputSchema: {
          type: 'object',
          properties: {
            categoria: { type: 'string', description: 'Slug da categoria.' },
            cidade: { type: 'string', description: 'Slug da cidade (ver listar_cidades).' },
            uf: UF_PARAM,
          },
          required: ['categoria', 'cidade'],
        },
        annotations: { readOnlyHint: true },
        execute: (input, options) => {
          const uf = this.resolveUf(input);
          const categoria = this.readSlug(input, 'categoria');
          const cidade = this.readSlug(input, 'cidade');
          if (!categoria || !cidade) {
            return { error: 'Informe os slugs da categoria e da cidade.' };
          }
          return this.request(
            this.geography.getBairrosByCidade(cidade, uf, { comClientes: true, categoria }),
            options?.signal,
          ).then((bairros) => ({
            uf,
            categoria,
            cidade,
            bairros: bairros.map(({ slug, nome }) => ({ slug, nome })),
          }), this.failure(options?.signal));
        },
      },
      {
        name: 'abrir_listagem_categoria',
        description:
          'Abre no site a lista de estabelecimentos de uma categoria, opcionalmente filtrada por cidade e bairro.',
        inputSchema: {
          type: 'object',
          properties: {
            categoria: { type: 'string', description: 'Slug da categoria.' },
            cidade: { type: 'string', description: 'Slug da cidade (opcional).' },
            bairro: { type: 'string', description: 'Slug do bairro (opcional; exige cidade).' },
            uf: UF_PARAM,
          },
          required: ['categoria'],
        },
        execute: (input) => {
          const categoria = this.readSlug(input, 'categoria');
          if (!categoria) {
            return { error: 'Informe o slug da categoria.' };
          }
          const cidade = this.readSlug(input, 'cidade');
          const bairro = cidade ? this.readSlug(input, 'bairro') : null;
          const url = buildListUrlFromFilters({ categoria, uf: this.resolveUf(input), cidade, bairro });
          return this.zone
            .run(() => this.router.navigateByUrl(url))
            .then((ok) => (ok ? { url } : { error: 'Não foi possível abrir a listagem.', url }));
        },
      },
    ];
  }

  private resolveUf(input: ToolInput): string {
    return this.readSlug(input, 'uf') ?? this.locationState.uf().toLowerCase();
  }

  private readSlug(input: ToolInput, key: string): string | null {
    const value = input?.[key];
    if (typeof value !== 'string') {
      return null;
    }
    const slug = value.trim().toLowerCase();
    return /^[a-z0-9-]+$/.test(slug) ? slug : null;
  }

  private failure(signal?: AbortSignal): (err: unknown) => { error: string } {
    return (err) => {
      if (signal?.aborted) {
        throw err;
      }
      return { error: 'Falha ao consultar o catálogo. Tente novamente.' };
    };
  }

  private request<T>(source: Observable<T>, signal?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      const sub = source.subscribe({
        next: (value) => resolve(value),
        error: (err) => reject(err),
      });
      signal?.addEventListener(
        'abort',
        () => {
          sub.unsubscribe();
          reject(signal.reason);
        },
        { once: true },
      );
    });
  }
}
