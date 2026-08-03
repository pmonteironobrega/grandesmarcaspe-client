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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { ClienteEndereco } from '../../../core/models/cliente-shared.model';
import {
  buildGeocodeSearchText,
  GeocodeQuery,
  geocodeCacheKey,
} from '../../../core/models/geocode.model';

type MapaMode = 'leaflet' | 'google' | 'idle';

@Component({
  selector: 'app-cliente-mapa',
  standalone: true,
  templateUrl: './cliente-mapa.component.html',
  styleUrl: './cliente-mapa.component.scss',
})
export class ClienteMapaComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  readonly endereco = input.required<ClienteEndereco>();

  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  readonly loading = signal(true);
  readonly mode = signal<MapaMode>('idle');
  readonly googleEmbedUrl = signal<SafeResourceUrl | null>(null);

  private readonly browserReady = signal(false);
  private map: LeafletMap | null = null;
  private marker: Marker | null = null;
  private destroyed = false;
  private lastKey = '';
  private hasMapView = false;

  constructor() {
    afterNextRender(
      () => {
        this.browserReady.set(true);
      },
      { injector: this.injector },
    );

    effect(() => {
      const end = this.endereco();
      const ready = this.browserReady();
      if (!ready || !end || !isPlatformBrowser(this.platformId)) {
        return;
      }

      const key = this.mapKey(end);
      if (key === this.lastKey && this.hasMapView) {
        return;
      }
      this.lastKey = key;
      untracked(() => this.loadMap(end));
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroyMap();
  }

  private mapKey(end: ClienteEndereco): string {
    const coords = this.readCoords(end);
    if (coords) {
      return `coords:${coords.lat},${coords.lng}`;
    }
    return geocodeCacheKey(this.toQuery(end));
  }

  private readCoords(end: ClienteEndereco): { lat: number; lng: number } | null {
    const lat = Number(end.latitude);
    const lng = Number(end.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      return null;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    return { lat, lng };
  }

  private toQuery(end: ClienteEndereco): GeocodeQuery {
    return {
      logradouro: end.logradouro,
      numero: end.numero,
      bairro: end.bairro?.nome,
      cidade: end.cidade?.nome,
      uf: end.uf?.sigla,
      cep: end.cep,
    };
  }

  private loadMap(end: ClienteEndereco): void {
    this.destroyMap();
    this.googleEmbedUrl.set(null);
    this.mode.set('idle');
    this.hasMapView = false;
    this.loading.set(true);

    const query = this.toQuery(end);
    const label = buildGeocodeSearchText(query);
    const coords = this.readCoords(end);

    // Com coordenadas da API: Leaflet imediato.
    // Sem coordenadas: Google embed direto (evita Nominatim lento + múltiplas tentativas).
    if (coords) {
      void this.initLeaflet(coords.lat, coords.lng, label);
      return;
    }

    this.showGoogleEmbed(query);
  }

  private showGoogleEmbed(query: GeocodeQuery): void {
    const search = buildGeocodeSearchText(query);
    if (!search) {
      this.loading.set(false);
      this.mode.set('idle');
      this.hasMapView = false;
      return;
    }

    const url = `https://maps.google.com/maps?q=${encodeURIComponent(search)}&z=16&hl=pt-BR&output=embed`;
    this.googleEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.mode.set('google');
    this.hasMapView = true;
    this.loading.set(false);
  }

  private async initLeaflet(lat: number, lng: number, label: string): Promise<void> {
    // Garante o container no DOM (ramo @else do template) antes de montar o mapa.
    this.mode.set('idle');
    this.googleEmbedUrl.set(null);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const container = this.mapContainer()?.nativeElement;
    if (!container || this.destroyed) {
      this.showGoogleEmbed(this.toQuery(this.endereco()));
      return;
    }

    const L = await import('leaflet');
    if (this.destroyed) {
      return;
    }

    const pinIcon = L.divIcon({
      className: 'cliente-mapa__pin',
      html: '<span class="cliente-mapa__pin-marker" aria-hidden="true"></span>',
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -38],
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

    this.marker = L.marker([lat, lng], { icon: pinIcon })
      .addTo(this.map)
      .bindPopup(this.buildPopupHtml(label), {
        className: 'cliente-mapa__popup',
        maxWidth: 280,
        autoPan: true,
      })
      .openPopup();

    requestAnimationFrame(() => {
      this.map?.invalidateSize();
      this.marker?.openPopup();
    });

    this.mode.set('leaflet');
    this.hasMapView = true;
    this.loading.set(false);
  }

  private buildPopupHtml(label: string): string {
    const text = (label || 'Localização').trim();
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<strong class="cliente-mapa__popup-title">Localização</strong><p class="cliente-mapa__popup-text">${escaped}</p>`;
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }
}
