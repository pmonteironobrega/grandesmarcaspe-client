import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'loginWithGoogle'],
      {
        isAuthenticated: signal(false).asReadonly(),
        currentUser: signal(null).asReadonly(),
      },
    );
    authSpy.login.and.returnValue(
      of({
        accessToken: 'token',
        user: { id: '1', nome: 'Maria', email: 'maria@example.com', role: 'user', fotoCaminho: null },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show validation when login fields are empty', () => {
    component.submit();
    expect(component.errorMessage()).toBe('Informe e-mail e senha.');
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('should call login on submit', () => {
    component.email = 'maria@example.com';
    component.senha = '123456';

    component.submit();

    expect(authSpy.login).toHaveBeenCalledWith({
      email: 'maria@example.com',
      senha: '123456',
    });
  });
});
