import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { DEFAULT_PAGE_TITLE, SeoService, serializeJsonLd } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let document: Document;
  let responseInit: { status?: number };

  const canonical = (): string | null =>
    document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
  const robots = (): string | null =>
    document.head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;
  const jsonLd = (): string | null => document.getElementById('gmpe-jsonld')?.textContent ?? null;

  beforeEach(() => {
    responseInit = {};
    TestBed.configureTestingModule({
      providers: [{ provide: RESPONSE_INIT, useValue: responseInit }],
    });
    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
    service.resetForUrl('/');
  });

  it('should render canonical as <link>, not <meta>', () => {
    service.apply({
      title: 'Titulo',
      description: 'Descricao',
      canonicalUrl: 'https://www.example.com.br/c/academias/pe',
      jsonLd: { '@type': 'ItemList' },
    });

    expect(canonical()).toBe('https://www.example.com.br/c/academias/pe');
    expect(document.head.querySelector('meta[rel="canonical"]')).toBeNull();
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(robots()).toBe('index, follow');
    expect(jsonLd()).toContain('ItemList');
    expect(TestBed.inject(Title).getTitle()).toBe('Titulo');
  });

  it('should preload the detail image and drop it on navigation', () => {
    service.setLcpImage('/clientes/1/marca.jpg');

    const link = document.head.querySelector('link[data-gmpe-lcp="image"]');
    expect(link?.getAttribute('rel')).toBe('preload');
    expect(link?.getAttribute('as')).toBe('image');
    expect(link?.getAttribute('fetchpriority')).toBe('high');
    expect(link?.getAttribute('href')).toBe('/clientes/1/marca.jpg');

    service.resetForUrl('/c/academias/pe');

    expect(document.head.querySelector('link[data-gmpe-lcp="image"]')).toBeNull();
  });

  it('should fall back to the default share image', () => {
    service.apply({ title: 'T', description: 'D', canonicalUrl: null });

    const image = document.head.querySelector('meta[property="og:image"]')?.getAttribute('content');
    expect(image).toBe(`${environment.siteUrl.replace(/\/$/, '')}/img/og-image.png`);
  });

  it('should reset to path canonical without query on navigation', () => {
    service.apply({ title: 'X', description: 'Y', canonicalUrl: 'https://x/y', jsonLd: {} });
    service.resetForUrl('/sobre?utm_source=teste');

    expect(canonical()).toBe(`${environment.siteUrl.replace(/\/$/, '')}/sobre`);
    expect(robots()).toBeNull();
    expect(jsonLd()).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe(DEFAULT_PAGE_TITLE);
  });

  it('should noindex search and account pages', () => {
    service.resetForUrl('/busca?q=padaria&uf=pe');

    expect(robots()).toBe('noindex, follow');
    expect(canonical()).toBeNull();
  });

  it('should 301 to the listing that exists', () => {
    const headers = new Headers();
    const init = { status: 200, headers };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: RESPONSE_INIT, useValue: init }],
    });

    const redirected = TestBed.inject(SeoService);
    redirected.apply({
      title: 'Página 15',
      description: 'Listagem',
      canonicalUrl: 'https://www.example.com.br/c/supermercados/vitoria-de-santo-antao/pe?page=15',
      robots: 'index, follow',
    });
    const didRedirect = redirected.redirectPermanently(
      '/c/supermercados/vitoria-de-santo-antao/pe',
    );
    const redirectedRobots = TestBed.inject(DOCUMENT)
      .head.querySelector('meta[name="robots"]')
      ?.getAttribute('content');

    expect(didRedirect).toBe(true);
    expect(init.status).toBe(301);
    expect(headers.get('Location')).toBe('/c/supermercados/vitoria-de-santo-antao/pe');
    expect(redirectedRobots).toBe('index, follow');
  });

  it('should set 404 status and noindex for API 404', () => {
    service.markError(new HttpErrorResponse({ status: 404 }));

    expect(responseInit.status).toBe(404);
    expect(robots()).toBe('noindex, follow');
    expect(canonical()).toBeNull();
  });

  it('should not allow JSON-LD values to close the script tag', () => {
    const payload = { name: '</script><script>alert(1)</script> & <!-- x' };
    const serialized = serializeJsonLd(payload);

    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(JSON.parse(serialized)).toEqual(payload);
  });

  it('should set 503 for API failures so crawlers retry without dropping the URL', () => {
    service.apply({
      title: 'Farmácias em Pernambuco - Página 2',
      description: 'Listagem',
      canonicalUrl: 'https://www.example.com.br/c/farmacias-e-drogarias/pe?page=2',
      robots: 'index, follow',
    });

    service.markError(new HttpErrorResponse({ status: 0 }));

    expect(responseInit.status).toBe(503);
    expect(robots()).toBe('index, follow');
    expect(canonical()).toBeNull();
  });

  it('should keep the page indexable on transient API failures in the browser', () => {
    TestBed.resetTestingModule();
    const browserService = TestBed.inject(SeoService);
    browserService.apply({ title: 'T', description: 'D', canonicalUrl: 'https://x/y' });

    browserService.markError(new HttpErrorResponse({ status: 0 }));

    expect(robots()).toBe('index, follow');
  });
});
