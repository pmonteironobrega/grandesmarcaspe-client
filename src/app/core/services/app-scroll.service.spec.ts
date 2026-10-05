import { TestBed } from '@angular/core/testing';
import { AppScrollService } from './app-scroll.service';

describe('AppScrollService', () => {
  let service: AppScrollService;
  let scrollSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppScrollService);
    scrollSpy = spyOn(window, 'scrollTo');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('scrollToTop should scroll the window to the top', () => {
    service.scrollToTop();
    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, left: 0 });
  });

  it('scrollToElement should scroll the window to the element minus the offset', () => {
    const target = document.createElement('h2');
    spyOnProperty(window, 'scrollY').and.returnValue(100);
    spyOn(target, 'getBoundingClientRect').and.returnValue({
      top: 200,
      bottom: 220,
      left: 0,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect);

    service.scrollToElement(target, 16);

    expect(scrollSpy).toHaveBeenCalledWith({ top: 284, left: 0 });
  });

  it('scrollToElement should not scroll above the top of the page', () => {
    const target = document.createElement('h2');
    spyOnProperty(window, 'scrollY').and.returnValue(0);
    spyOn(target, 'getBoundingClientRect').and.returnValue({ top: 5 } as DOMRect);

    service.scrollToElement(target, 16);

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, left: 0 });
  });
});
