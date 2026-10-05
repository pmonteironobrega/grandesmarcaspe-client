import { TestBed } from '@angular/core/testing';
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

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationStateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should default uf to PE without asking for geolocation', () => {
    const getCurrentPosition = jasmine.createSpy('getCurrentPosition');
    spyOnProperty(navigator, 'geolocation').and.returnValue({
      getCurrentPosition,
    } as unknown as Geolocation);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(LocationStateService);

    expect(fresh.uf()).toBe('PE');
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('should normalize setUf to uppercase', () => {
    service.setUf('sp');
    expect(service.uf()).toBe('SP');
  });

  it('should persist uf in localStorage', () => {
    service.setUf('rj');
    expect(localStorage.getItem('gmpe-uf')).toBe('RJ');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(LocationStateService);
    expect(reloaded.uf()).toBe('RJ');
  });
});
