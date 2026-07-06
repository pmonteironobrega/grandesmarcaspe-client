import { TestBed } from '@angular/core/testing';

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { provideHttpClient } from '@angular/common/http';

import { CatalogService } from './catalog.service';



describe('CatalogService', () => {

  let service: CatalogService;

  let httpMock: HttpTestingController;



  beforeEach(() => {

    TestBed.configureTestingModule({

      providers: [provideHttpClient(), provideHttpClientTesting()],

    });

    service = TestBed.inject(CatalogService);

    httpMock = TestBed.inject(HttpTestingController);

  });



  afterEach(() => {

    httpMock.verify();

  });



  it('should be created', () => {

    expect(service).toBeTruthy();

  });



  it('should request destaques by uf', () => {

    service.getDestaques('pe', 6).subscribe();

    const req = httpMock.expectOne('/catalog/destaques?uf=pe&limit=6');

    expect(req.request.method).toBe('GET');

    req.flush([]);

  });



  it('should request clientes by legacy path with page query', () => {
    service.getClientesByLegacyPath('c/academias/pe', 2).subscribe();

    const req = httpMock.expectOne('/c/academias/pe?page=2');

    expect(req.request.method).toBe('GET');

    req.flush({ data: [], meta: { page: 2, perPage: 15, total: 0, totalPages: 0, filters: {} } });
  });

  it('should request categorias populares by uf', () => {
    service.getCategoriasPopulares('pe', 12).subscribe();

    const req = httpMock.expectOne('/catalog/categorias-populares?uf=pe&limit=12');

    expect(req.request.method).toBe('GET');

    req.flush([]);
  });

  it('should request categorias with active clientes by uf', () => {
    service.getCategorias('pe').subscribe();

    const req = httpMock.expectOne('/categorias?comClientes=true&uf=pe');

    expect(req.request.method).toBe('GET');

    req.flush([]);
  });

  it('should request busca with query params', () => {
    service
      .buscar({
        q: 'academia',
        uf: 'pe',
        categoria: 'academias',
        cidade: 'recife',
        page: 2,
      })
      .subscribe();

    const req = httpMock.expectOne(
      '/busca?q=academia&uf=pe&categoria=academias&cidade=recife&page=2',
    );

    expect(req.request.method).toBe('GET');

    req.flush({
      data: [],
      meta: {
        page: 2,
        perPage: 15,
        total: 0,
        totalPages: 0,
        filters: {
          q: 'academia',
          uf: 'pe',
          categoria: 'academias',
          cidade: 'recife',
          bairro: null,
        },
      },
    });
  });

});


