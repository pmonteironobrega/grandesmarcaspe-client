import {
  Component,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiAlertType = 'success' | 'error' | 'info';

const DEFAULT_AUTO_DISMISS_MS = 5000;

@Component({
  selector: 'app-ui-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-alert.component.html',
  styleUrl: './ui-alert.component.scss',
})
export class UiAlertComponent implements OnInit, OnDestroy {
  type = input<UiAlertType>('info');
  autoDismissMs = input(DEFAULT_AUTO_DISMISS_MS);

  dismissed = output<void>();

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const delay = this.autoDismissMs();
    if (delay <= 0) {
      return;
    }

    this.dismissTimer = setTimeout(() => {
      this.dismissed.emit();
      this.dismissTimer = null;
    }, delay);
  }

  ngOnDestroy(): void {
    this.clearDismissTimer();
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
