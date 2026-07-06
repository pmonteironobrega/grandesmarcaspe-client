import { TestBed } from '@angular/core/testing';

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { provideHttpClient } from '@angular/common/http';

import { GeographyService } from './geography.service';



describe('GeographyService', () => {

  let service: GeographyService;

  let httpMock: HttpTestingController;



  beforeEach(() => {

    TestBed.configureTestingModule({

      providers: [provideHttpClient(), provideHttpClientTesting()],

    });

    service = TestBed.inject(GeographyService);

    httpMock = TestBed.inject(HttpTestingController);

  });



  afterEach(() => {

    httpMock.verify();

  });



  it('should be created', () => {

    expect(service).toBeTruthy();

  });



  it('should request cidades with comClientes and categoria', () => {

    service.getCidadesByUf('pe', { comClientes: true, categoria: 'academias' }).subscribe();



    const req = httpMock.expectOne(

      (request) =>

        request.url === '/geography/uf/pe/cidades' &&

        request.params.get('comClientes') === 'true' &&

        request.params.get('categoria') === 'academias',

    );

    expect(req.request.method).toBe('GET');

    req.flush([]);

  });



  it('should request bairros with comClientes and categoria', () => {

    service

      .getBairrosByCidade('recife', 'pe', { comClientes: true, categoria: 'academias' })

      .subscribe();



    const req = httpMock.expectOne(

      (request) =>

        request.url === '/geography/cidades/recife/bairros' &&

        request.params.get('uf') === 'pe' &&

        request.params.get('comClientes') === 'true' &&

        request.params.get('categoria') === 'academias',

    );

    expect(req.request.method).toBe('GET');

    req.flush([]);

  });

});

