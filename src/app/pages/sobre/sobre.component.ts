import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';
import { SeoService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent, AnuncieBannerComponent],
  templateUrl: './sobre.component.html',
  styleUrl: './sobre.component.scss',
})
export class SobreComponent implements OnInit {
  private seo = inject(SeoService);

  readonly configPage = [
    {
      page: 'Quem Somos',
      router: '/sobre',
    },
  ];

  ngOnInit(): void {
    this.seo.apply({
      title: 'Quem Somos | GrandesMarcasPE',
      description:
        'Há 17 anos o GrandesMarcasPE.com.br conecta pessoas a empresas e profissionais, com endereços, telefones, localização, avaliações e comentários.',
      canonicalUrl: `${environment.siteUrl.replace(/\/$/, '')}/sobre`,
    });
  }
}
