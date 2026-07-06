import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-termos-privacidade',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './termos-privacidade.component.html',
  styleUrl: './termos-privacidade.component.scss',
})
export class TermosPrivacidadeComponent {
  readonly configPage = [
    {
      page: 'Termos e Privacidade',
      router: '/termos-privacidade',
    },
  ];
}
