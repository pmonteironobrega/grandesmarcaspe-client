import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { provideRouter, Router } from '@angular/router';

import { BuscaAvancadaComponent } from './busca-avancada.component';

import { LocationStateService } from '../../../core/services/location-state.service';



describe('BuscaAvancadaComponent', () => {

  let component: BuscaAvancadaComponent;

  let fixture: ComponentFixture<BuscaAvancadaComponent>;

  let httpMock: HttpTestingController;

  let router: Router;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [BuscaAvancadaComponent],

      providers: [

        provideHttpClient(),

        provideHttpClientTesting(),

        provideRouter([]),

      ],

    }).compileComponents();



    httpMock = TestBed.inject(HttpTestingController);

    router = TestBed.inject(Router);

    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));



    fixture = TestBed.createComponent(BuscaAvancadaComponent);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });



  afterEach(() => {

    httpMock.verify();

  });



  function flushInitialRequests(): void {

    httpMock.expectOne('/categorias?comClientes=true&uf=pe').flush([]);

  }



  function flushEffects(): void {

    TestBed.flushEffects();

  }



  it('should create', () => {

    flushInitialRequests();

    expect(component).toBeTruthy();

  });



  it('should load cidades when categoria is selected', () => {

    flushInitialRequests();



    component.onCategoriaChange('academias');

    flushEffects();



    const cidadesReq = httpMock.expectOne(

      (req) =>

        req.url === '/geography/uf/pe/cidades' &&

        req.params.get('comClientes') === 'true' &&

        req.params.get('categoria') === 'academias',

    );

    expect(cidadesReq.request.method).toBe('GET');

    cidadesReq.flush([

      { id: 1, nome: 'Recife', slug: 'recife' },

      { id: 2, nome: 'Olinda', slug: 'olinda' },

    ]);



    expect(component.cidades().length).toBe(2);

    expect(component.cidades()[0].slug).toBe('recife');

  });



  it('should not navigate when categoria is selected', () => {

    flushInitialRequests();



    component.onCategoriaChange('academias');

    flushEffects();



    const cidadesReq = httpMock.expectOne(

      (req) =>

        req.url === '/geography/uf/pe/cidades' &&

        req.params.get('comClientes') === 'true' &&

        req.params.get('categoria') === 'academias',

    );

    cidadesReq.flush([]);



    expect(router.navigateByUrl).not.toHaveBeenCalled();

  });



  it('should not navigate when cidade is selected', () => {

    flushInitialRequests();



    component.onCategoriaChange('academias');

    flushEffects();



    httpMock

      .expectOne(

        (req) =>

          req.url === '/geography/uf/pe/cidades' &&

          req.params.get('categoria') === 'academias',

      )

      .flush([{ id: 1, nome: 'Recife', slug: 'recife' }]);



    component.onCidadeChange('recife');

    flushEffects();



    const bairrosReq = httpMock.expectOne(

      (req) =>

        req.url === '/geography/cidades/recife/bairros' &&

        req.params.get('uf') === 'pe' &&

        req.params.get('comClientes') === 'true' &&

        req.params.get('categoria') === 'academias',

    );

    bairrosReq.flush([]);



    expect(router.navigateByUrl).not.toHaveBeenCalled();

  });



  it('hasAdvancedFilters should be false without categoria', () => {

    flushInitialRequests();



    expect(component.hasAdvancedFilters()).toBeFalse();

    expect(component.getFilters()).toBeNull();

  });



  it('hasAdvancedFilters should be true when categoria is selected', () => {

    flushInitialRequests();



    component.onCategoriaChange('academias');

    flushEffects();



    const cidadesReq = httpMock.expectOne(

      (req) =>

        req.url === '/geography/uf/pe/cidades' &&

        req.params.get('comClientes') === 'true' &&

        req.params.get('categoria') === 'academias',

    );

    cidadesReq.flush([]);



    expect(component.hasAdvancedFilters()).toBeTrue();



    const filters = component.getFilters();

    expect(filters).toEqual({

      categoria: 'academias',

      uf: TestBed.inject(LocationStateService).uf().toLowerCase(),

      cidade: null,

      bairro: null,

    });

  });



  it('getPartialFilters should expose optional filters for text search', () => {

    flushInitialRequests();



    component.onCategoriaChange('academias');

    flushEffects();



    httpMock

      .expectOne((req) => req.url === '/geography/uf/pe/cidades')

      .flush([{ id: 1, nome: 'Recife', slug: 'recife' }]);



    component.onCidadeChange('recife');

    flushEffects();



    httpMock

      .expectOne((req) => req.url === '/geography/cidades/recife/bairros')

      .flush([]);



    expect(component.getPartialFilters()).toEqual({

      categoria: 'academias',

      cidade: 'recife',

      bairro: null,

      uf: 'pe',

    });

  });



  it('should load bairros when cidade is selected', () => {

    flushInitialRequests();



    component.onCategoriaChange('academias');

    flushEffects();



    httpMock

      .expectOne(

        (req) =>

          req.url === '/geography/uf/pe/cidades' &&

          req.params.get('categoria') === 'academias',

      )

      .flush([{ id: 1, nome: 'Recife', slug: 'recife' }]);



    component.onCidadeChange('recife');

    flushEffects();



    const bairrosReq = httpMock.expectOne(

      (req) =>

        req.url === '/geography/cidades/recife/bairros' &&

        req.params.get('uf') === 'pe' &&

        req.params.get('comClientes') === 'true' &&

        req.params.get('categoria') === 'academias',

    );

    bairrosReq.flush([{ id: 1, nome: 'Boa Viagem', slug: 'boa-viagem' }]);



    expect(component.bairros().length).toBe(1);

    expect(component.bairros()[0].slug).toBe('boa-viagem');

  });

});

