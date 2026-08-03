import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  OnDestroy,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { Subscription } from 'rxjs';
import { GeocodeService } from '../../../core/services/geocode.service';

@Component({
  selector: 'app-cliente-mapa',
  standalone: true,
  templateUrl: './cliente-mapa.component.html',
  styleUrl: './cliente-mapa.component.scss',
})
export class ClienteMapaComponent implements OnDestroy {
  private readonly geocode = inject(GeocodeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  readonly endereco = input.required<string>();

  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  readonly loading = signal(true);
  readonly error = signal(false);

  private readonly browserReady = signal(false);
  private map: LeafletMap | null = null;
  private marker: Marker | null = null;
  private destroyed = false;
  private lastAddress = '';
  private geocodeSub: Subscription | null = null;

  constructor() {
    afterNextRender(
      () => {
        this.browserReady.set(true);
      },
      { injector: this.injector },
    );

    effect(() => {
      const address = this.endereco().trim();
      const ready = this.browserReady();
      if (!ready || !address || !isPlatformBrowser(this.platformId)) {
        return;
      }
      if (address === this.lastAddress && this.map) {
        return;
      }
      this.lastAddress = address;
      untracked(() => this.loadMap(address));
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.geocodeSub?.unsubscribe();
    this.geocodeSub = null;
    this.destroyMap();
  }

  private loadMap(address: string): void {
    this.geocodeSub?.unsubscribe();
    this.destroyMap();
    this.loading.set(true);
    this.error.set(false);

    this.geocodeSub = this.geocode.geocode(address).subscribe({
      next: (result) => {
        if (this.destroyed) {
          return;
        }
        if (!result) {
          this.loading.set(false);
          this.error.set(true);
          return;
        }
        void this.initLeaflet(result.lat, result.lng);
      },
      error: () => {
        if (this.destroyed) {
          return;
        }
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private async initLeaflet(lat: number, lng: number): Promise<void> {
    const container = this.mapContainer()?.nativeElement;
    if (!container || this.destroyed) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    const L = await import('leaflet');
    if (this.destroyed) {
      return;
    }

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });

    this.destroyMap();

    this.map = L.map(container, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.marker = L.marker([lat, lng]).addTo(this.map);

    requestAnimationFrame(() => {
      this.map?.invalidateSize();
    });

    this.loading.set(false);
    this.error.set(false);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }
}
