import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { LugaresListComponent } from './lugares-list.component';
import { PaginatedLugares } from '../../core/models/paginated-response.model';
import { LocationStateService } from '../../core/services/location-state.service';

const buildResponse = (bairro: boolean, page = 1): PaginatedLugares => ({
  data: [],
  categorias: [{ slug: 'academias', nome: 'Academias', total: 3 }],
  meta: {
    page,
    perPage: 15,
    total: 3,
    totalPages: 1,
    geografia: {
      uf: { sigla: 'pe', nome: 'Pernambuco' },
      cidade: { slug: 'cidade-exemplo', nome: 'Cidade Exemplo' },
      bairro: bairro ? { slug: 'bairro-exemplo', nome: 'Bairro Exemplo' } : null,
    },
  },
});

describe('LugaresListComponent', () => {
  let component: LugaresListComponent;
  let fixture: ComponentFixture<LugaresListComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  const flushCategoriasPopulares = (): void => {
    httpMock
      .match((request) => request.url.startsWith('/catalog/categorias-populares'))
      .filter((req) => !req.cancelled)
      .forEach((req) => req.flush([]));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LugaresListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'r/lugares/:cidadeSlug/:bairroSlug/:uf', component: LugaresListComponent },
          { path: 'r/lugares/:cidadeSlug/:uf', component: LugaresListComponent },
        ]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LugaresListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the bairro listing with the legacy path', async () => {
    await router.navigateByUrl('/r/lugares/cidade-exemplo/bairro-exemplo/pe');
    fixture.detectChanges();

    httpMock.expectOne('/r/lugares/cidade-exemplo/bairro-exemplo/pe').flush(buildResponse(true));
    fixture.detectChanges();
    flushCategoriasPopulares();

    expect(component.heading()).toBe('Estabelecimentos em Bairro Exemplo, Cidade Exemplo - PE');
    const categoriaLink = component.categoriaRoute(component.lugares()!, { slug: 'academias', nome: 'Academias', total: 3 });
    expect(categoriaLink.commands).toEqual(['/c', 'academias', 'cidade-exemplo', 'bairro-exemplo', 'pe']);
  });

  it('loads the cidade listing with page query param', async () => {
    await router.navigateByUrl('/r/lugares/cidade-exemplo/pe?page=2');
    fixture.detectChanges();

    const response = buildResponse(false, 2);
    response.meta.geografia.uf = { sigla: 'sp', nome: 'São Paulo' };
    localStorage.removeItem('gmpe-uf');
    httpMock.expectOne('/r/lugares/cidade-exemplo/pe?page=2').flush(response);
    fixture.detectChanges();
    flushCategoriasPopulares();

    expect(component.heading()).toBe('Estabelecimentos em Cidade Exemplo - SP');
    expect(TestBed.inject(LocationStateService).uf()).toBe('SP');
    localStorage.removeItem('gmpe-uf');
    expect(component.pageRoute(component.lugares()!, 3)).toEqual({
      commands: ['/r', 'lugares', 'cidade-exemplo', 'sp'],
      queryParams: { page: '3' },
    });
  });
});
