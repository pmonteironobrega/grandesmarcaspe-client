import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { buildClienteSeoPayload } from '../../core/utils/cliente-seo';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { ClienteDetail } from '../../core/models/cliente-detail.model';
import { ClienteListItem } from '../../core/models/cliente-list-item.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';
import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';
import { ShareComponent } from '../../shared/components/share/share.component';
import { EmpreendimentoCardComponent } from '../../shared/components/empreendimento-card/empreendimento-card.component';
import { AvaliacoesSectionComponent } from '../../shared/components/avaliacoes-section/avaliacoes-section.component';
import { ComentariosSectionComponent } from '../../shared/components/comentarios-section/comentarios-section.component';
import {
  ClienteGaleriaCarouselComponent,
  GaleriaSlide,
} from '../../shared/components/cliente-galeria-carousel/cliente-galeria-carousel.component';
import { StarRatingInlineComponent } from '../../shared/components/star-rating-inline/star-rating-inline.component';
import { ClienteMapaComponent } from '../../shared/components/cliente-mapa/cliente-mapa.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  buildClienteDefaultImagePath,
  buildClienteMarcaPath,
  resolveClienteImageUrl,
} from '../../core/utils/catalog-url';
import { buildClienteListagemLinks } from '../../core/utils/cliente-listagem-links';
import { buildSocialLinks } from '../../core/utils/social-links';
import {
  buildTelUrl,
  buildWhatsappUrl,
  formatTelefoneDisplay,
  isCelular,
} from '../../core/utils/telefone';
import { environment } from '../../../environments/environment';

const RELACIONADOS_LIMIT = 6;


@Component({

  selector: 'app-cliente-detail',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    RouterLink,

    BreadcrumbComponent,

    CategoriasPopularesComponent,

    AnuncieBannerComponent,

    ShareComponent,

    ClienteGaleriaCarouselComponent,

    EmpreendimentoCardComponent,
    AvaliacoesSectionComponent,
    ComentariosSectionComponent,
    StarRatingInlineComponent,
    ClienteMapaComponent,
    AdSlotComponent,
  ],
  templateUrl: './cliente-detail.component.html',

  styleUrl: './cliente-detail.component.scss',

})

