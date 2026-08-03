import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { GeocodeResult } from '../models/geocode.model';

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeocodeService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<GeocodeResult | null>>();

  geocode(address: string): Observable<GeocodeResult | null> {
    const key = address.trim().toLowerCase();
    if (!key) {
      return of(null);
    }

    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const params = new HttpParams()
      .set('q', address)
      .set('format', 'json')
      .set('limit', '1')
      .set('countrycodes', 'br');

    const request$ = this.http
      .get<NominatimItem[]>('https://nominatim.openstreetmap.org/search', {
        params,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
        },
      })
      .pipe(
        map((results) => {
          const first = results[0];
          if (!first) {
            return null;
          }
          return {
            lat: Number(first.lat),
            lng: Number(first.lon),
            displayName: first.display_name,
          } satisfies GeocodeResult;
        }),
        catchError(() => of(null)),
        shareReplay(1),
      );

    this.cache.set(key, request$);
    return request$;
  }
}
