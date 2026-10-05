import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';

import { CategoriaListComponent } from './pages/categoria-list/categoria-list.component';

import { ClienteDetailComponent } from './pages/cliente-detail/cliente-detail.component';

import { SobreComponent } from './pages/sobre/sobre.component';

import { AnunciePageComponent } from './pages/anuncie/anuncie-page.component';

import { TermosPrivacidadeComponent } from './pages/termos-privacidade/termos-privacidade.component';

import { FaleConoscoPageComponent } from './pages/fale-conosco/fale-conosco.component';

import { BuscaResultsComponent } from './pages/busca-results/busca-results.component';

import { LoginPageComponent } from './pages/login/login-page.component';

import { CadastroPageComponent } from './pages/cadastro/cadastro-page.component';

import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';

import { PerfilPageComponent } from './pages/perfil/perfil-page.component';

import { NotFoundComponent } from './pages/not-found/not-found.component';

import { authGuard } from './core/guards/auth.guard';

import { HOME_TITLE } from './core/utils/home-seo';



export const routes: Routes = [

  {
    path: '',
    component: HomeComponent,
    title: HOME_TITLE,
    data: { awaitContent: true },
  },

  {
    path: 'r/:clienteSlug/:cidadeSlug/:bairroSlug/:uf',
    component: ClienteDetailComponent,
    data: { awaitContent: true },
  },

  {
    path: 'r/:clienteSlug/:cidadeSlug/:uf',
    component: ClienteDetailComponent,
    data: { awaitContent: true },
  },

  { path: 'c/:categoriaSlug/:a', component: CategoriaListComponent, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b', component: CategoriaListComponent, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b/:c', component: CategoriaListComponent, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b/:c/:d', component: CategoriaListComponent, data: { awaitContent: true } },

  { path: 'sobre', component: SobreComponent, title: 'Quem Somos | GrandesMarcasPE' },

  { path: 'anuncie', component: AnunciePageComponent, title: 'Anuncie seu negócio | GrandesMarcasPE' },

  { path: 'termos-privacidade', component: TermosPrivacidadeComponent, title: 'Termos e Privacidade | GrandesMarcasPE' },

  { path: 'fale-conosco', component: FaleConoscoPageComponent, title: 'Fale Conosco | GrandesMarcasPE' },

  { path: 'login', component: LoginPageComponent, data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'cadastro', component: CadastroPageComponent, data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'auth/callback', component: AuthCallbackComponent, data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'perfil', component: PerfilPageComponent, canActivate: [authGuard], data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'busca', component: BuscaResultsComponent, data: { awaitContent: true } },

  { path: '**', component: NotFoundComponent },

];


