import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvaliacaoService } from '../../../core/services/avaliacao.service';
import { Avaliacao } from '../../../core/models/avaliacao.model';

@Component({
  selector: 'app-avaliacoes-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avaliacoes-section.component.html',
  styleUrl: './avaliacoes-section.component.scss',
})
export class AvaliacoesSectionComponent {
  clienteId = input.required<number>();

  private avaliacaoService = inject(AvaliacaoService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  avaliacoes = signal<Avaliacao[]>([]);
  loading = signal(true);

  constructor() {
    effect(() => {
      const id = this.clienteId();
      if (id && this.isBrowser) {
        this.loadAvaliacoes(id);
      }
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR');
  }

  private loadAvaliacoes(clienteId: number): void {
    this.loading.set(true);

    this.avaliacaoService.list(clienteId).subscribe({
      next: (response) => {
        this.avaliacoes.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.avaliacoes.set([]);
        this.loading.set(false);
      },
    });
  }
}
