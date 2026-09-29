import { afterNextRender, Component, inject, Injector, input, signal } from '@angular/core';
import { GoogleTagsService } from '../../../core/services/google-tags.service';
import { environment } from '../../../../environments/environment';

/**
 * AdSense unit. Rendered only in the browser: AdSense rewrites the <ins> element,
 * which would break SSR hydration if it were part of the server HTML.
 */
@Component({
  selector: 'app-ad-slot',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="ad-slot text-center my-3">
        @if (width() && height()) {
          <ins
            class="adsbygoogle"
            [style.display]="'inline-block'"
            [style.width.px]="width()"
            [style.height.px]="height()"
            [style.max-width]="'100%'"
            [attr.data-ad-client]="adClient"
            [attr.data-ad-slot]="slot()"
          ></ins>
        } @else {
          <ins
            class="adsbygoogle"
            [style.display]="'block'"
            [attr.data-ad-client]="adClient"
            [attr.data-ad-slot]="slot()"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        }
      </div>
    }
  `,
})
export class AdSlotComponent {
  private readonly googleTags = inject(GoogleTagsService);
  private readonly injector = inject(Injector);

  readonly slot = input.required<string>();
  /** Fixed-size units; omit both for a responsive unit. */
  readonly width = input<number>();
  readonly height = input<number>();

  readonly adClient = environment.adsenseClient;
  readonly visible = signal(false);

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
