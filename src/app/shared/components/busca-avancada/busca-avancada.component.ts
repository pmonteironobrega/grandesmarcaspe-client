import { afterNextRender, Component, computed, effect, inject, Injector, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../../../core/services/catalog.service';
import { GeographyService } from '../../../core/services/geography.service';
import { LocationStateService } from '../../../core/services/location-state.service';
import { Categoria } from '../../../core/models/categoria.model';
import { Cidade, Bairro } from '../../../core/models/geography.model';
import { capitalizeWords } from '../../../core/utils/format-text';
import { ClienteListFilters } from '../../../core/models/paginated-response.model';
import {
  AutocompleteFieldComponent,
  AutocompleteOption,
} from '../autocomplete-field/autocomplete-field.component';

export interface PartialBuscaFilters {
  categoria: string | null;
  cidade: string | null;
  bairro: string | null;
  uf: string;
}

@Component({
  selector: 'app-busca-avancada',
  standalone: true,
  imports: [CommonModule, AutocompleteFieldComponent],
  templateUrl: './busca-avancada.component.html',
  styleUrl: './busca-avancada.component.scss',
})
export class BuscaAvancadaComponent {
  private catalogService = inject(CatalogService);
  private geographyService = inject(GeographyService);
  private locationState = inject(LocationStateService);
  private injector = inject(Injector);

  categorias = signal<Categoria[]>([]);
  cidades = signal<Cidade[]>([]);
  bairros = signal<Bairro[]>([]);
  selectedCategoriaSlug = signal<string | null>(null);
  selectedCidadeSlug = signal<string | null>(null);
  selectedBairroSlug = signal<string | null>(null);
  private batchUpdating = false;
  filtersChange = output<void>();
  readonly formatCategoriaNome = capitalizeWords;
  readonly formatNome = capitalizeWords;

  categoriaOptions = computed<AutocompleteOption[]>(() =>
    this.categorias().map((categoria) => ({
      value: categoria.slug,
      label: categoria.nome,
    })),
  );

  cidadeOptions = computed<AutocompleteOption[]>(() =>
    this.cidades().map((cidade) => ({
      value: cidade.slug,
      label: cidade.nome,
    })),
  );

  bairroOptions = computed<AutocompleteOption[]>(() =>
    this.bairros().map((bairro) => ({
      value: bairro.slug,
      label: bairro.nome,
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const uf = this.locationState.uf().toLowerCase();
      const categoria = this.selectedCategoriaSlug();

      if (!this.batchUpdating) {
        this.selectedCidadeSlug.set(null);
        this.selectedBairroSlug.set(null);
        this.bairros.set([]);
        this.cidades.set([]);
      }

      if (!categoria) {
        return;
      }

      const sub = this.geographyService
        .getCidadesByUf(uf, { comClientes: true, categoria })
        .subscribe({
          next: (data) => this.cidades.set(data),
          error: () => this.cidades.set([]),
        });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const uf = this.locationState.uf().toLowerCase();
      const categoria = this.selectedCategoriaSlug();
      const cidade = this.selectedCidadeSlug();

      if (!this.batchUpdating) {
        this.selectedBairroSlug.set(null);
        this.bairros.set([]);
      }

      if (!categoria || !cidade) {
        return;
      }

      const sub = this.geographyService
        .getBairrosByCidade(cidade, uf, { comClientes: true, categoria })
        .subscribe({
          next: (data) => this.bairros.set(data),
          error: () => this.bairros.set([]),
        });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const uf = this.locationState.uf().toLowerCase();
      const sub = this.catalogService.getCategorias(uf).subscribe({
        next: (data) => {
          this.categorias.set(data);
          const selected = this.selectedCategoriaSlug();
          if (
            selected &&
            !data.some((categoria) => categoria.slug === selected) &&
            !this.batchUpdating
          ) {
            this.selectedCategoriaSlug.set(null);
            this.filtersChange.emit();
          }
        },
        error: () => this.categorias.set([]),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  onCategoriaChange(slug: string | null): void {
    this.selectedCategoriaSlug.set(slug);
    this.filtersChange.emit();
  }

  onCidadeChange(slug: string | null): void {
    this.selectedCidadeSlug.set(slug);
    this.filtersChange.emit();
  }

  onBairroChange(slug: string | null): void {
    this.selectedBairroSlug.set(slug);
    this.filtersChange.emit();
  }

  onLimparFiltros(): void {
    this.clearFilters();
    this.filtersChange.emit();
  }

  setFiltersFromRoute(filters: Partial<PartialBuscaFilters>): void {
    this.batchUpdating = true;
    this.selectedCategoriaSlug.set(filters.categoria ?? null);
    this.selectedCidadeSlug.set(filters.cidade ?? null);
    this.selectedBairroSlug.set(filters.bairro ?? null);

    afterNextRender(
      () => {
        this.batchUpdating = false;
      },
      { injector: this.injector },
    );

    if (!filters.categoria) {
      this.cidades.set([]);
      this.bairros.set([]);
    }
  }

  clearFilters(): void {
    this.selectedCategoriaSlug.set(null);
    this.selectedCidadeSlug.set(null);
    this.selectedBairroSlug.set(null);
    this.cidades.set([]);
    this.bairros.set([]);
  }

  hasAnyFilter(): boolean {
    return (
      !!this.selectedCategoriaSlug() ||
      !!this.selectedCidadeSlug() ||
      !!this.selectedBairroSlug()
    );
  }

  getPartialFilters(): PartialBuscaFilters {
    return {
      categoria: this.selectedCategoriaSlug(),
      cidade: this.selectedCidadeSlug(),
      bairro: this.selectedBairroSlug(),
      uf: this.locationState.uf().toLowerCase(),
    };
  }

  getFilters(): ClienteListFilters | null {
    const categoria = this.selectedCategoriaSlug();
    if (!categoria) {
      return null;
    }

    return {
      categoria,
      uf: this.locationState.uf().toLowerCase(),
      cidade: this.selectedCidadeSlug(),
      bairro: this.selectedBairroSlug(),
    };
  }

  hasAdvancedFilters(): boolean {
    return !!this.selectedCategoriaSlug();
  }
}
