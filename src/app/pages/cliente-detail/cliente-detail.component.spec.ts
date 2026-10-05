import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';

import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { ClienteDetailComponent } from './cliente-detail.component';
import { ClienteDetail } from '../../core/models/cliente-detail.model';
import { CatalogService } from '../../core/services/catalog.service';
import { LocationStateService } from '../../core/services/location-state.service';



describe('ClienteDetailComponent', () => {

  let component: ClienteDetailComponent;

  let fixture: ComponentFixture<ClienteDetailComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [ClienteDetailComponent],

      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],

    }).compileComponents();



    fixture = TestBed.createComponent(ClienteDetailComponent);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

describe('ClienteDetailComponent UF do header', () => {
  const endereco = {
    logradouro: 'Rua Exemplo',
    numero: '100',
    complemento: null,
    cep: null,
    latitude: null,
    longitude: null,
    uf: { id: 25, nome: 'São Paulo', sigla: 'sp' },
    cidade: { id: 1, nome: 'Cidade Exemplo', slug: 'cidade-exemplo' },
    bairro: { id: 2, nome: 'Bairro Exemplo', slug: 'bairro-exemplo' },
  };

  const detail = {
    id: 1,
    slug: 'cliente-exemplo',
    nome: 'Cliente Exemplo',
    slogan: null,
    descricao: null,
    subdescricao: null,
    email: null,
    site: null,
    dataCadastro: null,
    avaliacao: 0,
    cartaoDesconto: null,
    categoria: null,
    plano: null,
    endereco,
    enderecos: [endereco],
    telefones: [],
    imagens: [],
    tags: [],
  } as unknown as ClienteDetail;

  beforeEach(async () => {
    localStorage.removeItem('gmpe-uf');

    await TestBed.configureTestingModule({
      imports: [ClienteDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({
                clienteSlug: 'cliente-exemplo',
                cidadeSlug: 'cidade-exemplo',
                bairroSlug: 'bairro-exemplo',
                uf: 'sp',
              }),
            ),
          },
        },
        {
          provide: CatalogService,
          useValue: {
            getClienteDetail: () => of(detail),
            getClientesByLegacyPath: () => of({ data: [] }),
            getCategoriasPopulares: () => of([]),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('gmpe-uf');
  });

  it('switches the header UF to the establishment UF', () => {
    const locationState = TestBed.inject(LocationStateService);
    expect(locationState.uf()).toBe('PE');

    const fixture = TestBed.createComponent(ClienteDetailComponent);
    fixture.detectChanges();

    expect(locationState.uf()).toBe('SP');
    expect(localStorage.getItem('gmpe-uf')).toBe('SP');
  });
});


