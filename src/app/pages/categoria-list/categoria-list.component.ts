import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CatalogService } from '../../core/services/catalog.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { SeoService } from '../../core/services/seo.service';
import { LocationStateService } from '../../core/services/location-state.service';
import { PaginatedClientes } from '../../core/models/paginated-response.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { EmpreendimentoCardComponent } from '../../shared/components/empreendimento-card/empreendimento-card.component';
import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';
import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';
import {
  buildListRouteFromFilters,
  buildListUrlFromFilters,
  ListRoute,
} from '../../core/utils/catalog-url';
import { buildPaginationWindow } from '../../core/utils/pagination';
import { capitalizeWords } from '../../core/utils/format-text';
import {
  buildListagemSeoPayload,
  isListagemPageOutOfRange,
} from '../../core/utils/listagem-seo';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbComponent,
    EmpreendimentoCardComponent,
    CategoriasPopularesComponent,
    AnuncieBannerComponent,
    AdSlotComponent,
  ],
  templateUrl: './categoria-list.component.html',
  styleUrl: './categoria-list.component.scss',
})
export class CategoriaListComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogService);
  private routeTransition = inject(RouteTransitionService);
  private seo = inject(SeoService);
  private locationState = inject(LocationStateService);

  listagem = signal<PaginatedClientes | null>(null);
  heading = signal('');
  loading = signal(true);
  error = signal(false);
  breadcrumb = signal<{ page: string; router: string | ListRoute }[]>([]);
  buildListRoute = buildListRouteFromFilters;
  readonly adSlots = ADSENSE_SLOTS;

  paginationPages(currentPage: number, totalPages: number): number[] {
    return buildPaginationWindow(currentPage, totalPages);
  }

  ngOnInit(): void {
    const loadListagem = (): void => {
      const urlTree = this.router.parseUrl(this.router.url);
      const path = urlTree.root.children['primary']?.segments.map((s) => s.path).join('/') ?? '';
      if (!path.startsWith('c/')) {
        return;
      }

      const pageParam = urlTree.queryParams['page'];
      const page = Number(pageParam);
      const resolvedPage = Number.isInteger(page) && page >= 2 ? page : 1;

      this.loading.set(true);
      this.error.set(false);

      this.catalogService.getClientesByLegacyPath(path, resolvedPage).subscribe({
        next: (response) => {
          if (response.meta.page >= 2 && isListagemPageOutOfRange(response)) {
            this.redirectToFirstPage(buildListUrlFromFilters(response.meta.filters, 1));
            return;
          }

          const seo = buildListagemSeoPayload(environment.siteUrl, response);
          this.seo.apply(seo);

          if (response.meta.filters.uf) {
            this.locationState.setUf(response.meta.filters.uf);
          }
          this.listagem.set(response);
          this.heading.set(seo.heading);
          this.breadcrumb.set(this.buildBreadcrumb(response));
          this.loading.set(false);
          this.routeTransition.releaseContent();
        },
        error: (err: unknown) => {
          this.seo.markError(err);
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

  private redirectToFirstPage(target: string): void {
    this.loading.set(false);
    this.routeTransition.releaseContent();
    if (!this.seo.redirectPermanently(target)) {
      void this.router.navigateByUrl(target, { replaceUrl: true });
    }
  }

  private buildBreadcrumb(response: PaginatedClientes): { page: string; router: string | ListRoute }[] {
    const crumbs: { page: string; router: string | ListRoute }[] = [];
    const { filters } = response.meta;
    const categoriaNome = capitalizeWords(
      response.data[0]?.categoria?.nome ?? filters.categoria,
    );

    if (filters.uf) {
      crumbs.push({
        page: categoriaNome,
        router: buildListRouteFromFilters({ ...filters, cidade: null, bairro: null }, 1),
      });
    }

    if (filters.cidade) {
      crumbs.push({
        page: filters.cidade,
        router: buildListRouteFromFilters({ ...filters, bairro: null }, 1),
      });
    }

    if (filters.bairro) {
      crumbs.push({ page: filters.bairro, router: '' });
    }

    return crumbs;
  }
}
