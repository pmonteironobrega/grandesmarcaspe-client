import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Configuração específica para o ambiente de servidor (SSR).
 * 
 * Observação:
 * - APIs como `withDebugConsole`, `withNoHttpTransferCache` e `provideServerHttpClient`
 *   não existem na versão atual do `@angular/ssr` / `@angular/common/http`.
 * - O Angular já configura o HttpClient corretamente no servidor a partir do
 *   `appConfig` compartilhado.
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      withRoutes(serverRoutes),
    ),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
