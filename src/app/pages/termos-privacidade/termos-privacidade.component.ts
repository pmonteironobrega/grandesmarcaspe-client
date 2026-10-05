import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-termos-privacidade',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './termos-privacidade.component.html',
  styleUrl: './termos-privacidade.component.scss',
})
export class TermosPrivacidadeComponent {
  readonly configPage = [
    {
      page: 'Política de Privacidade e Termo de Uso',
      router: '/termos-privacidade',
    },
  ];
}
