import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { BuscaResultsComponent } from './busca-results.component';
import { RouteTransitionService } from '../../core/services/route-transition.service';

const testRoutes: Routes = [
  { path: 'busca', component: BuscaResultsComponent },
];

describe('BuscaResultsComponent', () => {
  let component: BuscaResultsComponent;
  let fixture: ComponentFixture<BuscaResultsComponent>;
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
      imports: [BuscaResultsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(testRoutes),
        RouteTransitionService,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BuscaResultsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', async () => {
    await router.navigateByUrl('/busca?q=academia&uf=pe');
    fixture.detectChanges();

    httpMock.expectOne('/busca?q=academia&uf=pe').flush({
      data: [],
      meta: {
        page: 1,
        perPage: 15,
        total: 0,
        totalPages: 0,
        groupedByCategoria: false,
        filters: { q: 'academia', uf: 'pe', categoria: null, cidade: null, bairro: null },
      },
    });
    flushCategoriasPopulares();

    expect(component).toBeTruthy();
  });

  it('should load search results', async () => {
    await router.navigateByUrl('/busca?q=academia&uf=pe');
    fixture.detectChanges();

    const req = httpMock.expectOne('/busca?q=academia&uf=pe');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        {
          id: 1,
          slug: 'academia-teste',
          nome: 'Academia Teste',
          slogan: null,
          avaliacao: 4,
          categoria: { id: 1, nome: 'Academias', slug: 'academias' },
          plano: null,
          endereco: null,
          imagemPrincipal: null,
        },
      ],
      meta: {
        page: 1,
        perPage: 15,
        total: 1,
        totalPages: 1,
        groupedByCategoria: false,
        filters: {
          q: 'academia',
          uf: 'pe',
          categoria: null,
          cidade: null,
          bairro: null,
        },
      },
    });
    flushCategoriasPopulares();

    expect(component.loading()).toBeFalse();
    expect(component.listagem()?.data.length).toBe(1);
  });

  it('should render grouped results by categoria', async () => {
    await router.navigateByUrl('/busca?q=academias&uf=pe');
    fixture.detectChanges();

    httpMock.expectOne('/busca?q=academias&uf=pe').flush({
      data: [],
      groups: [
        {
          categoria: { id: 1, nome: 'Academias', slug: 'academias' },
          total: 10,
          data: [
            {
              id: 1,
              slug: 'academia-a',
              nome: 'Academia A',
              slogan: null,
              avaliacao: 4,
              categoria: { id: 1, nome: 'Academias', slug: 'academias' },
              plano: null,
              endereco: null,
              imagemPrincipal: null,
            },
          ],
        },
        {
          categoria: { id: 2, nome: 'Academias Desportivas', slug: 'academias-desportivas' },
          total: 3,
          data: [
            {
              id: 2,
              slug: 'academia-b',
              nome: 'Academia B',
              slogan: null,
              avaliacao: 5,
              categoria: { id: 2, nome: 'Academias Desportivas', slug: 'academias-desportivas' },
              plano: null,
              endereco: null,
              imagemPrincipal: null,
            },
          ],
        },
      ],
      meta: {
        page: 1,
        perPage: 6,
        total: 13,
        totalPages: 1,
        groupedByCategoria: true,
        filters: {
          q: 'academias',
          uf: 'pe',
          categoria: null,
          cidade: null,
          bairro: null,
        },
      },
    });
    flushCategoriasPopulares();
    fixture.detectChanges();

    expect(component.listagem()?.meta.groupedByCategoria).toBeTrue();
    expect(component.listagem()?.groups?.length).toBe(2);
    expect(component.buildGroupListUrl(component.listagem()!.meta.filters, 'academias')).toBe(
      '/c/academias/pe',
    );
  });

  it('should mark invalid query when q is too short', async () => {
    await router.navigateByUrl('/busca?q=a&uf=pe');
    fixture.detectChanges();

    expect(component.invalidQuery()).toBeTrue();
    expect(component.loading()).toBeFalse();
    httpMock.expectNone((request) => request.url.startsWith('/busca'));
    flushCategoriasPopulares();
  });
});
