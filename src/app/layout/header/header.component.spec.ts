import { ComponentFixture, TestBed } from '@angular/core/testing';

import { importProvidersFrom } from '@angular/core';

import { provideRouter, Router } from '@angular/router';

import { provideAnimations } from '@angular/platform-browser/animations';

import { provideHttpClient } from '@angular/common/http';

import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { CollapseModule } from 'ngx-bootstrap/collapse';

import { HeaderComponent } from './header.component';

import { BuscaAvancadaComponent } from '../../shared/components/busca-avancada/busca-avancada.component';

import { AuthService } from '../../core/services/auth.service';

import { signal } from '@angular/core';



describe('HeaderComponent', () => {

  let component: HeaderComponent;

  let fixture: ComponentFixture<HeaderComponent>;

  let router: Router;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [HeaderComponent],

      providers: [

        provideRouter([]),

        provideAnimations(),

        provideHttpClient(),

        provideHttpClientTesting(),

        importProvidersFrom(ModalModule.forRoot(), CollapseModule.forRoot(), BsDropdownModule.forRoot()),

        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(false).asReadonly(),
            currentUser: signal(null).asReadonly(),
            logout: jasmine.createSpy('logout'),
          },
        },

      ],

    }).compileComponents();



    router = TestBed.inject(Router);

    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));



    fixture = TestBed.createComponent(HeaderComponent);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });



  it('canSearch should be false without text or categoria', () => {

    expect(component.canSearch()).toBeFalse();

  });



  it('canSearch should be true with text >= 2 chars', () => {

    component.termoBusca.set('academia');

    expect(component.canSearch()).toBeTrue();

  });



  it('buscar should navigate to /busca when text is provided', () => {

    component.termoBusca.set('academia');

    component.buscar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/busca?q=academia&uf=pe');

  });



  it('buscar should set validation message when no criteria', () => {

    component.buscar();

    expect(component.buscaMessage).toContain('Digite ao menos 2 caracteres');

  });



  it('buscar should ignore and reset advanced filters when text is provided', () => {
    const clearFilters = jasmine.createSpy('clearFilters');
    component.buscaAvancada = {
      clearFilters,
      getFilters: () => ({ categoria: 'academias', uf: 'pe', cidade: 'recife', bairro: null }),
      hasAnyFilter: () => true,
      hasAdvancedFilters: () => true,
    } as unknown as BuscaAvancadaComponent;
    component.isOpen = true;
    component.termoBusca.set('padaria');

    component.buscar();

    expect(clearFilters).toHaveBeenCalled();
    expect(component.isOpen).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/busca?q=padaria&uf=pe');
  });

  it('buscar should open the category listing when only filters are set', () => {
    component.buscaAvancada = {
      getFilters: () => ({ categoria: 'academias', uf: 'pe', cidade: null, bairro: null }),
      hasAnyFilter: () => true,
      hasAdvancedFilters: () => true,
    } as unknown as BuscaAvancadaComponent;

    component.buscar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/c/academias/pe');
  });

  it('onBuscaFiltersChange should open the legacy listing and clear typed text', () => {
    component.termoBusca.set('padaria');
    component.buscaAvancada = {
      getFilters: () => ({ categoria: 'academias', uf: 'pe', cidade: 'recife', bairro: 'boa-viagem' }),
      hasAnyFilter: () => true,
    } as unknown as BuscaAvancadaComponent;

    component.onBuscaFiltersChange();

    expect(component.termoBusca()).toBe('');
    expect(component.isOpen).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/c/academias/recife/boa-viagem/pe');
  });

  it('onBuscaFiltersChange should not navigate when filters are cleared outside a listing', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/busca?q=padaria&uf=pe');
    component.buscaAvancada = {
      getFilters: () => null,
      hasAnyFilter: () => false,
    } as unknown as BuscaAvancadaComponent;

    component.onBuscaFiltersChange();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('syncSearchFromRoute should keep only the text on /busca', () => {
    const clearFilters = jasmine.createSpy('clearFilters');
    const setFiltersFromRoute = jasmine.createSpy('setFiltersFromRoute');
    component.buscaAvancada = { clearFilters, setFiltersFromRoute } as unknown as BuscaAvancadaComponent;
    spyOnProperty(router, 'url', 'get').and.returnValue('/busca?q=padaria&uf=pe&categoria=padarias');

    (component as unknown as { syncSearchFromRoute: () => void }).syncSearchFromRoute();

    expect(component.termoBusca()).toBe('padaria');
    expect(clearFilters).toHaveBeenCalled();
    expect(setFiltersFromRoute).not.toHaveBeenCalled();
  });

  it('syncSearchFromRoute should fill filters and clear text on /c/ listing', () => {
    component.termoBusca.set('padaria');
    const setFiltersFromRoute = jasmine.createSpy('setFiltersFromRoute');
    component.buscaAvancada = { setFiltersFromRoute } as unknown as BuscaAvancadaComponent;
    spyOnProperty(router, 'url', 'get').and.returnValue('/c/academias/recife/pe');

    (component as unknown as { syncSearchFromRoute: () => void }).syncSearchFromRoute();

    expect(component.termoBusca()).toBe('');
    expect(setFiltersFromRoute).toHaveBeenCalledWith({
      categoria: 'academias',
      cidade: 'recife',
      bairro: null,
    });
  });

  it('limparBusca should reset criteria and navigate home', () => {
    component.termoBusca.set('academia');
    const buscaAvancada = {
      clearFilters: jasmine.createSpy('clearFilters'),
      hasAnyFilter: () => true,
    } as unknown as BuscaAvancadaComponent;
    component.buscaAvancada = buscaAvancada;

    component.limparBusca();

    expect(component.termoBusca()).toBe('');
    expect(buscaAvancada.clearFilters).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('onBuscaFiltersChange should navigate home when filters are cleared on search route', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/c/academias/pe');
    const buscaAvancada = {
      getFilters: () => null,
      hasAnyFilter: () => false,
    } as BuscaAvancadaComponent;
    component.buscaAvancada = buscaAvancada;

    component.onBuscaFiltersChange();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('syncSearchFromRoute should clear search state on home', () => {
    component.termoBusca.set('academia');
    const clearFilters = jasmine.createSpy('clearFilters');
    component.buscaAvancada = { clearFilters } as unknown as BuscaAvancadaComponent;
    spyOnProperty(router, 'url', 'get').and.returnValue('/');

    (component as unknown as { syncSearchFromRoute: () => void }).syncSearchFromRoute();

    expect(component.termoBusca()).toBe('');
    expect(clearFilters).toHaveBeenCalled();
  });

});

