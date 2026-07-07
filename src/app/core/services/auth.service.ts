import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from '../models/auth.model';

const TOKEN_STORAGE_KEY = 'gmpe_access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private accessTokenSignal = signal<string | null>(null);
  private currentUserSignal = signal<AuthUser | null>(null);

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.accessTokenSignal()));

  constructor() {
    afterNextRender(() => {
      this.restoreSession();
    });
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.buildUrl('/auth/register'), payload)
      .pipe(map((response) => this.applyAuthResponse(response)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.buildUrl('/auth/login'), payload)
      .pipe(map((response) => this.applyAuthResponse(response)));
  }

  fetchCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(this.buildUrl('/auth/me')).pipe(
      map((user) => this.applyCurrentUser(user)),
    );
  }

  loginWithGoogle(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = this.buildUrl(
      `/auth/google?redirectUri=${encodeURIComponent(redirectUri)}`,
    );
  }

  completeOAuthCallback(token: string): Observable<AuthUser> {
    this.persistToken(token);
    return this.fetchCurrentUser();
  }

  updateProfile(payload: UpdateProfilePayload): Observable<AuthUser> {
    return this.http.patch<AuthUser>(this.buildUrl('/auth/me'), payload).pipe(
      map((user) => this.applyCurrentUser(user)),
    );
  }

  uploadProfilePhoto(file: File): Observable<AuthUser> {
    const formData = new FormData();
    formData.append('foto', file, file.name);

    return this.http.post<AuthUser>(this.buildUrl('/auth/me/foto'), formData).pipe(
      map((user) => this.applyCurrentUser(user)),
    );
  }

  removeProfilePhoto(): Observable<AuthUser> {
    return this.http.delete<AuthUser>(this.buildUrl('/auth/me/foto')).pipe(
      map((user) => this.applyCurrentUser(user)),
    );
  }

  logout(navigateHome = true): void {
    this.clearSession();
    if (navigateHome) {
      void this.router.navigateByUrl('/');
    }
  }

  restoreSession(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      return;
    }

    this.accessTokenSignal.set(token);
    this.fetchCurrentUser().subscribe({
      error: () => this.clearSession(),
    });
  }

  private applyCurrentUser(user: AuthUser): AuthUser {
    const normalized: AuthUser = {
      ...user,
      fotoCaminho: user.fotoCaminho ?? null,
    };
    this.assertPlatformUser(normalized);
    this.currentUserSignal.set(normalized);
    return normalized;
  }

  private applyAuthResponse(response: AuthResponse): AuthResponse {
    this.assertPlatformUser(response.user);
    this.persistToken(response.accessToken);
    this.currentUserSignal.set({
      ...response.user,
      fotoCaminho: response.user.fotoCaminho ?? null,
    });
    return response;
  }

  private persistToken(token: string): void {
    this.accessTokenSignal.set(token);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }

  private clearSession(): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  private assertPlatformUser(user: AuthUser): void {
    if (user.role !== 'user') {
      this.clearSession();
      throw new Error('Acesso permitido apenas para usuários da plataforma.');
    }
  }

  private buildUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (isPlatformBrowser(this.platformId)) {
      return normalized;
    }
    return `${environment.apiUrl}${normalized}`;
  }
}
