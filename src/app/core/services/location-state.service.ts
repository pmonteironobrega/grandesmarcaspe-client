import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { resolveUfSigla } from '../constants/estados';

const STORAGE_KEY = 'gmpe-uf';
const DEFAULT_UF = 'PE';

interface NominatimReverseResponse {
  address?: {
    state?: string;
    'ISO3166-2-lvl4'?: string;
    country_code?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LocationStateService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  readonly uf = signal(this.readStoredUf());
  readonly detecting = signal(false);

  setUf(sigla: string): void {
    const normalized = sigla.trim().toUpperCase();
    this.uf.set(normalized);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, normalized);
    }
  }

  /** Detecta UF via GPS + Nominatim apenas na primeira visita (sem UF salva). */
  async detectUfIfNeeded(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.hasStoredUf()) {
      return;
    }
    if (!navigator.geolocation) {
      this.setUf(DEFAULT_UF);
      return;
    }

    this.detecting.set(true);
    try {
      const position = await this.readCurrentPosition();
      const uf = await this.reverseGeocodeUf(position.coords.latitude, position.coords.longitude);
      this.setUf(uf ?? DEFAULT_UF);
    } catch {
      this.setUf(DEFAULT_UF);
    } finally {
      this.detecting.set(false);
    }
  }

  private readStoredUf(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return DEFAULT_UF;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored?.trim().toUpperCase() || DEFAULT_UF;
  }

  private hasStoredUf(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return Boolean(localStorage.getItem(STORAGE_KEY)?.trim());
  }

  private readCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      });
    });
  }

  private async reverseGeocodeUf(lat: number, lng: number): Promise<string | null> {
    const params = new HttpParams()
      .set('lat', String(lat))
      .set('lon', String(lng))
      .set('format', 'json')
      .set('zoom', '5')
      .set('addressdetails', '1');

    const result = await firstValueFrom(
      this.http.get<NominatimReverseResponse>('https://nominatim.openstreetmap.org/reverse', {
        params,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
        },
      }),
    );

    const address = result.address;
    if (!address) {
      return null;
    }

    const country = (address.country_code ?? '').toLowerCase();
    if (country && country !== 'br') {
      return null;
    }

    return (
      resolveUfSigla(address['ISO3166-2-lvl4']) ??
      resolveUfSigla(address.state) ??
      null
    );
  }
}
