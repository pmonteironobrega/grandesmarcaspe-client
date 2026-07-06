import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { buildClienteDefaultImagePath } from '../../../core/utils/catalog-url';

export interface GaleriaSlide {
  id: string;
  url: string;
  alt: string;
}

@Component({
  selector: 'app-cliente-galeria-carousel',
  standalone: true,
  imports: [CarouselModule],
  templateUrl: './cliente-galeria-carousel.component.html',
  styleUrl: './cliente-galeria-carousel.component.scss',
})
export class ClienteGaleriaCarouselComponent {
  private readonly injector = inject(Injector);

  readonly slides = input.required<GaleriaSlide[]>();

  readonly carouselReady = signal(false);

  readonly carouselKey = computed(() => this.slides().map((slide) => slide.id).join('|'));

  readonly carouselOptions = computed<Partial<OwlOptions>>(() => {
    const multiple = this.slides().length > 1;

    return {
      loop: multiple,
      items: 1,
      margin: 0,
      mouseDrag: multiple,
      touchDrag: multiple,
      pullDrag: false,
      dots: multiple,
      nav: multiple,
      navSpeed: 400,
      navText: ['«', '»'],
      autoplay: false,
      smartSpeed: 450,
      responsive: {
        0: { items: 1 },
      },
    };
  });

  constructor() {
    afterNextRender(
      () => {
        this.carouselReady.set(true);
      },
      { injector: this.injector },
    );
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallbackApplied'] === 'true') {
      return;
    }
    img.dataset['fallbackApplied'] = 'true';
    img.src = buildClienteDefaultImagePath();
  }
}
