import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { CadastroPageComponent } from './cadastro-page.component';
import { AuthService } from '../../core/services/auth.service';

describe('CadastroPageComponent', () => {
  let component: CadastroPageComponent;
  let fixture: ComponentFixture<CadastroPageComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['register', 'loginWithGoogle'],
      {
        isAuthenticated: signal(false).asReadonly(),
        currentUser: signal(null).asReadonly(),
      },
    );
    authSpy.register.and.returnValue(
      of({
        accessToken: 'token',
        user: { id: '1', nome: 'Maria', email: 'maria@example.com', role: 'user', fotoCaminho: null },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CadastroPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call register on submit', () => {
    component.nome = 'Maria';
    component.email = 'maria@example.com';
    component.senha = '123456';
    component.confirmarSenha = '123456';

    component.submit();

    expect(authSpy.register).toHaveBeenCalledWith({
      nome: 'Maria',
      email: 'maria@example.com',
      senha: '123456',
    });
  });
});
