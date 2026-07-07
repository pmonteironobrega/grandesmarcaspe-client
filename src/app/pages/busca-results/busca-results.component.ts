import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CatalogService } from '../../core/services/catalog.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { BuscaFilters, PaginatedBusca } from '../../core/models/paginated-response.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { EmpreendimentoCardComponent } from '../../shared/components/empreendimento-card/empreendimento-card.component';
import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';
import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';
import {
  buildBuscaRouteFromFilters,
  buildBuscaUrl,
  parseBuscaParamsFromQuery,
  BuscaRoute,
} from '../../core/utils/busca-url';
import { buildListUrlFromFilters } from '../../core/utils/catalog-url';
import { buildPaginationWindow } from '../../core/utils/pagination';
import { capitalizeWords } from '../../core/utils/format-text';

@Component({
  selector: 'app-busca-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbComponent,
    EmpreendimentoCardComponent,
    CategoriasPopularesComponent,
    AnuncieBannerComponent,
  ],
  templateUrl: './busca-results.component.html',
  styleUrl: './busca-results.component.scss',
})
export class BuscaResultsComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogService);
  private routeTransition = inject(RouteTransitionService);

  listagem = signal<PaginatedBusca | null>(null);
  loading = signal(true);
  error = signal(false);
  invalidQuery = signal(false);
  breadcrumb = signal<{ page: string; router: string | BuscaRoute }[]>([]);
  buildBuscaRoute = buildBuscaRouteFromFilters;
  readonly formatCategoriaNome = capitalizeWords;

  paginationPages(currentPage: number, totalPages: number): number[] {
    return buildPaginationWindow(currentPage, totalPages);
  }

  buildGroupListUrl(filters: BuscaFilters, categoriaSlug: string): string {
    return buildListUrlFromFilters({
      categoria: categoriaSlug,
      uf: filters.uf,
      cidade: filters.cidade,
      bairro: filters.bairro,
    });
  }

  ngOnInit(): void {
    const loadListagem = (): void => {
      const urlTree = this.router.parseUrl(this.router.url);
      if (!urlTree.root.children['primary']?.segments.some((s) => s.path === 'busca')) {
        return;
      }

      const params = parseBuscaParamsFromQuery(urlTree.queryParams);
      if (!params) {
        this.invalidQuery.set(true);
        this.loading.set(false);
        this.error.set(false);
        this.listagem.set(null);
        this.breadcrumb.set([]);
        this.routeTransition.releaseContent();
        return;
      }

      this.invalidQuery.set(false);
      this.loading.set(true);
      this.error.set(false);

      this.catalogService.buscar(params).subscribe({
        next: (response) => {
          this.listagem.set(response);
          this.breadcrumb.set(this.buildBreadcrumb(response));
          this.stripCategoriaFromUrlWhenGrouped(response);
          this.loading.set(false);
          this.routeTransition.releaseContent();
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
          this.routeTransition.releaseContent();
        },
      });
    };

    loadListagem();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => loadListagem());
  }

  private buildBreadcrumb(
    response: PaginatedBusca,
  ): { page: string; router: string | BuscaRoute }[] {
    const { filters } = response.meta;
    const crumbs: { page: string; router: string | BuscaRoute }[] = [
      {
        page: 'Busca',
        router: buildBuscaRouteFromFilters({ ...filters, categoria: null, cidade: null, bairro: null }, 1),
      },
    ];

    if (filters.categoria) {
      crumbs.push({
        page: capitalizeWords(filters.categoria),
        router: buildBuscaRouteFromFilters({ ...filters, cidade: null, bairro: null }, 1),
      });
    }

    if (filters.cidade) {
      crumbs.push({
        page: capitalizeWords(filters.cidade),
        router: buildBuscaRouteFromFilters({ ...filters, bairro: null }, 1),
      });
    }

    if (filters.bairro) {
      crumbs.push({ page: capitalizeWords(filters.bairro), router: '' });
    }

    return crumbs;
  }

  private stripCategoriaFromUrlWhenGrouped(response: PaginatedBusca): void {
    if (!response.meta.groupedByCategoria) {
      return;
    }

    const urlTree = this.router.parseUrl(this.router.url);
    if (!urlTree.queryParams['categoria']) {
      return;
    }

    const params = parseBuscaParamsFromQuery(urlTree.queryParams);
    if (!params) {
      return;
    }

    void this.router.navigateByUrl(
      buildBuscaUrl({
        q: params.q,
        uf: params.uf,
        cidade: params.cidade,
        bairro: params.bairro,
      }),
      { replaceUrl: true },
    );
  }
}
