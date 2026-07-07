import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthUser } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const platformUser: AuthUser = {
    id: '1',
    nome: 'Maria',
    email: 'maria@example.com',
    role: 'user',
    fotoCaminho: null,
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login should persist token and user for platform users', () => {
    service.login({ email: 'maria@example.com', senha: '123456' }).subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'token-123', user: platformUser });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()).toEqual(platformUser);
    expect(localStorage.getItem('gmpe_access_token')).toBe('token-123');
  });

  it('login should reject non-platform roles', () => {
    let errorMessage = '';

    service
      .login({ email: 'admin@example.com', senha: '123456' })
      .subscribe({
        error: (error: Error) => {
          errorMessage = error.message;
        },
      });

    const req = httpMock.expectOne('/auth/login');
    req.flush({
      accessToken: 'token-admin',
      user: { ...platformUser, role: 'superadmin' },
    });

    expect(errorMessage).toContain('usuários da plataforma');
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('register should call auth register endpoint', () => {
    service.register({
      nome: 'Maria',
      email: 'maria@example.com',
      senha: '123456',
    }).subscribe();

    const req = httpMock.expectOne('/auth/register');
    expect(req.request.body).toEqual({
      nome: 'Maria',
      email: 'maria@example.com',
      senha: '123456',
    });
    req.flush({ accessToken: 'token-123', user: platformUser });
  });

  it('logout should clear session', () => {
    localStorage.setItem('gmpe_access_token', 'token-123');
    service.restoreSession();

    const req = httpMock.expectOne('/auth/me');
    req.flush(platformUser);

    service.logout(false);

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('gmpe_access_token')).toBeNull();
  });
});
