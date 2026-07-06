import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { AnuncieBannerComponent } from '../../shared/components/anuncie-banner/anuncie-banner.component';
import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';

@Component({
  selector: 'app-fale-conosco',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, AnuncieBannerComponent, CategoriasPopularesComponent],
  templateUrl: './fale-conosco.component.html',
  styleUrl: './fale-conosco.component.scss',
})
export class FaleConoscoPageComponent {
  readonly configPage = [
    {
      page: 'Fale Conosco',
      router: '/fale-conosco',
    },
  ];
}
