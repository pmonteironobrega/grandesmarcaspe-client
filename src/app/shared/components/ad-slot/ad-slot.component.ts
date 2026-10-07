import { PlatformLocation } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { GoogleTagsService, isProductionHost } from '../../../core/services/google-tags.service';
import { environment } from '../../../../environments/environment';

/**
 * Fixed AdSense unit. The `<ins>` is in the first HTML with an explicit size,
 * so filling it does not insert a node during hydration. The script runs only
 * once the slot is near the viewport, after paint, and outside Angular.
 * Automatic sizing (`data-ad-format="auto"`) is not used.
 */
@Component({
  selector: 'app-ad-slot',
  standalone: true,
  template: `
    @if (reservedHeight()) {
      <div class="ad-slot text-center my-3" [style.min-height.px]="reservedHeight()">
        <ins
          class="adsbygoogle"
          [style.display]="'inline-block'"
          [style.width.px]="width()"
          [style.height.px]="height()"
          [style.max-width]="'100%'"
          [attr.data-ad-client]="adClient"
          [attr.data-ad-slot]="slot()"
        ></ins>
      </div>
    }
  `,
})
export class AdSlotComponent {
  private readonly googleTags = inject(GoogleTagsService);
  private readonly location = inject(PlatformLocation);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly slot = input.required<string>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();

  readonly adClient = environment.adsenseClient;

  /** Present in the server HTML on the production host, before the ad script runs. */
  readonly reservedHeight = computed(() => {
    if (!environment.adsenseClient || !isProductionHost(this.location.hostname)) {
      return null;
    }
    return this.height();
  });

  constructor() {
    afterNextRender(() => {
      if (!this.googleTags.adsEnabled || !this.reservedHeight()) {
        return;
      }

      const start = () => this.googleTags.scheduleAd();
      const host = this.host.nativeElement;
      if (typeof IntersectionObserver === 'undefined') {
        start();
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }
          observer.disconnect();
          start();
        },
        { rootMargin: '200px 0px' },
      );
      observer.observe(host);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
