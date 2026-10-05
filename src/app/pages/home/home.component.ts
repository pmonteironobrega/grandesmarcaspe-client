import { Component, inject, signal, effect } from '@angular/core';

import { CommonModule } from '@angular/common';

import { CatalogService } from '../../core/services/catalog.service';
import { LocationStateService } from '../../core/services/location-state.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { SeoService } from '../../core/services/seo.service';
import { buildHomeSeo } from '../../core/utils/home-seo';
import { environment } from '../../../environments/environment';

import { ClienteListItem } from '../../core/models/cliente-list-item.model';

import { EmpreendimentoCardComponent } from '../../shared/components/empreendimento-card/empreendimento-card.component';

import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';

import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';



@Component({

  selector: 'app-home',

  standalone: true,

  imports: [

    CommonModule,

    EmpreendimentoCardComponent,

    CategoriasPopularesComponent,

    AnuncieBannerComponent,

    AdSlotComponent,

  ],

  templateUrl: './home.component.html',

  styleUrl: './home.component.scss',

})

export class HomeComponent {

  private catalogService = inject(CatalogService);
  private locationState = inject(LocationStateService);
  private routeTransition = inject(RouteTransitionService);

  readonly adSlots = ADSENSE_SLOTS;


  clientes = signal<ClienteListItem[] | null>(null);

  loading = signal(true);



  constructor() {
    inject(SeoService).apply(buildHomeSeo(environment.siteUrl));

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


