import { afterNextRender, Component, DestroyRef, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BsModalService, BsModalRef, ModalOptions } from 'ngx-bootstrap/modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { LISTA_ESTADOS } from '../../core/constants/estados';
import { LocationStateService } from '../../core/services/location-state.service';
import { GeographyService } from '../../core/services/geography.service';
import { Uf } from '../../core/models/geography.model';
import { BuscaAvancadaComponent } from '../../shared/components/busca-avancada/busca-avancada.component';
import { buildListUrlFromFilters, parseListFiltersFromLegacyPath } from '../../core/utils/catalog-url';
import { buildBuscaUrl, parseBuscaParamsFromQuery } from '../../core/utils/busca-url';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CollapseModule,
    ModalModule,
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

  @ViewChild(BuscaAvancadaComponent) buscaAvancada?: BuscaAvancadaComponent;

  isOpen = false;
  modalRef?: BsModalRef;
  buscaMessage = '';
  termoBusca = signal('');
  ufs = signal<Uf[]>([]);

  constructor() {
    afterNextRender(() => {
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
    const termo = this.termoBusca().trim();
    if (termo.length >= 2) {
      return;
    }
    const filters = this.buscaAvancada?.getFilters();
    if (filters) {
      void this.router.navigateByUrl(buildListUrlFromFilters(filters));
      this.syncAdvancedSearchPanel();
      return;
    }
    if (this.isSearchRoute()) {
      void this.router.navigateByUrl('/');
      this.isOpen = false;
      return;
    }
    this.syncAdvancedSearchPanel();
  }

  limparBusca(): void {
    this.clearSearchState();
    this.isOpen = false;
    void this.router.navigateByUrl('/');
  }

  private clearSearchState(): void {
    this.termoBusca.set('');
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

    const filters = this.buscaAvancada?.getFilters();
    if (filters) {
      this.buscaMessage = '';
      void this.router.navigateByUrl(buildListUrlFromFilters(filters));
      this.syncAdvancedSearchPanel();
      return;
    }

    this.buscaMessage =
      'Digite ao menos 2 caracteres ou selecione uma categoria para buscar.';
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
        if (params.categoria) {
          this.buscaAvancada?.setFiltersFromRoute({
            categoria: params.categoria,
            cidade: params.cidade,
            bairro: params.bairro,
          });
        } else {
          this.buscaAvancada?.setFiltersFromRoute({
            categoria: null,
            cidade: null,
            bairro: null,
          });
        }
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
      return !!params?.categoria;
    }

    return false;
  }
}
