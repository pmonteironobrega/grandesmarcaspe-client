import { afterNextRender, Component, computed, DestroyRef, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BsModalService, BsModalRef, ModalOptions } from 'ngx-bootstrap/modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { LISTA_ESTADOS } from '../../core/constants/estados';
import { LocationStateService } from '../../core/services/location-state.service';
import { GeographyService } from '../../core/services/geography.service';
import { AuthService } from '../../core/services/auth.service';
import { Uf } from '../../core/models/geography.model';
import { BuscaAvancadaComponent } from '../../shared/components/busca-avancada/busca-avancada.component';
import { parseListFiltersFromLegacyPath } from '../../core/utils/catalog-url';
import {
  buildBuscaUrl,
  buildBuscaQueryFromGeoFilters,
  buildBuscaUrlFromGeoFilters,
  parseBuscaParamsFromQuery,
} from '../../core/utils/busca-url';
import { resolveUserPhotoUrl } from '../../core/utils/user-photo';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CollapseModule,
    ModalModule,
    BsDropdownModule,
    BuscaAvancadaComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private modalService = inject(BsModalService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private geographyService = inject(GeographyService);
  readonly locationState = inject(LocationStateService);
  readonly auth = inject(AuthService);
  readonly profilePhotoUrl = computed(() =>
    resolveUserPhotoUrl(this.auth.currentUser()?.fotoCaminho ?? null),
  );

  @ViewChild(BuscaAvancadaComponent) buscaAvancada?: BuscaAvancadaComponent;

  isOpen = false;
  modalRef?: BsModalRef;
  buscaMessage = '';
  termoBusca = signal('');
  private lastGeoSearchQuery = signal('');
  ufs = signal<Uf[]>([]);

  constructor() {
    afterNextRender(() => {
      void this.locationState.detectUfIfNeeded();

      this.geographyService.getUfs().subscribe({
        next: (data) => this.ufs.set(data),
        error: () => {
          this.ufs.set(
            LISTA_ESTADOS.map((estado, index) => ({
              id: index + 1,
              nome: estado.Nome,
              sigla: estado.Sigla,
            })),
          );
        },
      });

      this.syncSearchFromRoute();
      this.syncAdvancedSearchPanel();
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.syncSearchFromRoute();
        this.syncAdvancedSearchPanel();
      });
  }

  openModal(template: TemplateRef<unknown>): void {
    const modalConfig: ModalOptions = {
      class: 'modal-sm modal-estados',
    };
    this.modalRef = this.modalService.show(template, modalConfig);
  }

  toggleMenu(): void {
    if (this.isOpen && (this.buscaAvancada?.hasAnyFilter() ?? false)) {
      return;
    }
    this.isOpen = !this.isOpen;
  }

  canSearch(): boolean {
    return (
      this.termoBusca().trim().length >= 2 ||
      (this.buscaAvancada?.hasAdvancedFilters() ?? false)
    );
  }

  canClearSearch(): boolean {
    return (
      this.termoBusca().trim().length > 0 ||
      (this.buscaAvancada?.hasAnyFilter() ?? false) ||
      this.isSearchRoute()
    );
  }

  onBuscaFiltersChange(): void {
    this.buscaMessage = '';
    const filters = this.buscaAvancada?.getFilters();
    const termo = this.termoBusca().trim();
    const lastGeo = this.lastGeoSearchQuery().trim();

    if (filters) {
      const labels = this.buscaAvancada?.getFilterLabels();
      const geoQuery = buildBuscaQueryFromGeoFilters(filters, labels).trim();
      const geoDriven = termo.length < 2 || termo === lastGeo || termo === geoQuery;
      if (termo.length >= 2 && !geoDriven) {
        return;
      }
      this.termoBusca.set(geoQuery);
      this.lastGeoSearchQuery.set(geoQuery);
      void this.router.navigateByUrl(buildBuscaUrlFromGeoFilters(filters, labels));
      this.syncAdvancedSearchPanel();
      return;
    }

    if (!(this.buscaAvancada?.hasAnyFilter() ?? false)) {
      if (!termo || termo === lastGeo) {
        this.termoBusca.set('');
      }
      this.lastGeoSearchQuery.set('');
    }

    if (this.termoBusca().trim().length >= 2) {
      return;
    }

    this.navigateFromGeoFilters();
  }

  limparBusca(): void {
    this.clearSearchState();
    this.isOpen = false;
    void this.router.navigateByUrl('/');
  }

  private clearSearchState(): void {
    this.termoBusca.set('');
    this.lastGeoSearchQuery.set('');
    this.buscaMessage = '';
    this.buscaAvancada?.clearFilters();
  }

  private isSearchRoute(): boolean {
    const path = this.router.url.split('?')[0];
    return path === '/busca' || path.startsWith('/c/');
  }

  buscar(): void {
    const termo = this.termoBusca().trim();
    const partial = this.buscaAvancada?.getPartialFilters();
    const uf = this.locationState.uf().toLowerCase();

    if (termo.length >= 2) {
      this.buscaMessage = '';
      void this.router.navigateByUrl(
        buildBuscaUrl({
          q: termo,
          uf,
          categoria: partial?.categoria ?? null,
          cidade: partial?.cidade ?? null,
          bairro: partial?.bairro ?? null,
        }),
      );
      this.syncAdvancedSearchPanel();
      return;
    }

    if (this.buscaAvancada?.getFilters()) {
      this.buscaMessage = '';
      const filters = this.buscaAvancada.getFilters()!;
      const labels = this.buscaAvancada.getFilterLabels();
      const geoQuery = buildBuscaQueryFromGeoFilters(filters, labels);
      this.termoBusca.set(geoQuery);
      this.lastGeoSearchQuery.set(geoQuery);
      void this.router.navigateByUrl(buildBuscaUrlFromGeoFilters(filters, labels));
      this.syncAdvancedSearchPanel();
      return;
    }

    this.buscaMessage =
      'Digite ao menos 2 caracteres ou selecione uma categoria para buscar.';
  }

  private navigateFromGeoFilters(): void {
    const filters = this.buscaAvancada?.getFilters();
    if (!filters) {
      if (this.isSearchRoute()) {
        void this.router.navigateByUrl('/');
        this.isOpen = false;
      } else {
        this.syncAdvancedSearchPanel();
      }
      return;
    }

    void this.router.navigateByUrl(
      buildBuscaUrlFromGeoFilters(filters, this.buscaAvancada?.getFilterLabels()),
    );
    this.syncAdvancedSearchPanel();
  }

  private syncSearchFromRoute(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const path = urlTree.root.children['primary']?.segments.map((s) => s.path).join('/') ?? '';

    if (!path) {
      this.clearSearchState();
      return;
    }

    if (path.startsWith('c/')) {
      const filters = parseListFiltersFromLegacyPath(path);
      if (filters) {
        this.buscaAvancada?.setFiltersFromRoute({
          categoria: filters.categoria,
          cidade: filters.cidade,
          bairro: filters.bairro,
        });
      }
      return;
    }

    if (path === 'busca') {
      const params = parseBuscaParamsFromQuery(urlTree.queryParams);
      if (params) {
        this.termoBusca.set(params.q);
        this.lastGeoSearchQuery.set(params.q);
        this.buscaAvancada?.setFiltersFromRoute({
          categoria: params.categoria ?? null,
          cidade: params.cidade ?? null,
          bairro: params.bairro ?? null,
        });
      }
    }
  }

  private syncAdvancedSearchPanel(): void {
    const hasGeoFilters =
      (this.buscaAvancada?.hasAnyFilter() ?? false) || this.hasActiveGeoFiltersFromRoute();
    this.isOpen = hasGeoFilters;
  }

  private hasActiveGeoFiltersFromRoute(): boolean {
    const urlTree = this.router.parseUrl(this.router.url);
    const path = urlTree.root.children['primary']?.segments.map((s) => s.path).join('/') ?? '';

    if (path.startsWith('c/')) {
      return parseListFiltersFromLegacyPath(path) !== null;
    }

    if (path === 'busca') {
      const params = parseBuscaParamsFromQuery(urlTree.queryParams);
      return !!(params?.categoria || params?.cidade || params?.bairro);
    }

    return false;
  }
}
