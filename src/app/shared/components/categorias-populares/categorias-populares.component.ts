import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { LocationStateService } from '../../../core/services/location-state.service';
import { Categoria } from '../../../core/models/categoria.model';
import { capitalizeWords } from '../../../core/utils/format-text';

@Component({
  selector: 'app-categorias-populares',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categorias-populares.component.html',
  styleUrl: './categorias-populares.component.scss',
})
export class CategoriasPopularesComponent {
  private catalogService = inject(CatalogService);
  private locationState = inject(LocationStateService);

  categorias = signal<Categoria[]>([]);
  readonly ufSlug = computed(() => this.locationState.uf().toLowerCase());
  readonly formatCategoriaNome = capitalizeWords;

  constructor() {
    effect((onCleanup) => {
      const uf = this.ufSlug();
      const sub = this.catalogService.getCategoriasPopulares(uf).subscribe({
        next: (data) => this.categorias.set(data),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
}
