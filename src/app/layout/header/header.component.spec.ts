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



  it('buscar should navigate to /busca when only categoria is set', () => {

    const buscaAvancada = {

      hasAdvancedFilters: () => true,

      getPartialFilters: () => ({

        categoria: 'academias',

        cidade: null,

        bairro: null,

        uf: 'pe',

      }),

      getFilters: () => ({

        categoria: 'academias',

        uf: 'pe',

        cidade: null,

        bairro: null,

      }),

      getFilterLabels: () => ({ categoria: 'Academias' }),

      hasAnyFilter: () => true,

    } as BuscaAvancadaComponent;

    component.buscaAvancada = buscaAvancada;

    component.buscar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/busca?q=Academias&uf=pe&categoria=academias');

  });

  it('onBuscaFiltersChange should navigate to /busca when categoria is selected', () => {
    const buscaAvancada = {
      getFilters: () => ({
        categoria: 'academias',
        uf: 'pe',
        cidade: null,
        bairro: null,
      }),
      getFilterLabels: () => ({ categoria: 'Academias' }),
      hasAnyFilter: () => true,
    } as BuscaAvancadaComponent;

    component.buscaAvancada = buscaAvancada;

    component.onBuscaFiltersChange();

    expect(component.termoBusca()).toBe('Academias');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/busca?q=Academias&uf=pe&categoria=academias');
    expect(component.isOpen).toBeTrue();
  });

  it('onBuscaFiltersChange should switch categoria after a geo search query', () => {
    component.termoBusca.set('Academias');
    (component as unknown as { lastGeoSearchQuery: { set: (value: string) => void } }).lastGeoSearchQuery.set(
      'Academias',
    );

    const buscaAvancada = {
      getFilters: () => ({
        categoria: 'oticas',
        uf: 'pe',
        cidade: null,
        bairro: null,
      }),
      getFilterLabels: () => ({ categoria: 'Óticas' }),
      hasAnyFilter: () => true,
    } as BuscaAvancadaComponent;

    component.buscaAvancada = buscaAvancada;

    component.onBuscaFiltersChange();

    expect(component.termoBusca()).toBe('Óticas');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/busca?q=%C3%93ticas&uf=pe&categoria=oticas');
  });

  it('onBuscaFiltersChange should not navigate when text search is active', () => {
    component.termoBusca.set('academia');

    const buscaAvancada = {
      getFilters: () => ({
        categoria: 'academias',
        uf: 'pe',
        cidade: null,
        bairro: null,
      }),
      getFilterLabels: () => ({ categoria: 'Academias' }),
    } as BuscaAvancadaComponent;

    component.buscaAvancada = buscaAvancada;

    component.onBuscaFiltersChange();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
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

