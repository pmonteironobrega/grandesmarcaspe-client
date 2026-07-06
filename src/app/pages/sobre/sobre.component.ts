import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, AnuncieBannerComponent],
  templateUrl: './sobre.component.html',
  styleUrl: './sobre.component.scss',
})
export class SobreComponent {
  readonly configPage = [
    {
      page: 'Sobre',
      router: '/sobre',
    },
  ];
}
