import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { RouteTransitionService } from './core/services/route-transition.service';
import { AppScrollService } from './core/services/app-scroll.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private appScroll = inject(AppScrollService);
  readonly routeTransition = inject(RouteTransitionService);
  readonly transitionLayout = signal<'catalog' | 'form'>('catalog');

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.routeTransition.onNavigationStart();
        return;
      }

      if (event instanceof NavigationEnd) {
        this.appScroll.scrollToTop();
        const meta = this.getRouteMetaFromSnapshot();
        this.transitionLayout.set(meta.layout);
        this.routeTransition.onNavigationEnd(meta.awaitContent);
        return;
      }

      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.routeTransition.onNavigationAborted();
      }
    });
  }

  private getRouteMetaFromSnapshot(): { awaitContent: boolean; layout: 'catalog' | 'form' } {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    return {
      awaitContent: route.data['awaitContent'] === true,
      layout: route.data['transitionLayout'] === 'form' ? 'form' : 'catalog',
    };
  }
}
