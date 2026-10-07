import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogService } from './catalog.service';
import { GeographyService } from './geography.service';
import { LocationStateService } from './location-state.service';
import { WebMcpService, WebMcpTool } from './webmcp.service';

describe('WebMcpService', () => {
  let service: WebMcpService;
  let catalog: jasmine.SpyObj<CatalogService>;
  let geography: jasmine.SpyObj<GeographyService>;
  let router: jasmine.SpyObj<Router>;
  const doc = document as Document & { modelContext?: { registerTool: jasmine.Spy } };

  const tool = (name: string): WebMcpTool =>
    service.buildTools().find((item) => item.name === name)!;

  beforeEach(() => {
    catalog = jasmine.createSpyObj('CatalogService', ['getCategorias']);
    geography = jasmine.createSpyObj('GeographyService', ['getCidadesByUf', 'getBairrosByCidade']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    delete doc.modelContext;

    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogService, useValue: catalog },
        { provide: GeographyService, useValue: geography },
        { provide: Router, useValue: router },
        { provide: LocationStateService, useValue: { uf: () => 'PE' } },
      ],
    });
    service = TestBed.inject(WebMcpService);
  });

  afterEach(() => {
    delete doc.modelContext;
  });

  it('register should do nothing when the browser has no modelContext', () => {
    expect(() => service.register()).not.toThrow();
  });

  it('register should register every tool once', () => {
    const registerTool = jasmine.createSpy('registerTool');
    doc.modelContext = { registerTool };

    service.register();
    service.register();

    const names = registerTool.calls.allArgs().map(([t]) => t.name);
    expect(names).toEqual([
      'listar_categorias',
      'listar_cidades',
      'listar_bairros',
      'abrir_listagem_categoria',
    ]);
  });

  it('listar_categorias should return slug and nome for the selected UF', async () => {
    catalog.getCategorias.and.returnValue(
      of([{ id: 1, nome: 'Academias', slug: 'academias', ativo: 1 }]),
    );

    const result = await tool('listar_categorias').execute({});

    expect(catalog.getCategorias).toHaveBeenCalledWith('pe');
    expect(result).toEqual({ uf: 'pe', categorias: [{ slug: 'academias', nome: 'Academias' }] });
  });

  it('listar_cidades should return a structured error when the API fails', async () => {
    geography.getCidadesByUf.and.returnValue(throwError(() => new Error('offline')));

    const result = await tool('listar_cidades').execute({ categoria: 'academias' });

    expect(result).toEqual({ error: jasmine.any(String) });
  });

  it('listar_bairros should require categoria and cidade', () => {
    expect(tool('listar_bairros').execute({ categoria: 'academias' })).toEqual({
      error: jasmine.any(String),
    });
    expect(geography.getBairrosByCidade).not.toHaveBeenCalled();
  });

  it('abrir_listagem_categoria should navigate to the legacy /c/ path', async () => {
    const result = await tool('abrir_listagem_categoria').execute({
      categoria: 'Academias',
      cidade: 'recife',
      bairro: 'boa-viagem',
    });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/c/academias/recife/boa-viagem/pe');
    expect(result).toEqual({ url: '/c/academias/recife/boa-viagem/pe' });
  });

  it('abrir_listagem_categoria should reject invalid slugs', () => {
    const result = tool('abrir_listagem_categoria').execute({ categoria: '../admin' });

    expect(result).toEqual({ error: jasmine.any(String) });
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
