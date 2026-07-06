import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { CategoriasPopularesComponent } from '../../shared/components/categorias-populares/categorias-populares.component';

@Component({
  selector: 'app-anuncie-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, CategoriasPopularesComponent],
  templateUrl: './anuncie-page.component.html',
  styleUrl: './anuncie-page.component.scss',
})
export class AnunciePageComponent {
  readonly configPage = [
    {
      page: 'Anuncie',
      router: '/anuncie',
    },
  ];
}
