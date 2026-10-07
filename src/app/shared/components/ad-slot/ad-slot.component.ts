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
 * AdSense unit. A fixed unit keeps its size in the first HTML. A responsive
 * unit uses the display snippet (`data-ad-format="auto"`) and does not reserve
 * a height, because AdSense chooses the size. The script runs after paint and
 * outside Angular: right away for priority units, otherwise once the slot is
 * near the viewport and the page has loaded.
 */
@Component({
  selector: 'app-ad-slot',
  standalone: true,
  template: `
    @if (enabled()) {
      <div class="ad-slot text-center my-3" [style.min-height.px]="reservedHeight()">
        @if (responsive()) {
          <ins
            class="adsbygoogle"
            [style.display]="'block'"
            [attr.data-ad-client]="adClient"
            [attr.data-ad-slot]="slot()"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        } @else {
          <ins
            class="adsbygoogle"
            [style.display]="'inline-block'"
            [style.width.px]="width()"
            [style.height.px]="height()"
            [style.max-width]="'100%'"
            [attr.data-ad-client]="adClient"
            [attr.data-ad-slot]="slot()"
          ></ins>
        }
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
  readonly width = input<number>();
  readonly height = input<number>();
  /** Responsive display unit. Omit width and height. */
  readonly responsive = input(false);
  /** Top-of-page unit: loads right after hydration instead of after the page load event. */
  readonly priority = input(false);

  readonly adClient = environment.adsenseClient;

  readonly enabled = computed(() => {
    if (!environment.adsenseClient || !isProductionHost(this.location.hostname)) {
      return false;
    }
    if (this.responsive()) {
      return true;
    }
    return !!this.width() && !!this.height();
  });

  /** Present in the server HTML on the production host, before the ad script runs. */
  readonly reservedHeight = computed(() => {
    if (!this.enabled() || this.responsive()) {
      return null;
    }
    return this.height() ?? null;
  });

  constructor() {
    afterNextRender(() => {
      if (!this.googleTags.adsEnabled || !this.enabled()) {
        return;
      }

      const start = () => this.googleTags.scheduleAd(this.priority());
      const host = this.host.nativeElement;
      if (this.priority() || typeof IntersectionObserver === 'undefined') {
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
