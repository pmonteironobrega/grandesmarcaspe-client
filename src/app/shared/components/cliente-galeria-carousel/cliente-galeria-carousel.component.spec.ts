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

  it('should keep the first photo eager and the rest lazy', () => {
    const images = fixture.nativeElement.querySelectorAll('img') as NodeListOf<HTMLImageElement>;

    expect(images.length).toBe(2);
    expect(images[0].getAttribute('loading')).toBe('eager');
    expect(images[0].getAttribute('fetchpriority')).toBe('high');
    expect(images[0].getAttribute('src')).toBe('/clientes/1/marca.jpg');
    expect(images[1].getAttribute('loading')).toBe('lazy');
    expect(images[1].getAttribute('fetchpriority')).toBe('low');
  });
});
