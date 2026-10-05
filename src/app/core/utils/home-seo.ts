import type { PageSeo } from '../services/seo.service';
import { SITE_TITLE_BRAND } from './cliente-page-title';

export const HOME_TITLE = `${SITE_TITLE_BRAND} | Guia de Empresas e Profissionais de Pernambuco`;
export const HOME_DESCRIPTION =
  'Há 17 anos conectando pessoas a empresas de Pernambuco. Encontre endereços, telefones, mapa e avaliações de restaurantes, farmácias, clínicas e mais.';

export function buildHomeSeo(siteUrl: string): PageSeo {
  const base = siteUrl.replace(/\/$/, '');
  const home = `${base}/`;

  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonicalUrl: home,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${home}#website`,
        name: SITE_TITLE_BRAND,
        alternateName: ['Grandes Marcas PE', 'GrandesMarcasPE.com.br'],
        url: home,
        inLanguage: 'pt-BR',
        publisher: { '@id': `${home}#organization` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${home}#organization`,
        name: SITE_TITLE_BRAND,
        url: home,
        logo: `${base}/apple-touch-icon.png`,
        areaServed: { '@type': 'State', name: 'Pernambuco' },
      },
    ],
  };
}
