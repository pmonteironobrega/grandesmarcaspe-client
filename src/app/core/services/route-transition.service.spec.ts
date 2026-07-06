import { TestBed } from '@angular/core/testing';
import { RouteTransitionService } from './route-transition.service';

describe('RouteTransitionService', () => {
  let service: RouteTransitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteTransitionService);
  });

  it('should be active during navigation', () => {
    service.onNavigationStart();
    expect(service.isActive()).toBeTrue();
  });

  it('should hold content after navigation when awaitContent is true', () => {
    service.onNavigationStart();
    service.onNavigationEnd(true);
    expect(service.isActive()).toBeTrue();
  });

  it('should release after releaseContent is called', (done) => {
    service.onNavigationStart();
    service.onNavigationEnd(true);
    service.releaseContent();

    setTimeout(() => {
      expect(service.isActive()).toBeFalse();
      done();
    }, 300);
  });

  it('should clear on navigation aborted', () => {
    service.onNavigationStart();
    service.onNavigationEnd(true);
    service.onNavigationAborted();
    expect(service.isActive()).toBeFalse();
  });
});
