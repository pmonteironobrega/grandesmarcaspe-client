import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, concatMap, first, map, shareReplay } from 'rxjs/operators';
import {
  buildGeocodeSearchText,
  GeocodeQuery,
  GeocodeResult,
  geocodeCacheKey,
  normalizeCep,
} from '../models/geocode.model';

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

type NominatimAttempt =
  | { kind: 'structured'; params: HttpParams }
  | { kind: 'free'; q: string };

@Injectable({
  providedIn: 'root',
})
export class GeocodeService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<GeocodeResult | null>>();

  geocode(query: GeocodeQuery): Observable<GeocodeResult | null> {
    if (!query.logradouro?.trim() && !query.cidade?.trim() && !query.cep?.trim()) {
      return of(null);
    }

    const key = geocodeCacheKey(query);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = from(this.buildAttempts(query)).pipe(
      concatMap((attempt) => this.searchNominatim(attempt)),
      first((result): result is GeocodeResult => result !== null, null),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.cache.set(key, request$);
    return request$;
  }

  private buildAttempts(query: GeocodeQuery): NominatimAttempt[] {
    const logradouro = query.logradouro?.trim() ?? '';
    const numero = query.numero?.trim() ?? '';
    const cidade = query.cidade?.trim() ?? '';
    const uf = query.uf?.trim()?.toUpperCase() ?? '';
    const cep = normalizeCep(query.cep);
    const attempts: NominatimAttempt[] = [];

    if (logradouro || cidade || cep) {
      let structured = new HttpParams()
        .set('format', 'json')
        .set('limit', '1')
        .set('countrycodes', 'br')
        .set('addressdetails', '1')
        .set('country', 'Brasil');

      if (logradouro) {
        structured = structured.set('street', numero ? `${logradouro}, ${numero}` : logradouro);
      }
      if (cidade) {
        structured = structured.set('city', cidade);
      }
      if (uf) {
        structured = structured.set('state', uf);
      }
      if (cep) {
        structured = structured.set('postalcode', cep);
      }
      attempts.push({ kind: 'structured', params: structured });
    }

    const fullText = buildGeocodeSearchText(query, { includeNumero: true });
    if (fullText) {
      attempts.push({ kind: 'free', q: fullText });
    }

    if (numero) {
      const withoutNumber = buildGeocodeSearchText(query, { includeNumero: false });
      if (withoutNumber) {
        attempts.push({ kind: 'free', q: withoutNumber });
      }
    }

    const compact = [logradouro, numero, cidade, uf, 'Brasil'].filter(Boolean).join(', ');
    if (compact) {
      attempts.push({ kind: 'free', q: compact });
    }

    if (cep && cidade) {
      attempts.push({
        kind: 'free',
        q: [cep, cidade, uf, 'Brasil'].filter(Boolean).join(', '),
      });
    }

    const seen = new Set<string>();
    return attempts.filter((attempt) => {
      const fingerprint =
        attempt.kind === 'free'
          ? `free:${attempt.q.toLowerCase()}`
          : `structured:${attempt.params.toString()}`;
      if (seen.has(fingerprint)) {
        return false;
      }
      seen.add(fingerprint);
      return true;
    });
  }

  private searchNominatim(attempt: NominatimAttempt): Observable<GeocodeResult | null> {
    const params =
      attempt.kind === 'structured'
        ? attempt.params
        : new HttpParams()
            .set('q', attempt.q)
            .set('format', 'json')
            .set('limit', '1')
            .set('countrycodes', 'br');

    return this.http
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
      );
  }
}
