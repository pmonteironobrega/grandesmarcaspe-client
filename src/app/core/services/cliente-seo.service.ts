import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ClienteDetail } from '../models/cliente-detail.model';
import {
  buildClienteSeoPayload,
  ClienteSeoContext,
} from '../utils/cliente-seo';

const JSON_LD_SCRIPT_ID = 'gmpe-cliente-jsonld';
const DEFAULT_PAGE_TITLE = 'Grandes Marcas PE';
const DEFAULT_DESCRIPTION =
  'Encontre os melhores estabelecimentos de Pernambuco no Grandes Marcas PE.';

@Injectable({
  providedIn: 'root',
})
export class ClienteSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(detail: ClienteDetail, context: ClienteSeoContext): void {
    const seo = buildClienteSeoPayload(context, detail);

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ rel: 'canonical', href: seo.canonicalUrl });

    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:url', content: seo.canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: seo.imageUrl });
    this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Grandes Marcas PE' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({ name: 'twitter:image', content: seo.imageUrl });

    this.setJsonLd(seo.jsonLd);
  }

  reset(): void {
    this.title.setTitle(DEFAULT_PAGE_TITLE);
    this.meta.updateTag({ name: 'description', content: DEFAULT_DESCRIPTION });
    this.meta.removeTag("name='robots'");
    this.meta.removeTag("rel='canonical'");

    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("property='og:type'");
    this.meta.removeTag("property='og:image'");
    this.meta.removeTag("property='og:locale'");
    this.meta.removeTag("property='og:site_name'");

    this.meta.removeTag("name='twitter:card'");
    this.meta.removeTag("name='twitter:title'");
    this.meta.removeTag("name='twitter:description'");
    this.meta.removeTag("name='twitter:image'");

    this.removeJsonLd();
  }

  private setJsonLd(data: Record<string, unknown>): void {
    this.removeJsonLd();

    const script = this.document.createElement('script');
    script.id = JSON_LD_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(): void {
    const existing = this.document.getElementById(JSON_LD_SCRIPT_ID);
    existing?.remove();
  }
}
