import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppScrollService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.defaultView?.scrollTo({ top: 0, left: 0 });
  }

  scrollToElement(element: HTMLElement, offsetPx = 16): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const win = this.document.defaultView;
    if (!win) {
      return;
    }

    const top = element.getBoundingClientRect().top + win.scrollY;
    win.scrollTo({ top: Math.max(0, top - offsetPx), left: 0 });
  }
}
