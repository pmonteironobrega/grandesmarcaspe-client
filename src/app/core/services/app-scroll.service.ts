import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AppScrollService {
  private platformId = inject(PLATFORM_ID);

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const scrollEl = this.getScrollContainer();
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }
  }

  scrollToElement(element: HTMLElement, offsetPx = 16): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const scrollEl = this.getScrollContainer();
    if (!scrollEl) {
      return;
    }

    const scrollRect = scrollEl.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const relativeTop = elementRect.top - scrollRect.top + scrollEl.scrollTop;
    scrollEl.scrollTop = Math.max(0, relativeTop - offsetPx);
  }

  private getScrollContainer(): HTMLElement | null {
    return document.querySelector('.app-scroll');
  }
}
