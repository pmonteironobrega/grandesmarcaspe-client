import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CatalogService } from '../../core/services/catalog.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { SeoService } from '../../core/services/seo.service';
import { LocationStateService } from '../../core/services/location-state.service';
import { LugaresCategoria, PaginatedLugares } from '../../core/models/paginated-response.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { EmpreendimentoCardComponent } from '../../shared/components/empreendimento-card/empreendimento-card.component';
import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';
import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';
import {
  buildListRouteFromFilters,
  buildLugaresRoute,
  buildLugaresUrl,
  ListRoute,
} from '../../core/utils/catalog-url';
import { buildPaginationWindow } from '../../core/utils/pagination';
import { capitalizeWords } from '../../core/utils/format-text';
import {
  buildLugaresSeoPayload,
  isLugaresPageOutOfRange,
  resolveLugaresNames,
} from '../../core/utils/lugares-seo';
import { environment } from '../../../environments/environment';

/** Legacy `/r/lugares/{cidade}[/{bairro}]/{uf}`: every categoria in a cidade or bairro. */
@Component({
  selector: 'app-lugares-list',
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
  templateUrl: './lugares-list.component.html',
})
export class LugaresListComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogService);
  private routeTransition = inject(RouteTransitionService);
  private seo = inject(SeoService);
  private locationState = inject(LocationStateService);

  lugares = signal<PaginatedLugares | null>(null);
  heading = signal('');
  location = signal('');
  loading = signal(true);
  error = signal(false);
  breadcrumb = signal<{ page: string; router: string | ListRoute }[]>([]);
  readonly adSlots = ADSENSE_SLOTS;
  readonly capitalize = capitalizeWords;

  paginationPages(currentPage: number, totalPages: number): number[] {
    return buildPaginationWindow(currentPage, totalPages);
  }

  pageRoute(result: PaginatedLugares, page: number): ListRoute {
    const { geografia } = result.meta;
    return buildLugaresRoute(geografia.cidade.slug, geografia.bairro?.slug, geografia.uf.sigla, page);
  }

  categoriaRoute(result: PaginatedLugares, categoria: LugaresCategoria): ListRoute {
    const { geografia } = result.meta;
    return buildListRouteFromFilters({
      categoria: categoria.slug,
      uf: geografia.uf.sigla,
      cidade: geografia.cidade.slug,
      bairro: geografia.bairro?.slug ?? null,
    });
  }

  ngOnInit(): void {
    const loadLugares = (): void => {
      const urlTree = this.router.parseUrl(this.router.url);
      const segments = urlTree.root.children['primary']?.segments.map((s) => s.path) ?? [];
      if (segments[0] !== 'r' || segments[1] !== 'lugares') {
        return;
      }

      const [cidadeSlug, ...rest] = segments.slice(2);
      const uf = rest.pop();
      const bairroSlug = rest[0] ?? null;
      if (!cidadeSlug || !uf || rest.length > 1) {
        return;
      }

      const page = Number(urlTree.queryParams['page']);
      const resolvedPage = Number.isInteger(page) && page >= 2 ? page : 1;

      this.loading.set(true);
      this.error.set(false);

      this.catalogService.getLugares(cidadeSlug, bairroSlug, uf, resolvedPage).subscribe({
        next: (response) => {
          if (response.meta.page >= 2 && isLugaresPageOutOfRange(response)) {
            const { cidade, bairro, uf } = response.meta.geografia;
            this.loading.set(false);
            this.routeTransition.releaseContent();
            const target = buildLugaresUrl(cidade.slug, bairro?.slug ?? null, uf.sigla, 1);
            if (!this.seo.redirectPermanently(target)) {
              void this.router.navigateByUrl(target, { replaceUrl: true });
            }
            return;
          }

          const seo = buildLugaresSeoPayload(environment.siteUrl, response);
          this.seo.apply(seo);

          this.locationState.setUf(response.meta.geografia.uf.sigla);
          this.lugares.set(response);
          this.heading.set(seo.heading);
          this.location.set(resolveLugaresNames(response).location);
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

    loadLugares();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => loadLugares());
  }

  private buildBreadcrumb(response: PaginatedLugares): { page: string; router: string | ListRoute }[] {
    const { geografia } = response.meta;
    const names = resolveLugaresNames(response);

    if (!geografia.bairro) {
      return [{ page: `${names.cidade} - ${names.uf}`, router: '' }];
    }

    return [
      {
        page: `${names.cidade} - ${names.uf}`,
        router: buildLugaresRoute(geografia.cidade.slug, null, geografia.uf.sigla),
      },
      { page: names.bairro, router: '' },
    ];
  }
}
