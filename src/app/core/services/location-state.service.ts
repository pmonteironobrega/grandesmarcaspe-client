import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const STORAGE_KEY = 'gmpe-uf';
const DEFAULT_UF = 'PE';

/**
 * UF chosen by the user ("Você está em"). No browser geolocation prompt:
 * first visits start on PE and the choice is persisted in localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class LocationStateService {
  private platformId = inject(PLATFORM_ID);

  readonly uf = signal(this.readStoredUf());

  setUf(sigla: string): void {
    const normalized = sigla.trim().toUpperCase();
    this.uf.set(normalized);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, normalized);
    }
  }

  private readStoredUf(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return DEFAULT_UF;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored?.trim().toUpperCase() || DEFAULT_UF;
  }
}
