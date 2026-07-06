import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  media = input(0);
  total = input(0);
  readonly = input(false);
  userRating = input(0);
  submitting = input(false);

  rate = output<number>();

  hoverNota = signal(0);

  readonly stars = [1, 2, 3, 4, 5];

  isInteractive(): boolean {
    return !this.readonly() && this.userRating() === 0 && !this.submitting();
  }

  displayValue(): number {
    if (this.userRating() > 0) {
      return this.userRating();
    }

    const hover = this.hoverNota();
    if (hover > 0 && this.isInteractive()) {
      return hover;
    }

    return this.media();
  }

  onStarClick(nota: number): void {
    if (!this.isInteractive()) {
      return;
    }

    this.rate.emit(nota);
  }

  onStarHover(nota: number): void {
    if (this.isInteractive()) {
      this.hoverNota.set(nota);
    }
  }

  onStarLeave(): void {
    this.hoverNota.set(0);
  }
}
