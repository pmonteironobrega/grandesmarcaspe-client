import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, RESPONSE_INIT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { SITE_TITLE_BRAND } from '../utils/cliente-page-title';

export const DEFAULT_PAGE_TITLE = 'Grandes Marcas PE';
export const DEFAULT_DESCRIPTION =
  'Encontre os melhores estabelecimentos de Pernambuco no Grandes Marcas PE.';
/** 1200×630 PNG: social networks do not render SVG previews. */
export const DEFAULT_SHARE_IMAGE_PATH = '/img/og-image.png';

const JSON_LD_SCRIPT_ID = 'gmpe-jsonld';
const LCP_LINK_SELECTOR = 'link[data-gmpe-lcp="image"]';
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
    this.setLcpImage(null);

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

    const imageUrl =
      page.imageUrl ?? `${normalizeSiteUrl(environment.siteUrl)}${DEFAULT_SHARE_IMAGE_PATH}`;
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: page.title });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });

    this.setJsonLd(page.jsonLd ?? null);
  }

  /**
   * Preloads the image the detail page paints first. The href must be the same
   * URL as the gallery `<img>`, which is a site path and not the og:image host.
   */
  setLcpImage(url: string | null): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>(LCP_LINK_SELECTOR);

    if (!url) {
      existing?.remove();
      return;
    }

    const link = existing ?? this.document.createElement('link');
    link.setAttribute('rel', 'preload');
    link.setAttribute('as', 'image');
    link.setAttribute('fetchpriority', 'high');
    link.setAttribute('data-gmpe-lcp', 'image');
    link.setAttribute('href', url);

    if (!existing) {
      const before = head.querySelector('link[rel="stylesheet"], style');
      if (before) {
        head.insertBefore(link, before);
      } else {
        head.appendChild(link);
      }
    }
  }

  markNotFound(): void {
    this.markUnindexable(404, NOT_FOUND_TITLE);
  }

  /**
   * Permanent redirect to a URL that exists. Used when a paginated URL is past the last page,
   * so crawlers consolidate on the real listing instead of following a redirect into a 404.
   * The body must not say noindex: Google then drops the URL instead of following Location.
   * Returns false in the browser, where there is no response status to set.
   */
  redirectPermanently(location: string): boolean {
    this.setCanonical(null);
    this.removeSocialTags();
    this.setJsonLd(null);

    const headers = this.responseInit?.headers;
    if (!this.responseInit || !(headers instanceof Headers)) {
      return false;
    }

    this.responseInit.status = 301;
    headers.set('Location', location);
    return true;
  }

  /**
   * 4xx from the API means the URL does not exist; anything else is a transient failure.
   * Transient failures become 503 without noindex. noindex makes Google drop the URL
   * ("Excluded by noindex") instead of retrying the same address.
   * In the browser there is no status to set, and a flaky request must not change robots.
   */
  markError(error: unknown): void {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status >= 400 && status < 500) {
      this.markNotFound();
      return;
    }
    if (!this.responseInit) {
      return;
    }

    this.responseInit.status = 503;
    this.setCanonical(null);
    this.removeSocialTags();
    this.setJsonLd(null);
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
