import { TestBed } from '@angular/core/testing';
import { AppScrollService } from './app-scroll.service';

describe('AppScrollService', () => {
  let service: AppScrollService;
  let scrollEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppScrollService);

    scrollEl = document.createElement('div');
    scrollEl.className = 'app-scroll';
    scrollEl.style.height = '400px';
    scrollEl.style.overflow = 'auto';
    document.body.appendChild(scrollEl);

    const spacer = document.createElement('div');
    spacer.style.height = '800px';
    scrollEl.appendChild(spacer);
  });

  afterEach(() => {
    scrollEl.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('scrollToTop should reset scrollTop', () => {
    scrollEl.scrollTop = 200;
    service.scrollToTop();
    expect(scrollEl.scrollTop).toBe(0);
  });

  it('scrollToElement should set scrollTop from element position', () => {
    const target = document.createElement('h2');
    scrollEl.appendChild(target);
    scrollEl.scrollTop = 100;

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
    spyOn(scrollEl, 'getBoundingClientRect').and.returnValue({
      top: 100,
      bottom: 500,
      left: 0,
      right: 400,
      width: 400,
      height: 400,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);

    service.scrollToElement(target, 16);

    expect(scrollEl.scrollTop).toBe(184);
  });
});
