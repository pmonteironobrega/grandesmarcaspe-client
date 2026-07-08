import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { AppScrollService } from '../../core/services/app-scroll.service';
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
import {
  buildClienteDefaultImagePath,
  buildListUrlFromFilters,
  buildClienteMarcaPath,
  resolveClienteImageUrl,
} from '../../core/utils/catalog-url';
import { buildClientePageTitle } from '../../core/utils/cliente-page-title';
import { buildSocialLinks } from '../../core/utils/social-links';
import {
  buildTelUrl,
  buildWhatsappUrl,
  formatTelefoneDisplay,
  isCelular,
} from '../../core/utils/telefone';
import { environment } from '../../../environments/environment';


@Component({

  selector: 'app-cliente-detail',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    BreadcrumbComponent,

    CategoriasPopularesComponent,

    AnuncieBannerComponent,

    ShareComponent,

    ClienteGaleriaCarouselComponent,

    EmpreendimentoCardComponent,
    AvaliacoesSectionComponent,
    ComentariosSectionComponent,
    StarRatingInlineComponent,
  ],
  templateUrl: './cliente-detail.component.html',

  styleUrl: './cliente-detail.component.scss',

})

export class ClienteDetailComponent implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private routeTransition = inject(RouteTransitionService);
  private appScroll = inject(AppScrollService);
  private title = inject(Title);
  private injector = inject(Injector);
  private readonly defaultPageTitle = 'Grandes Marcas PE';

  @ViewChild('clienteNome') clienteNome?: ElementRef<HTMLElement>;

  cliente = signal<ClienteDetail | null>(null);

  relacionados = signal<ClienteListItem[]>([]);

  loading = signal(true);

  error = signal(false);

  breadcrumb = signal<{ page: string; router: string }[]>([]);

  readonly galeriaSlides = computed(() => this.buildGaleriaSlides(this.cliente()));

  readonly buildSocialLinks = buildSocialLinks;
  readonly isCelular = isCelular;
  readonly formatTelefone = formatTelefoneDisplay;
  readonly whatsappUrl = buildWhatsappUrl;
  readonly telUrl = buildTelUrl;
  readonly assetsBaseUrl = environment.assetsBaseUrl;

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      const clienteSlug = params.get('clienteSlug') ?? '';

      const cidadeSlug = params.get('cidadeSlug') ?? '';

      const bairroSlug = params.get('bairroSlug') ?? '';

      const uf = params.get('uf') ?? '';



      this.loading.set(true);

      this.error.set(false);



      this.catalogService.getClienteDetail(clienteSlug, cidadeSlug, bairroSlug, uf).subscribe({

        next: (detail) => {

          this.cliente.set(detail);
          this.title.setTitle(buildClientePageTitle(detail));

          this.breadcrumb.set(this.buildBreadcrumb(detail));

          this.loadRelacionados(detail);

          this.loading.set(false);
          this.routeTransition.releaseContent();
          this.scheduleScrollToName();

        },

        error: () => {

          this.error.set(true);
          this.title.setTitle(this.defaultPageTitle);

          this.loading.set(false);
          this.routeTransition.releaseContent();

        },

      });

    });

  }

  ngOnDestroy(): void {
    this.title.setTitle(this.defaultPageTitle);
  }



  formatEndereco(cliente: ClienteDetail): string {
    const end = cliente.endereco;

    const cidade = end.cidade?.nome ?? '';

    const bairro = end.bairro?.nome ?? '';

    const uf = end.uf?.sigla ?? '';

    const complemento = end.complemento ? ` - ${end.complemento}` : '';

    return `${end.logradouro}, ${end.numero}${complemento} - ${bairro} - ${cidade}/${uf} CEP: ${end.cep}`;

  }



  private buildBreadcrumb(detail: ClienteDetail): { page: string; router: string }[] {
    const crumbs: { page: string; router: string }[] = [];



    if (detail.categoria && detail.endereco?.uf?.sigla) {

      crumbs.push({

        page: detail.categoria.nome,

        router: buildListUrlFromFilters({

          categoria: detail.categoria.slug,

          uf: detail.endereco.uf.sigla.toLowerCase(),

          cidade: null,

          bairro: null,

        }),

      });

    }



    crumbs.push({ page: detail.nome, router: '' });

    return crumbs;

  }



  googleMapsUrl(detail: ClienteDetail): string {
    const query = encodeURIComponent(this.formatEndereco(detail));
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



  private getScrollNameOffset(): number {
    const breadcrumb = document.querySelector(
      '.section-breadcrumb--sticky',
    ) as HTMLElement | null;
    return (breadcrumb?.offsetHeight ?? 0) + 16;
  }

  private scheduleScrollToName(): void {
    afterNextRender(
      () => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const el = this.clienteNome?.nativeElement;
            if (el) {
              this.appScroll.scrollToElement(el, this.getScrollNameOffset());
            }
          }, 250);
        });
      },
      { injector: this.injector },
    );
  }

  private loadRelacionados(detail: ClienteDetail): void {

    const categoriaSlug = detail.categoria?.slug;

    const uf = detail.endereco?.uf?.sigla?.toLowerCase();



    if (!categoriaSlug || !uf) {

      return;

    }



    this.catalogService.getClientesByLegacyPath(`c/${categoriaSlug}/${uf}`).subscribe({

      next: (response) => {

        const filtered = response.data.filter((item) => item.slug !== detail.slug).slice(0, 3);

        this.relacionados.set(filtered);

      },

    });

  }

}


