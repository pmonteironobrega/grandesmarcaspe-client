import { PlatformLocation } from '@angular/common';
import { afterNextRender, Component, computed, inject, Injector, input, signal } from '@angular/core';
import { GoogleTagsService, isProductionHost } from '../../../core/services/google-tags.service';
import { environment } from '../../../../environments/environment';

/**
 * Fixed AdSense unit. The `<ins>` is rendered only in the browser: AdSense
 * rewrites it, which would break SSR hydration if it were part of the server HTML.
 * The reserved height stays in the first HTML so the unit does not push the page.
 * Automatic sizing (`data-ad-format="auto"`) is not used.
 */
@Component({
  selector: 'app-ad-slot',
  standalone: true,
  template: `
    @if (visible() || reservedHeight()) {
      <div class="ad-slot text-center my-3" [style.min-height.px]="reservedHeight()">
        @if (visible()) {
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
  private readonly injector = inject(Injector);
  private readonly location = inject(PlatformLocation);

  readonly slot = input.required<string>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();

  readonly adClient = environment.adsenseClient;
  readonly visible = signal(false);

  /** Present in the server HTML on the production host, before the ad script runs. */
  readonly reservedHeight = computed(() => {
    if (!environment.adsenseClient || !isProductionHost(this.location.hostname)) {
      return null;
    }
    return this.height();
  });

  constructor() {
    afterNextRender(() => {
      if (!this.googleTags.adsEnabled) {
        return;
      }
      this.googleTags.loadAdsense();
      this.visible.set(true);
      afterNextRender(() => this.googleTags.pushAd(), { injector: this.injector });
    });
  }
}
