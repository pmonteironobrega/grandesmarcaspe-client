import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { PerfilPageComponent } from './perfil-page.component';
import { AuthService } from '../../core/services/auth.service';

describe('PerfilPageComponent', () => {
  let component: PerfilPageComponent;
  let fixture: ComponentFixture<PerfilPageComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['updateProfile', 'uploadProfilePhoto', 'removeProfilePhoto'],
      {
        isAuthenticated: signal(true).asReadonly(),
        currentUser: signal({
          id: '1',
          nome: 'Maria',
          email: 'maria@example.com',
          role: 'user' as const,
          fotoCaminho: null,
        }).asReadonly(),
      },
    );
    authSpy.updateProfile.and.returnValue(
      of({
        id: '1',
        nome: 'Maria',
        email: 'maria@example.com',
        role: 'user',
        fotoCaminho: null,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [PerfilPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateProfile on save', () => {
    component.nome = 'Maria Silva';
    component.email = 'maria@example.com';

    component.saveProfile();

    expect(authSpy.updateProfile).toHaveBeenCalledWith({
      nome: 'Maria Silva',
      email: 'maria@example.com',
    });
  });

  it('should upload photo after file selection', () => {
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
    authSpy.uploadProfilePhoto.and.returnValue(
      of({
        id: '1',
        nome: 'Maria',
        email: 'maria@example.com',
        role: 'user',
        fotoCaminho: 'usuarios/1/foto.jpg',
      }),
    );

    component.onPhotoSelected({
      target: { files: [file], value: 'foto.jpg' },
    } as unknown as Event);

    expect(authSpy.uploadProfilePhoto).toHaveBeenCalledWith(file);
  });
});
