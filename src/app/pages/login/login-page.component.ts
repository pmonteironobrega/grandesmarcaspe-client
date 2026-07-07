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
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent, UiAlertComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private routeTransition = inject(RouteTransitionService);

  readonly breadcrumb = [{ page: 'Login', router: '/login' }];

  email = '';
  senha = '';
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

    const email = this.email.trim();
    const senha = this.senha;

    if (!email || !senha) {
      this.errorMessage.set('Informe e-mail e senha.');
      return;
    }

    this.loading.set(true);
    this.auth.login({ email, senha }).subscribe({
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
