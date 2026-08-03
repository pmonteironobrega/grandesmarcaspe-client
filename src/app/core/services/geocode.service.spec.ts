import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GeocodeService } from './geocode.service';

describe('GeocodeService', () => {
  let service: GeocodeService;
  let httpMock: HttpTestingController;

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
    service.geocode('  ').subscribe((value) => {
      result = value;
    });
    expect(result).toBeNull();
  });

  it('should map nominatim response and cache by address', () => {
    let first: unknown;
    let second: unknown;

    service.geocode('Rua Teste, 1, Recife, PE').subscribe((value) => {
      first = value;
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'https://nominatim.openstreetmap.org/search',
    );
    expect(req.request.params.get('countrycodes')).toBe('br');
    req.flush([
      {
        lat: '-8.05',
        lon: '-34.88',
        display_name: 'Rua Teste, Recife',
      },
    ]);

    expect(first).toEqual({
      lat: -8.05,
      lng: -34.88,
      displayName: 'Rua Teste, Recife',
    });

    service.geocode('Rua Teste, 1, Recife, PE').subscribe((value) => {
      second = value;
    });
    httpMock.expectNone('https://nominatim.openstreetmap.org/search');
    expect(second).toEqual(first);
  });

  it('should return null when nominatim finds nothing', () => {
    let result: unknown = 'unset';
    service.geocode('endereco inexistente').subscribe((value) => {
      result = value;
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'https://nominatim.openstreetmap.org/search',
    );
    req.flush([]);
    expect(result).toBeNull();
  });
});
