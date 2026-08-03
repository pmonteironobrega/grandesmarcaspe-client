import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LocationStateService } from './location-state.service';
import { resolveUfSigla } from '../constants/estados';

describe('resolveUfSigla', () => {
  it('should resolve ISO code and state name', () => {
    expect(resolveUfSigla('BR-PE')).toBe('PE');
    expect(resolveUfSigla('Pernambuco')).toBe('PE');
    expect(resolveUfSigla('sao paulo')).toBe('SP');
    expect(resolveUfSigla('xx')).toBeNull();
  });
});

describe('LocationStateService', () => {
  let service: LocationStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocationStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default uf to PE', () => {
    expect(service.uf()).toBe('PE');
  });

  it('should normalize setUf to uppercase', () => {
    service.setUf('sp');
    expect(service.uf()).toBe('SP');
  });

  it('should persist uf in localStorage', () => {
    service.setUf('rj');
    expect(localStorage.getItem('gmpe-uf')).toBe('RJ');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const reloaded = TestBed.inject(LocationStateService);
    expect(reloaded.uf()).toBe('RJ');
  });

  it('should reverse geocode uf from nominatim when no stored preference', async () => {
    const geolocation = {
      getCurrentPosition: (
        success: PositionCallback,
        _error?: PositionErrorCallback,
        _options?: PositionOptions,
      ) => {
        success({
          coords: {
            latitude: -8.05,
            longitude: -34.9,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({}),
          },
          timestamp: Date.now(),
          toJSON: () => ({}),
        } as GeolocationPosition);
      },
    };
    spyOnProperty(navigator, 'geolocation').and.returnValue(geolocation as Geolocation);

    const detection = service.detectUfIfNeeded();
    await Promise.resolve();
    await Promise.resolve();

    const req = httpMock.expectOne(
      (r) => r.url === 'https://nominatim.openstreetmap.org/reverse',
    );
    expect(req.request.params.get('lat')).toBe('-8.05');
    req.flush({
      address: {
        state: 'Pernambuco',
        'ISO3166-2-lvl4': 'BR-PE',
        country_code: 'br',
      },
    });

    await detection;
    expect(service.uf()).toBe('PE');
    expect(localStorage.getItem('gmpe-uf')).toBe('PE');
  });

  it('should skip detection when uf is already stored', async () => {
    localStorage.setItem('gmpe-uf', 'SP');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const reloaded = TestBed.inject(LocationStateService);
    httpMock = TestBed.inject(HttpTestingController);

    await reloaded.detectUfIfNeeded();
    httpMock.expectNone('https://nominatim.openstreetmap.org/reverse');
    expect(reloaded.uf()).toBe('SP');
  });
});
