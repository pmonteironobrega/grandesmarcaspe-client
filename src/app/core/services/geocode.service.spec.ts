import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GeocodeService } from './geocode.service';
import { GeocodeQuery } from '../models/geocode.model';

describe('GeocodeService', () => {
  let service: GeocodeService;
  let httpMock: HttpTestingController;

  const query: GeocodeQuery = {
    logradouro: 'Rua Teste',
    numero: '1',
    bairro: 'Boa Viagem',
    cidade: 'Recife',
    uf: 'PE',
    cep: '51020-000',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GeocodeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return null for empty address', () => {
    let result: unknown = 'unset';
    service.geocode({ logradouro: '', cidade: '', cep: '' }).subscribe((value) => {
      result = value;
    });
    expect(result).toBeNull();
  });

  it('should use structured search and stop on first hit', () => {
    let result: unknown;

    service.geocode(query).subscribe((value) => {
      result = value;
    });

    const structured = httpMock.expectOne(
      (r) => r.url === 'https://nominatim.openstreetmap.org/search' && r.params.has('street'),
    );
    expect(structured.request.params.get('countrycodes')).toBe('br');
    expect(structured.request.params.get('street')).toBe('Rua Teste, 1');
    expect(structured.request.params.get('city')).toBe('Recife');
    structured.flush([
      {
        lat: '-8.05',
        lon: '-34.88',
        display_name: 'Rua Teste, Recife',
      },
    ]);

    expect(result).toEqual({
      lat: -8.05,
      lng: -34.88,
      displayName: 'Rua Teste, Recife',
    });

    httpMock.expectNone((r) => r.url === 'https://nominatim.openstreetmap.org/search');

    let cached: unknown;
    service.geocode(query).subscribe((value) => {
      cached = value;
    });
    expect(cached).toEqual(result);
  });

  it('should try free-text fallback when structured returns empty', () => {
    let result: unknown = 'unset';

    service.geocode(query).subscribe((value) => {
      result = value;
    });

    const structured = httpMock.expectOne(
      (r) => r.url === 'https://nominatim.openstreetmap.org/search' && r.params.has('street'),
    );
    structured.flush([]);

    const freeText = httpMock.expectOne(
      (r) => r.url === 'https://nominatim.openstreetmap.org/search' && r.params.has('q'),
    );
    expect(freeText.request.params.get('q')).toContain('Rua Teste');
    freeText.flush([
      {
        lat: '-8.1',
        lon: '-34.9',
        display_name: 'Fallback',
      },
    ]);

    expect(result).toEqual({
      lat: -8.1,
      lng: -34.9,
      displayName: 'Fallback',
    });
  });

  it('should return null when all nominatim attempts fail', () => {
    let result: unknown = 'unset';

    service.geocode(query).subscribe((value) => {
      result = value;
    });

    // Drain all sequential attempts (structured + free-text variants)
    let guard = 0;
    while (guard < 10) {
      const reqs = httpMock.match(
        (r) => r.url === 'https://nominatim.openstreetmap.org/search',
      );
      if (!reqs.length) {
        break;
      }
      reqs.forEach((req) => req.flush([]));
      guard += 1;
    }

    expect(result).toBeNull();
  });
});
