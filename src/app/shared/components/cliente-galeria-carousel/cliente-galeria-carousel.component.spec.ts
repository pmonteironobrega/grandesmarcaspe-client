import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClienteGaleriaCarouselComponent } from './cliente-galeria-carousel.component';

describe('ClienteGaleriaCarouselComponent', () => {
  let fixture: ComponentFixture<ClienteGaleriaCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteGaleriaCarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteGaleriaCarouselComponent);
    fixture.componentRef.setInput('slides', [
      { id: '1', url: '/clientes/1/marca.jpg', alt: 'Teste' },
      { id: '2', url: '/clientes/1/galeria1.jpg', alt: 'Teste' },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
