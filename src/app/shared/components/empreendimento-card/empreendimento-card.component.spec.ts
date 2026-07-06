import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmpreendimentoCardComponent } from './empreendimento-card.component';
import { ClienteListItem } from '../../../core/models/cliente-list-item.model';

const mockCliente: ClienteListItem = {
  id: 1,
  slug: 'academia-teste',
  nome: 'Academia Teste',
  slogan: null,
  avaliacao: 0,
  categoria: { id: 1, nome: 'Academias', slug: 'academias' },
  plano: null,
  endereco: {
    id: 1,
    logradouro: 'Rua Teste',
    complemento: null,
    numero: '100',
    cep: '50000-000',
    uf: { id: 1, nome: 'Pernambuco', sigla: 'PE' },
    cidade: { id: 1, nome: 'Recife', slug: 'recife' },
    bairro: { id: 1, nome: 'Boa Viagem', slug: 'boa-viagem' },
  },
  imagemPrincipal: null,
};

describe('EmpreendimentoCardComponent', () => {
  let component: EmpreendimentoCardComponent;
  let fixture: ComponentFixture<EmpreendimentoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpreendimentoCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EmpreendimentoCardComponent);
    component = fixture.componentInstance;
    component.cliente = mockCliente;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
