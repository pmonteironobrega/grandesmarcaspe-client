import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const STORAGE_KEY = 'gmpe-uf';
const DEFAULT_UF = 'PE';

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
