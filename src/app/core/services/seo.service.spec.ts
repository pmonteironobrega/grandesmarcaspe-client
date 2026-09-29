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

  it('should set 503 for API failures so crawlers retry', () => {
    service.markError(new HttpErrorResponse({ status: 0 }));

    expect(responseInit.status).toBe(503);
  });
});
