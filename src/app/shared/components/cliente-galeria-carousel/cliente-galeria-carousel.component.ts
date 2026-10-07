import { Component, ElementRef, signal, viewChild, input } from '@angular/core';
import { buildClienteDefaultImagePath } from '../../../core/utils/catalog-url';

export interface GaleriaSlide {
  id: string;
  url: string;
  alt: string;
}

@Component({
  selector: 'app-cliente-galeria-carousel',
  standalone: true,
  templateUrl: './cliente-galeria-carousel.component.html',
  styleUrl: './cliente-galeria-carousel.component.scss',
})
export class ClienteGaleriaCarouselComponent {
  readonly slides = input.required<GaleriaSlide[]>();

  readonly activeIndex = signal(0);

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  scrollBy(direction: -1 | 1): void {
    const count = this.slides().length;
    if (count < 2) {
      return;
    }
    const next = (this.activeIndex() + direction + count) % count;
    this.scrollTo(next);
  }

  scrollTo(index: number): void {
    const track = this.track()?.nativeElement;
    if (!track) {
      return;
    }
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    this.activeIndex.set(index);
  }

  onTrackScroll(): void {
    const track = this.track()?.nativeElement;
    if (!track) {
      return;
    }
    const width = track.clientWidth || 1;
    const index = Math.round(track.scrollLeft / width);
    const last = Math.max(0, this.slides().length - 1);
    this.activeIndex.set(Math.min(last, Math.max(0, index)));
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
