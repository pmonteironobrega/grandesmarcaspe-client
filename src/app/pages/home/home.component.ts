import { Component, inject, signal, effect } from '@angular/core';

import { CommonModule } from '@angular/common';

import { CatalogService } from '../../core/services/catalog.service';
import { LocationStateService } from '../../core/services/location-state.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';

import { ClienteListItem } from '../../core/models/cliente-list-item.model';

import { EmpreendimentoCardComponent } from '../../shared/components/empreendimento-card/empreendimento-card.component';

import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';

import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';



@Component({

  selector: 'app-home',

  standalone: true,

  imports: [

    CommonModule,

    EmpreendimentoCardComponent,

    CategoriasPopularesComponent,

    AnuncieBannerComponent,

  ],

  templateUrl: './home.component.html',

  styleUrl: './home.component.scss',

})

export class HomeComponent {

  private catalogService = inject(CatalogService);
  private locationState = inject(LocationStateService);
  private routeTransition = inject(RouteTransitionService);



  clientes = signal<ClienteListItem[] | null>(null);

  loading = signal(true);



  constructor() {
    effect((onCleanup) => {
      const uf = this.locationState.uf().toLowerCase();
      this.loading.set(true);

      const sub = this.catalogService.getDestaques(uf).subscribe({
        next: (data) => {
          this.clientes.set(data);
          this.loading.set(false);
          this.routeTransition.releaseContent();
        },
        error: () => {
          this.loading.set(false);
          this.routeTransition.releaseContent();
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

}


