export type AuthUserRole = 'user' | 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: AuthUserRole;
  fotoCaminho: string | null;
}

export interface UpdateProfilePayload {
  nome?: string;
  email?: string;
  senhaAtual?: string;
  senha?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}
