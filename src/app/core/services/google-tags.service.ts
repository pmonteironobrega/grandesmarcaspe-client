import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
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
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly onProductionHost = this.isBrowser && isProductionHost(this.document.location.hostname);
  private adsenseLoaded = false;

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

    this.appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  }

  loadAdsense(): void {
    if (!this.adsEnabled || this.adsenseLoaded) {
      return;
    }
    this.adsenseLoaded = true;
    this.appendScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(environment.adsenseClient)}`,
      true,
    );
  }

  pushAd(): void {
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    (win.adsbygoogle = win.adsbygoogle || []).push({});
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

export function isProductionHost(hostname: string): boolean {
  const siteHost = new URL(environment.siteUrl).hostname;
  const apexHost = siteHost.replace(/^www\./, '');
  return hostname === siteHost || hostname === apexHost;
}
