import { PlatformLocation } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ADSENSE_SLOTS, DETALHES_TOPO_RESERVED_HEIGHT } from '../../../core/constants/adsense';
import { GoogleTagsService, isProductionHost } from '../../../core/services/google-tags.service';
import { environment } from '../../../../environments/environment';

/**
 * AdSense unit. The `<ins>` is rendered only in the browser: AdSense rewrites it,
 * which would break SSR hydration if it were part of the server HTML.
 * `detalhesTopo` keeps its reserved height. Only that unit is taken out of
 * flow, so AdSense can measure the full width: a responsive unit measured
 * inside the reserved box stays blank on a mobile reload. The box only grows
 * when the ad is taller than the reserve, and it never collapses.
 * Other units stay in normal flow. Pulling them out hides a banner that sits
 * above a heading, because the heading then paints in the same spot.
 */
@Component({
  selector: 'app-ad-slot',
  standalone: true,
  template: `
    @if (visible() || reservedHeight()) {
      <div
        class="ad-slot text-center my-3"
        [class.ad-slot--reserved]="reservedHeight()"
        [style.min-height.px]="boxHeight()"
      >
        @if (visible()) {
          <div class="ad-slot__fill" #fill>
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
      </div>
    }
  `,
  styles: `
    .ad-slot--reserved {
      position: relative;
    }

    .ad-slot--reserved .ad-slot__fill {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
    }
  `,
})
export class AdSlotComponent {
  private readonly googleTags = inject(GoogleTagsService);
  private readonly injector = inject(Injector);
  private readonly location = inject(PlatformLocation);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fill = viewChild<ElementRef<HTMLElement>>('fill');

  readonly slot = input.required<string>();
  /** Fixed-size units; omit both for a responsive unit. */
  readonly width = input<number>();
  readonly height = input<number>();

  readonly adClient = environment.adsenseClient;
  readonly visible = signal(false);
  /** Ad height once AdSense has painted. The slot never shrinks below the reserve. */
  private readonly measuredHeight = signal(0);

  /** Present in the server HTML on the production host, before the ad script runs. */
  readonly reservedHeight = computed(() => {
    if (this.slot() !== ADSENSE_SLOTS.detalhesTopo) {
      return null;
    }
    if (!environment.adsenseClient || !isProductionHost(this.location.hostname)) {
      return null;
    }
    return DETALHES_TOPO_RESERVED_HEIGHT;
  });

  readonly boxHeight = computed(() => {
    const reserved = this.reservedHeight() ?? 0;
    const measured = this.measuredHeight();
    const height = Math.max(reserved, measured);
    return height > 0 ? height : null;
  });

  constructor() {
    afterNextRender(() => {
      if (!this.googleTags.adsEnabled) {
        return;
      }
      this.googleTags.loadAdsense();
      this.visible.set(true);
      afterNextRender(() => {
        this.watchAdHeight();
        this.googleTags.pushAd();
      }, { injector: this.injector });
    });
  }

  private watchAdHeight(): void {
    const el = this.fill()?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const height = Math.ceil(entries[0]?.contentRect.height ?? 0);
      if (height > this.measuredHeight()) {
        this.measuredHeight.set(height);
      }
    });
    observer.observe(el);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
