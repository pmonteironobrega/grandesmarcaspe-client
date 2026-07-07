import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'r/**',
    renderMode: RenderMode.Server,
  },
  {
    path: 'c/**',
    renderMode: RenderMode.Server,
  },
  {
    path: 'busca',
    renderMode: RenderMode.Server,
  },
  {
    path: 'sobre',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'anuncie',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'termos-privacidade',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'fale-conosco',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'cadastro',
    renderMode: RenderMode.Client,
  },
  {
    path: 'auth/callback',
    renderMode: RenderMode.Client,
  },
  {
    path: 'perfil',
    renderMode: RenderMode.Client,
  },
];
