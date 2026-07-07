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

import { authGuard } from './core/guards/auth.guard';



export const routes: Routes = [

  { path: '', component: HomeComponent, data: { awaitContent: true } },

  {
    path: 'r/:clienteSlug/:cidadeSlug/:bairroSlug/:uf',
    component: ClienteDetailComponent,
    data: { awaitContent: true },
  },

  { path: 'c/:categoriaSlug/:a', component: CategoriaListComponent, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b', component: CategoriaListComponent, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b/:c', component: CategoriaListComponent, data: { awaitContent: true } },
  { path: 'c/:categoriaSlug/:a/:b/:c/:d', component: CategoriaListComponent, data: { awaitContent: true } },

  { path: 'sobre', component: SobreComponent },

  { path: 'anuncie', component: AnunciePageComponent },

  { path: 'termos-privacidade', component: TermosPrivacidadeComponent },

  { path: 'fale-conosco', component: FaleConoscoPageComponent },

  { path: 'login', component: LoginPageComponent, data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'cadastro', component: CadastroPageComponent, data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'auth/callback', component: AuthCallbackComponent, data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'perfil', component: PerfilPageComponent, canActivate: [authGuard], data: { awaitContent: true, transitionLayout: 'form' } },

  { path: 'busca', component: BuscaResultsComponent, data: { awaitContent: true } },

];