export class ClienteDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private routeTransition = inject(RouteTransitionService);
  private seo = inject(SeoService);

  cliente = signal<ClienteDetail | null>(null);

  relacionados = signal<ClienteListItem[]>([]);

  loading = signal(true);

  error = signal(false);

  breadcrumb = signal<{ page: string; router: string }[]>([]);

  readonly galeriaSlides = computed(() => this.buildGaleriaSlides(this.cliente()));

  readonly listagemLinks = computed(() => {
    const detail = this.cliente();
    return detail ? buildClienteListagemLinks(detail) : { uf: null, cidade: null, bairro: null };
  });

  readonly vejaTambem = computed(() => {
    const { bairro, cidade, uf } = this.listagemLinks();
    return [bairro, cidade, uf].filter((link) => link !== null);
  });

  readonly buildSocialLinks = buildSocialLinks;
  readonly isCelular = isCelular;
  readonly formatTelefone = formatTelefoneDisplay;
  readonly whatsappUrl = buildWhatsappUrl;
  readonly telUrl = buildTelUrl;
  readonly assetsBaseUrl = environment.assetsBaseUrl;
  readonly adSlots = ADSENSE_SLOTS;

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      const clienteSlug = params.get('clienteSlug') ?? '';

      const cidadeSlug = params.get('cidadeSlug') ?? '';

      const bairroSlug = params.get('bairroSlug');

      const uf = params.get('uf') ?? '';



      this.loading.set(true);

      this.error.set(false);



      this.catalogService.getClienteDetail(clienteSlug, cidadeSlug, bairroSlug, uf).subscribe({

        next: (detail) => {

          this.cliente.set(detail);
          this.seo.apply(
            buildClienteSeoPayload(
              { siteUrl: environment.siteUrl, assetsBaseUrl: environment.assetsBaseUrl },
              detail,
            ),
          );

          this.breadcrumb.set(this.buildBreadcrumb(detail));

          this.loadRelacionados(detail);

          this.loading.set(false);
          this.routeTransition.releaseContent();

        },

        error: (err: unknown) => {

          this.error.set(true);
          this.seo.markError(err);

          this.loading.set(false);
          this.routeTransition.releaseContent();

        },

      });

    });

  }

  formatEndereco(cliente: ClienteDetail): string {
    const end = cliente.endereco;

    const cidade = end.cidade?.nome ?? '';

    const bairro = end.bairro?.nome ?? '';

    const uf = end.uf?.sigla ?? '';

    const complemento = end.complemento ? ` - ${end.complemento}` : '';

    const local = [bairro, `${cidade}/${uf}`].filter(Boolean).join(' - ');

    return `${end.logradouro}, ${end.numero}${complemento} - ${local} CEP: ${end.cep}`;

  }

  /** Endereço otimizado para geocoding (Nominatim / Google Maps). */
  formatEnderecoMapa(cliente: ClienteDetail): string {
    const end = cliente.endereco;
    const parts = [
      end.logradouro,
      end.numero,
      end.bairro?.nome,
      end.cidade?.nome,
      end.uf?.sigla,
      end.cep ? `CEP ${end.cep}` : null,
      'Brasil',
    ].filter((part): part is string => !!part && part.trim().length > 0);

    return parts.join(', ');
  }



  private buildBreadcrumb(detail: ClienteDetail): { page: string; router: string }[] {
    const { uf, cidade } = buildClienteListagemLinks(detail);
    const crumbs = [uf, cidade]
      .filter((link) => link !== null)
      .map((link) => ({ page: link.page, router: link.url }));

    crumbs.push({ page: detail.nome, router: '' });
    return crumbs;
  }



  googleMapsUrl(detail: ClienteDetail): string {
    const end = detail.endereco;
    if (
      typeof end?.latitude === 'number' &&
      typeof end?.longitude === 'number' &&
      !Number.isNaN(end.latitude) &&
      !Number.isNaN(end.longitude)
    ) {
      return `https://www.google.com/maps/search/?api=1&query=${end.latitude},${end.longitude}`;
    }
    const query = encodeURIComponent(this.formatEnderecoMapa(detail));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }



  private buildGaleriaSlides(detail: ClienteDetail | null): GaleriaSlide[] {
    if (!detail) {
      return [];
    }

    if (detail.imagens?.length) {
      return detail.imagens.map((img, index) => ({
        id: String(img.id),
        url: this.resolveGaleriaImageUrl(detail.id, img.caminho, index),
        alt: `${detail.nome} - foto ${index + 1}`,
      }));
    }

    return [
      {
        id: 'default',
        url: buildClienteDefaultImagePath(),
        alt: detail.nome,
      },
    ];
  }

  private resolveGaleriaImageUrl(
    clienteId: number,
    caminho: string | null | undefined,
    index: number,
  ): string {
    const normalized = (caminho ?? '').replace(/^\/+/, '').toLowerCase();
    if (normalized && normalized !== 'nologo.png' && !normalized.endsWith('/nologo.png')) {
      return resolveClienteImageUrl(clienteId, caminho);
    }
    if (index === 0) {
      return buildClienteDefaultImagePath();
    }
    return `/clientes/${clienteId}/galeria${index}.jpg`;
  }



  /** Same categoria in the same cidade first, topped up with the rest of the UF. */
  private loadRelacionados(detail: ClienteDetail): void {
    const { uf, cidade } = buildClienteListagemLinks(detail);
    if (!uf) {
      return;
    }

    const fetchItems = (url: string) =>
      this.catalogService.getClientesByLegacyPath(url).pipe(
        map((response) => response.data),
        catchError(() => of<ClienteListItem[]>([])),
      );

    forkJoin([cidade ? fetchItems(cidade.url) : of<ClienteListItem[]>([]), fetchItems(uf.url)])
      .subscribe(([daCidade, daUf]) => {
        const seen = new Set<number>([detail.id]);
        const merged = [...daCidade, ...daUf].filter((item) => {
          if (seen.has(item.id) || item.slug === detail.slug) {
            return false;
          }
          seen.add(item.id);
          return true;
        });
        this.relacionados.set(merged.slice(0, RELACIONADOS_LIMIT));
      });
  }

}


