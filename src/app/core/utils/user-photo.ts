import { environment } from '../../../environments/environment';

export function resolveUserPhotoUrl(caminho: string | null | undefined): string | null {
  if (!caminho) {
    return null;
  }

  if (caminho.startsWith('http://') || caminho.startsWith('https://')) {
    return caminho;
  }

  const normalized = caminho.startsWith('/') ? caminho : `/${caminho}`;
  return `${environment.assetsBaseUrl}${normalized}`;
}
