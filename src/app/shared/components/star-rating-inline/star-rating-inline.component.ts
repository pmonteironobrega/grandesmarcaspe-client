import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvaliacaoService } from '../../../core/services/avaliacao.service';
import { AvaliacaoResumo } from '../../../core/models/avaliacao.model';
import { resolveApiErrorMessage } from '../../../core/utils/api-message';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { UiAlertComponent, UiAlertType } from '../ui-alert/ui-alert.component';
import {
  getClienteRating,
  getOrCreateSessionId,
  hasRatedCliente,
  markClienteRated,
} from '../../../core/utils/avaliacao-session';

@Component({
  selector: 'app-star-rating-inline',
  standalone: true,
  imports: [CommonModule, StarRatingComponent, UiAlertComponent],
  template: `
    <div class="star-rating-inline">
      <app-star-rating
        [media]="media()"
        [total]="total()"
        [userRating]="userRating()"
        [submitting]="submitting()"
        (rate)="onRate($event)"
      />

      @if (alertMessage()) {
        <app-ui-alert class="mt-2" [type]="alertType()" (dismissed)="alertMessage.set('')">
          {{ alertMessage() }}
        </app-ui-alert>
      }
    </div>
  `,
  styles: `
    .star-rating-inline {
      display: inline-block;
      max-width: 100%;
    }
  `,
})
export class StarRatingInlineComponent {
  clienteId = input.required<number>();
  fallbackNota = input(0);

  resumoChange = output<AvaliacaoResumo | null>();

  private avaliacaoService = inject(AvaliacaoService);

  media = signal(0);
  total = signal(0);
  userRating = signal(0);
  submitting = signal(false);
  alertMessage = signal('');
  alertType = signal<UiAlertType>('info');

  constructor() {
    effect(() => {
      const id = this.clienteId();
      if (id) {
        this.syncUserRating(id);
        this.loadResumo(id);
      }
    });
  }

  onRate(nota: number): void {
    const clienteId = this.clienteId();

    if (hasRatedCliente(clienteId)) {
      this.showAlert('error', 'Você já avaliou este estabelecimento.');
      return;
    }

    this.submitting.set(true);
    this.alertMessage.set('');

    this.avaliacaoService
      .create(clienteId, {
        nota,
        sessaoId: getOrCreateSessionId(),
      })
      .subscribe({
        next: () => {
          markClienteRated(clienteId, nota);
          this.userRating.set(nota);
          this.submitting.set(false);
          this.showAlert('success', 'Avaliação registrada com sucesso. Obrigado!');
          this.loadResumo(clienteId);
        },
        error: (err) => {
          this.submitting.set(false);

          if (err?.status === 409) {
            markClienteRated(clienteId, nota);
            this.userRating.set(nota);
            this.showAlert('info', 'Você já avaliou este estabelecimento.');
            this.loadResumo(clienteId);
            return;
          }

          this.showAlert('error', resolveApiErrorMessage(err, 'avaliacao'));
        },
      });
  }

  private showAlert(type: UiAlertType, message: string): void {
    this.alertType.set(type);
    this.alertMessage.set(message);
  }

  private syncUserRating(clienteId: number): void {
    this.userRating.set(getClienteRating(clienteId) ?? 0);
  }

  private loadResumo(clienteId: number): void {
    this.avaliacaoService.getResumo(clienteId).subscribe({
      next: (resumo) => {
        this.media.set(resumo.total > 0 ? resumo.media : this.fallbackNota());
        this.total.set(resumo.total);
        this.resumoChange.emit(resumo);
      },
      error: () => {
        this.media.set(this.fallbackNota());
        this.total.set(0);
        this.resumoChange.emit(null);
      },
    });
  }
}
