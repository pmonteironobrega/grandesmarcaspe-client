import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { resolveApiErrorMessage } from '../../core/utils/api-message';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
})
export class AuthCallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  errorMessage = signal('');

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const error = params.get('error');
    if (error) {
      this.errorMessage.set(decodeURIComponent(error));
      return;
    }

    const token = params.get('accessToken') ?? params.get('token');
    if (!token) {
      this.errorMessage.set('Não foi possível concluir o login com o Google.');
      return;
    }

    this.auth.completeOAuthCallback(token).subscribe({
      next: () => {
        const returnUrl = params.get('returnUrl') ?? '/';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.auth.logout(false);
        this.errorMessage.set(resolveApiErrorMessage(err, 'auth'));
      },
    });
  }

  backToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
