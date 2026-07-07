import { Component, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { UiAlertComponent } from '../../shared/components/ui-alert/ui-alert.component';
import { AuthService } from '../../core/services/auth.service';
import { resolveApiErrorMessage } from '../../core/utils/api-message';
import { RouteTransitionService } from '../../core/services/route-transition.service';

@Component({
  selector: 'app-cadastro-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent, UiAlertComponent],
  templateUrl: './cadastro-page.component.html',
  styleUrl: '../login/login-page.component.scss',
})
export class CadastroPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private routeTransition = inject(RouteTransitionService);

  readonly breadcrumb = [{ page: 'Cadastro', router: '/cadastro' }];

  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  loading = signal(false);
  errorMessage = signal('');

  constructor() {
    afterNextRender(() => {
      this.routeTransition.releaseContent();
    });
  }

  authQueryParams(): Record<string, string> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl ? { returnUrl } : {};
  }

  submit(): void {
    this.errorMessage.set('');

    const nome = this.nome.trim();
    const email = this.email.trim();
    const senha = this.senha;

    if (!nome || !email || !senha) {
      this.errorMessage.set('Preencha nome, e-mail e senha.');
      return;
    }

    if (senha.length < 6) {
      this.errorMessage.set('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== this.confirmarSenha) {
      this.errorMessage.set('As senhas não conferem.');
      return;
    }

    this.loading.set(true);
    this.auth.register({ nome, email, senha }).subscribe({
      next: () => this.navigateAfterAuth(),
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(resolveApiErrorMessage(error, 'auth'));
      },
      complete: () => this.loading.set(false),
    });
  }

  loginWithGoogle(): void {
    this.errorMessage.set('');
    this.auth.loginWithGoogle();
  }

  private navigateAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    void this.router.navigateByUrl(returnUrl);
  }
}
