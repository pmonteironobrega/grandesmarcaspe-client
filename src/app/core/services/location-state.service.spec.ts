import { TestBed } from '@angular/core/testing';
import { LocationStateService } from './location-state.service';

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
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(LocationStateService);
    expect(reloaded.uf()).toBe('RJ');
  });
});
