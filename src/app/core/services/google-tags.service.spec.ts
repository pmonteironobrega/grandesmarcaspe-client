import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { GoogleTagsService } from './google-tags.service';

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
});
