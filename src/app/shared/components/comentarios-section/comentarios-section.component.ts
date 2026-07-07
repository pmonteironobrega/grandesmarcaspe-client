import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComentarioService } from '../../../core/services/comentario.service';
import { Comentario } from '../../../core/models/comentario.model';
import { resolveApiErrorMessage } from '../../../core/utils/api-message';
import { resolveUserPhotoUrl } from '../../../core/utils/user-photo';
import { AuthService } from '../../../core/services/auth.service';
import { UiAlertComponent } from '../ui-alert/ui-alert.component';

@Component({
  selector: 'app-comentarios-section',
  standalone: true,
  imports: [CommonModule, FormsModule, UiAlertComponent],
  templateUrl: './comentarios-section.component.html',
  styleUrl: './comentarios-section.component.scss',
})
export class ComentariosSectionComponent {
  clienteId = input.required<number>();

  private comentarioService = inject(ComentarioService);
  private auth = inject(AuthService);

  comentarios = signal<Comentario[]>([]);
  loading = signal(true);
  submitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  replyingTo = signal<number | null>(null);

  conteudo = signal('');
  replyConteudo = signal('');

  readonly currentAuthorName = computed(() => this.auth.currentUser()?.nome ?? null);
  readonly currentAuthorPhotoUrl = computed(() =>
    resolveUserPhotoUrl(this.auth.currentUser()?.fotoCaminho ?? null),
  );

  constructor() {
    effect(() => {
      const id = this.clienteId();
      if (id) {
        this.loadComentarios(id);
      }
    });
  }

  authorName(nome: string | null | undefined): string {
    const value = nome?.trim();
    return value || 'Usuário';
  }

  authorPhotoUrl(caminho: string | null | undefined): string {
    return resolveUserPhotoUrl(caminho) ?? '/img/avatar-usuario.svg';
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleReply(comentarioId: number): void {
    this.replyingTo.set(this.replyingTo() === comentarioId ? null : comentarioId);
    this.replyConteudo.set('');
    this.errorMessage.set('');
  }

  submitComment(parentId?: number): void {
    const texto = (parentId ? this.replyConteudo() : this.conteudo()).trim();

    if (texto.length < 2) {
      this.errorMessage.set('Escreva um comentário.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.comentarioService
      .create(this.clienteId(), {
        conteudo: texto,
        parentId,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set(
            parentId ? 'Resposta publicada com sucesso.' : 'Comentário publicado com sucesso.',
          );

          if (parentId) {
            this.replyConteudo.set('');
            this.replyingTo.set(null);
          } else {
            this.conteudo.set('');
          }

          this.loadComentarios(this.clienteId());
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(resolveApiErrorMessage(err, 'comentario'));
        },
      });
  }

  private loadComentarios(clienteId: number): void {
    this.loading.set(true);
    this.comentarioService.list(clienteId).subscribe({
      next: (items) => {
        this.comentarios.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.comentarios.set([]);
        this.loading.set(false);
      },
    });
  }
}
