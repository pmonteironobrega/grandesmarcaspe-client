import { Component, afterNextRender, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { UiAlertComponent } from '../../shared/components/ui-alert/ui-alert.component';
import { AuthService } from '../../core/services/auth.service';
import { resolveApiErrorMessage } from '../../core/utils/api-message';
import { resolveUserPhotoUrl } from '../../core/utils/user-photo';
import { RouteTransitionService } from '../../core/services/route-transition.service';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, UiAlertComponent],
  templateUrl: './perfil-page.component.html',
  styleUrl: './perfil-page.component.scss',
})
export class PerfilPageComponent {
  private auth = inject(AuthService);
  private routeTransition = inject(RouteTransitionService);

  private photoInput = viewChild<ElementRef<HTMLInputElement>>('photoInput');

  readonly breadcrumb = [{ page: 'Meu perfil', router: '/perfil' }];

  nome = '';
  email = '';
  senhaAtual = '';
  senha = '';
  confirmarSenha = '';
  selectedPhoto = signal<File | null>(null);
  photoPreviewUrl = signal<string | null>(null);

  loadingProfile = signal(false);
  loadingPhoto = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  readonly profilePhotoUrl = computed(() =>
    resolveUserPhotoUrl(this.auth.currentUser()?.fotoCaminho ?? null),
  );

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.nome = user.nome;
      this.email = user.email;
    }

    afterNextRender(() => {
      this.routeTransition.releaseContent();
    });
  }

  openPhotoPicker(): void {
    if (this.loadingPhoto()) {
      return;
    }

    this.photoInput()?.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!file) {
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      this.errorMessage.set('A foto deve ter no máximo 2 MB.');
      return;
    }

    this.selectedPhoto.set(file);
    this.photoPreviewUrl.set(URL.createObjectURL(file));
    this.uploadPhoto();
  }

  saveProfile(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.nome.trim() || !this.email.trim()) {
      this.errorMessage.set('Preencha nome e e-mail.');
      return;
    }

    if (this.senha && this.senha !== this.confirmarSenha) {
      this.errorMessage.set('As senhas não conferem.');
      return;
    }

    if (this.senha && !this.senhaAtual) {
      this.errorMessage.set('Informe a senha atual para definir uma nova senha.');
      return;
    }

    this.loadingProfile.set(true);
    this.auth
      .updateProfile({
        nome: this.nome.trim(),
        email: this.email.trim(),
        ...(this.senha
          ? {
              senhaAtual: this.senhaAtual,
              senha: this.senha,
            }
          : {}),
      })
      .subscribe({
        next: () => {
          this.senha = '';
          this.senhaAtual = '';
          this.confirmarSenha = '';
          this.successMessage.set('Perfil atualizado com sucesso.');
        },
        error: (error) => {
          this.errorMessage.set(resolveApiErrorMessage(error, 'auth'));
        },
        complete: () => this.loadingProfile.set(false),
      });
  }

  uploadPhoto(): void {
    const file = this.selectedPhoto();
    if (!file) {
      this.errorMessage.set('Selecione uma foto para enviar.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loadingPhoto.set(true);

    this.auth.uploadProfilePhoto(file).subscribe({
      next: (user) => {
        this.selectedPhoto.set(null);
        this.photoPreviewUrl.set(resolveUserPhotoUrl(user.fotoCaminho));
        this.successMessage.set('Foto de perfil atualizada.');
      },
      error: (error) => {
        this.errorMessage.set(resolveApiErrorMessage(error, 'auth'));
      },
      complete: () => this.loadingPhoto.set(false),
    });
  }

  removePhoto(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loadingPhoto.set(true);

    this.auth.removeProfilePhoto().subscribe({
      next: () => {
        this.selectedPhoto.set(null);
        this.photoPreviewUrl.set(null);
        this.successMessage.set('Foto de perfil removida.');
      },
      error: (error) => {
        this.errorMessage.set(resolveApiErrorMessage(error, 'auth'));
      },
      complete: () => this.loadingPhoto.set(false),
    });
  }
}
