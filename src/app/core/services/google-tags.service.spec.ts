import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { GoogleTagsService, runAfterPageLoad, runOnFirstInteraction } from './google-tags.service';

describe('GoogleTagsService', () => {
  it('should not load Google scripts outside the production host', () => {
    const service = TestBed.inject(GoogleTagsService);
    const document = TestBed.inject(DOCUMENT);

    service.initAnalytics();
    service.loadAdsense();

    expect(service.analyticsEnabled).toBeFalse();
    expect(service.adsEnabled).toBeFalse();
    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
    expect(document.querySelector('script[src*="googlesyndication.com"]')).toBeNull();
  });

  it('should wait for the load event before starting a third-party script', () => {
    let ran = false;
    const listeners = new Map<string, () => void>();
    const win = {
      document: { readyState: 'loading' },
      addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
      requestIdleCallback: (callback: () => void) => callback(),
      setTimeout: () => 0,
    } as unknown as Window;

    runAfterPageLoad(win, () => {
      ran = true;
    });

    expect(ran).toBeFalse();
    listeners.get('load')?.();
    expect(ran).toBeTrue();
  });

  it('should run once on the first user interaction and stop listening', () => {
    let runs = 0;
    const listeners = new Map<string, () => void>();
    const win = {
      addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
      removeEventListener: (type: string) => listeners.delete(type),
    } as unknown as Window;

    runOnFirstInteraction(win, () => {
      runs += 1;
    });

    expect(runs).toBe(0);
    expect(listeners.has('scroll')).toBeTrue();
    listeners.get('pointerdown')?.();
    expect(runs).toBe(1);
    expect(listeners.size).toBe(0);
  });
});
