import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

/**
 * Google Analytics (GA4) and AdSense loader.
 * Browser-only and restricted to the production host so the temporary/dev domains
 * never send analytics hits or request ads.
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleTagsService {
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly onProductionHost = this.isBrowser && isProductionHost(this.document.location.hostname);
  private adsenseRequested = false;
  private adsenseAppended = false;
  private pendingPushes = 0;
  private priorityFlushScheduled = false;
  private deferredFlushScheduled = false;

  get analyticsEnabled(): boolean {
    return this.onProductionHost && !!environment.googleAnalyticsId;
  }

  get adsEnabled(): boolean {
    return this.onProductionHost && !!environment.adsenseClient;
  }

  initAnalytics(): void {
    if (!this.analyticsEnabled || this.document.defaultView?.gtag) {
      return;
    }

    const win = this.document.defaultView!;
    const id = environment.googleAnalyticsId;
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag() {
      // gtag.js expects the Arguments object itself, not an array.
      win.dataLayer!.push(arguments);
    };
    win.gtag('js', new Date());
    win.gtag('config', id);

    // The stub above is tiny. gtag.js itself is parsed on the main thread, so it
    // waits until after load instead of competing with hydration (that is the TBT).
    this.runAfterLoad(() =>
      this.appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`),
    );
  }

  /** `immediate` skips the wait for the load event (top units above the fold). */
  loadAdsense(immediate = false): void {
    if (!this.adsEnabled) {
      return;
    }
    if (immediate) {
      this.ngZone.runOutsideAngular(() => this.appendAdsenseScript());
      return;
    }
    if (this.adsenseRequested) {
      return;
    }
    this.adsenseRequested = true;
    this.ngZone.runOutsideAngular(() => this.runAfterLoad(() => this.appendAdsenseScript()));
  }

  /**
   * Fills the next `<ins>` after the browser has painted.
   * Priority units (top of the page) go right after hydration; the others wait
   * for the load event and an idle slice so they do not compete with it.
   * AdSense reads offsetWidth. Doing that in the same turn as an Angular
   * update forces a reflow, and doing it inside the zone schedules another
   * update. Slots that scroll into view later share one flush per frame.
   */
  scheduleAd(priority = false): void {
    if (!this.adsEnabled) {
      return;
    }
    const win = this.document.defaultView;
    if (!win) {
      return;
    }

    this.pendingPushes += 1;
    if (priority ? this.priorityFlushScheduled : this.deferredFlushScheduled) {
      return;
    }
    this.loadAdsense(priority);

    const flush = () => {
      const count = this.pendingPushes;
      this.pendingPushes = 0;
      for (let index = 0; index < count; index += 1) {
        (win.adsbygoogle = win.adsbygoogle || []).push({});
      }
    };
    const afterPaint = (done: () => void) =>
      win.requestAnimationFrame(() =>
        win.requestAnimationFrame(() => {
          done();
          flush();
        }),
      );

    this.ngZone.runOutsideAngular(() => {
      if (priority) {
        this.priorityFlushScheduled = true;
        afterPaint(() => (this.priorityFlushScheduled = false));
        return;
      }
      this.deferredFlushScheduled = true;
      runAfterPageLoad(win, () => afterPaint(() => (this.deferredFlushScheduled = false)));
    });
  }

  private appendAdsenseScript(): void {
    if (this.adsenseAppended) {
      return;
    }
    this.adsenseAppended = true;
    this.adsenseRequested = true;
    this.appendScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(environment.adsenseClient)}`,
      true,
    );
  }

  /** Third-party scripts start after the document load, on an idle slice. */
  private runAfterLoad(task: () => void): void {
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    runAfterPageLoad(win, task);
  }

  private appendScript(src: string, crossOrigin = false): void {
    const script = this.document.createElement('script');
    script.async = true;
    script.src = src;
    if (crossOrigin) {
      script.crossOrigin = 'anonymous';
    }
    this.document.head.appendChild(script);
  }
}

export function runAfterPageLoad(win: Window, task: () => void): void {
  const start = () => {
    const idle = (
      win as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (idle) {
      idle.call(win, () => task(), { timeout: 2000 });
      return;
    }
    win.setTimeout(task, 1);
  };

  if (win.document.readyState === 'complete') {
    start();
    return;
  }
  win.addEventListener('load', start, { once: true });
}

export function isProductionHost(hostname: string): boolean {
  const siteHost = new URL(environment.siteUrl).hostname;
  const apexHost = siteHost.replace(/^www\./, '');
  return hostname === siteHost || hostname === apexHost;
}
