import { afterNextRender, Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import {
  buildClienteDefaultImagePath,
  CLIENTE_GALLERY_WIDTH,
  withClienteImageWidth,
} from '../../../core/utils/catalog-url';

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
  private readonly destroyRef = inject(DestroyRef);
  /** Slide width from ResizeObserver, so scroll does not read layout after painting the dots. */
  private slideWidth = 0;
  private scrollFrame = 0;

  constructor() {
    afterNextRender(() => {
      const track = this.track()?.nativeElement;
      if (!track || typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0;
        if (width > 0) {
          this.slideWidth = width;
        }
      });
      observer.observe(track);
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        if (this.scrollFrame) {
          cancelAnimationFrame(this.scrollFrame);
        }
      });
    });
  }

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
    const width = this.slideWidth || track.clientWidth;
    track.scrollTo({ left: index * width, behavior: 'smooth' });
    this.activeIndex.set(index);
  }

  onTrackScroll(): void {
    if (this.scrollFrame) {
      return;
    }
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      const track = this.track()?.nativeElement;
      if (!track) {
        return;
      }
      const width = this.slideWidth || track.clientWidth || 1;
      const last = Math.max(0, this.slides().length - 1);
      const index = Math.min(last, Math.max(0, Math.round(track.scrollLeft / width)));
      if (index !== this.activeIndex()) {
        this.activeIndex.set(index);
      }
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallbackApplied'] === 'true') {
      return;
    }
    img.dataset['fallbackApplied'] = 'true';
    img.src = withClienteImageWidth(buildClienteDefaultImagePath(), CLIENTE_GALLERY_WIDTH);
  }
}
