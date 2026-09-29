import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, RESPONSE_INIT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { SITE_TITLE_BRAND } from '../utils/cliente-page-title';

export const DEFAULT_PAGE_TITLE = 'Grandes Marcas PE';
export const DEFAULT_DESCRIPTION =
  'Encontre os melhores estabelecimentos de Pernambuco no Grandes Marcas PE.';

const JSON_LD_SCRIPT_ID = 'gmpe-jsonld';
const NOT_FOUND_TITLE = `Página não encontrada | ${SITE_TITLE_BRAND}`;
const NOINDEX_PATH_PREFIXES = ['/busca', '/login', '/cadastro', '/perfil', '/auth'];

const OG_PROPERTIES = [
  'og:title',
  'og:description',
  'og:url',
  'og:type',
  'og:image',
  'og:locale',
  'og:site_name',
];
const TWITTER_NAMES = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export interface PageSeo {
  title: string;
  description: string;
  canonicalUrl: string | null;
  robots?: string;
  imageUrl?: string | null;
  jsonLd?: JsonLd | null;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });

  /** Called on every NavigationStart so pages only need to override what they know. */
  resetForUrl(url: string): void {
    const path = url.split(/[?#]/)[0] || '/';
    const indexable = !NOINDEX_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

    this.title.setTitle(DEFAULT_PAGE_TITLE);
    this.meta.updateTag({ name: 'description', content: DEFAULT_DESCRIPTION });
    this.removeSocialTags();
    this.setJsonLd(null);

    if (indexable) {
      this.meta.removeTag("name='robots'");
      this.setCanonical(`${normalizeSiteUrl(environment.siteUrl)}${path}`);
    } else {
      this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
      this.setCanonical(null);
    }
  }

  apply(page: PageSeo): void {
    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'robots', content: page.robots ?? 'index, follow' });
    this.setCanonical(page.canonicalUrl);

    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
    this.meta.updateTag({ property: 'og:site_name', content: DEFAULT_PAGE_TITLE });
    if (page.canonicalUrl) {
      this.meta.updateTag({ property: 'og:url', content: page.canonicalUrl });
    }

    this.meta.updateTag({
      name: 'twitter:card',
      content: page.imageUrl ? 'summary_large_image' : 'summary',
    });
    this.meta.updateTag({ name: 'twitter:title', content: page.title });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    if (page.imageUrl) {
      this.meta.updateTag({ property: 'og:image', content: page.imageUrl });
      this.meta.updateTag({ name: 'twitter:image', content: page.imageUrl });
    }

    this.setJsonLd(page.jsonLd ?? null);
  }

  markNotFound(): void {
    this.markUnindexable(404, NOT_FOUND_TITLE);
  }

  /** 4xx from the API means the URL does not exist; anything else is a transient failure. */
  markError(error: unknown): void {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status >= 400 && status < 500) {
      this.markNotFound();
      return;
    }
    this.markUnindexable(503, DEFAULT_PAGE_TITLE);
  }

  private markUnindexable(status: number, title: string): void {
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
    this.setCanonical(null);
    this.removeSocialTags();
    this.setJsonLd(null);

    if (this.responseInit) {
      this.responseInit.status = status;
    }
  }

  private setCanonical(url: string | null): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!url) {
      link?.remove();
      return;
    }

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: JsonLd | null): void {
    this.document.getElementById(JSON_LD_SCRIPT_ID)?.remove();
    if (!data) {
      return;
    }

    const script = this.document.createElement('script');
    script.id = JSON_LD_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.text = serializeJsonLd(data);
    this.document.head.appendChild(script);
  }

  private removeSocialTags(): void {
    OG_PROPERTIES.forEach((property) => this.meta.removeTag(`property='${property}'`));
    TWITTER_NAMES.forEach((name) => this.meta.removeTag(`name='${name}'`));
  }
}

/**
 * SSR serializes <script> contents verbatim, so a value containing `</script>` or `<!--`
 * would break out of the tag. Unicode-escaping <, >, & keeps the JSON equivalent.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/$/, '');
}
