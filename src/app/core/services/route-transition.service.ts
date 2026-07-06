import { Injectable, computed, signal } from '@angular/core';

const MIN_OVERLAY_MS = 220;

@Injectable({
  providedIn: 'root',
})
export class RouteTransitionService {
  private navigationActive = signal(false);
  private contentHold = signal(0);
  private overlayStartedAt = 0;
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isActive = computed(() => this.navigationActive() || this.contentHold() > 0);

  onNavigationStart(): void {
    this.clearReleaseTimer();
    this.overlayStartedAt = Date.now();
    this.navigationActive.set(true);
    this.contentHold.set(0);
  }

  onNavigationEnd(awaitContent: boolean): void {
    this.navigationActive.set(false);
    if (awaitContent) {
      this.contentHold.set(1);
      return;
    }
    this.scheduleRelease();
  }

  onNavigationAborted(): void {
    this.clearReleaseTimer();
    this.navigationActive.set(false);
    this.contentHold.set(0);
  }

  releaseContent(): void {
    if (this.navigationActive()) {
      return;
    }
    this.scheduleRelease();
  }

  private scheduleRelease(): void {
    this.clearReleaseTimer();
    const elapsed = Date.now() - this.overlayStartedAt;
    const remaining = Math.max(0, MIN_OVERLAY_MS - elapsed);

    if (remaining === 0) {
      this.contentHold.set(0);
      return;
    }

    this.releaseTimer = setTimeout(() => {
      this.contentHold.set(0);
      this.releaseTimer = null;
    }, remaining);
  }

  private clearReleaseTimer(): void {
    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
  }
}
