import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';

import { NotFoundComponent } from './pages/not-found/not-found.component';

import { authGuard } from './core/guards/auth.guard';

import { HOME_TITLE } from './core/utils/home-seo';

const loadCategoriaList = () =>
  import('./pages/categoria-list/categoria-list.component').then((m) => m.CategoriaListComponent);

const loadClienteDetail = () =>
  import('./pages/cliente-detail/cliente-detail.component').then((m) => m.ClienteDetailComponent);

export const routes: Routes = [

  {
    path: '',
    component: HomeComponent,
    title: HOME_TITLE,
    data: { awaitContent: true },
  },

  {
    path: 'r/:clienteSlug/:cidadeSlug/:bairroSlug/:uf',
    loadComponent: loadClienteDetail,
    data: { awaitContent: true },
  },

  {
    path: 'r/:clienteSlug/:cidadeSlug/:uf',
    loadComponent: loadClienteDetail,
    data: { awaitContent: true },
  },

  { path: 'c/:categoriaSlug/:a', loadComponent: loadCategoriaList, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b', loadComponent: loadCategoriaList, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b/:c', loadComponent: loadCategoriaList, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b/:c/:d', loadComponent: loadCategoriaList, data: { awaitContent: true } },

  {
    path: 'sobre',
    loadComponent: () => import('./pages/sobre/sobre.component').then((m) => m.SobreComponent),
    title: 'Quem Somos | GrandesMarcasPE',
  },

  {
    path: 'anuncie',
    loadComponent: () =>
      import('./pages/anuncie/anuncie-page.component').then((m) => m.AnunciePageComponent),
    title: 'Anuncie seu negócio | GrandesMarcasPE',
  },

  {
    path: 'termos-privacidade',
    loadComponent: () =>
      import('./pages/termos-privacidade/termos-privacidade.component').then(
        (m) => m.TermosPrivacidadeComponent,
      ),
    title: 'Termos e Privacidade | GrandesMarcasPE',
  },

  {
    path: 'fale-conosco',
    loadComponent: () =>
      import('./pages/fale-conosco/fale-conosco.component').then((m) => m.FaleConoscoPageComponent),
    title: 'Fale Conosco | GrandesMarcasPE',
  },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page.component').then((m) => m.LoginPageComponent),
    data: { awaitContent: true, transitionLayout: 'form' },
  },

  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/cadastro/cadastro-page.component').then((m) => m.CadastroPageComponent),
    data: { awaitContent: true, transitionLayout: 'form' },
  },

  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then((m) => m.AuthCallbackComponent),
    data: { awaitContent: true, transitionLayout: 'form' },
  },

  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil-page.component').then((m) => m.PerfilPageComponent),
    canActivate: [authGuard],
    data: { awaitContent: true, transitionLayout: 'form' },
  },

  {
    path: 'busca',
    loadComponent: () =>
      import('./pages/busca-results/busca-results.component').then((m) => m.BuscaResultsComponent),
    data: { awaitContent: true },
  },

  { path: '**', component: NotFoundComponent },

];
