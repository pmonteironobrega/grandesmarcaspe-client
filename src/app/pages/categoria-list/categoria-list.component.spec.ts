import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { provideRouter, Router } from '@angular/router';

import { CategoriaListComponent } from './categoria-list.component';

describe('CategoriaListComponent', () => {
  let component: CategoriaListComponent;

  let fixture: ComponentFixture<CategoriaListComponent>;

  let httpMock: HttpTestingController;

  let router: Router;

  const flushCategoriasPopulares = (): void => {
    const req = httpMock.expectOne((request) =>
      request.url.startsWith('/catalog/categorias-populares'),
    );
    req.flush([]);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaListComponent],

      providers: [
        provideHttpClient(),

        provideHttpClientTesting(),

        provideRouter([
          { path: 'c/:categoriaSlug/:a', component: CategoriaListComponent },
          { path: 'c/:categoriaSlug/:a/:b', component: CategoriaListComponent },
        ]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(CategoriaListComponent);

    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load listagem for categoria + uf + page query param', async () => {
    await router.navigateByUrl('/c/academias/pe?page=2');
    fixture.detectChanges();

    const req = httpMock.expectOne('/c/academias/pe?page=2');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [],
      meta: {
        page: 2,
        perPage: 15,
        total: 0,
        totalPages: 0,
        filters: { categoria: 'academias', uf: 'pe', cidade: null, bairro: null },
      },
    });
    flushCategoriasPopulares();

    expect(component.listagem()?.meta.page).toBe(2);
  });

  it('should load listagem for categoria + cidade + uf', async () => {
    await router.navigateByUrl('/c/academias/recife/pe');
    fixture.detectChanges();

    const req = httpMock.expectOne('/c/academias/recife/pe');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [],
      meta: {
        page: 1,
        perPage: 15,
        total: 0,
        totalPages: 0,
        filters: { categoria: 'academias', uf: 'pe', cidade: 'recife', bairro: null },
      },
    });
    flushCategoriasPopulares();

    expect(component.listagem()?.meta.filters.cidade).toBe('recife');
  });

  it('buildListRoute should keep page in queryParams, not path commands', () => {
    const route = component.buildListRoute(
      { categoria: 'academias', uf: 'pe', cidade: null, bairro: null },
      2,
    );

    expect(route.commands).toEqual(['/c', 'academias', 'pe']);
    expect(route.queryParams).toEqual({ page: '2' });
  });
});
