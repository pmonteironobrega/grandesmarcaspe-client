import { Component, Input } from '@angular/core';

import { RouterLink } from '@angular/router';

import { CommonModule } from '@angular/common';

import { ClienteListItem } from '../../../core/models/cliente-list-item.model';
import {
  buildClienteDetailUrlFromListItem,
  nextClienteMarcaFallbackUrl,
  resolveClienteImageUrl,
} from '../../../core/utils/catalog-url';
import { environment } from '../../../../environments/environment';



@Component({

  selector: 'app-empreendimento',

  standalone: true,

  imports: [CommonModule, RouterLink],

  templateUrl: './empreendimento-card.component.html',

  styleUrl: './empreendimento-card.component.scss',

})

export class EmpreendimentoCardComponent {

  @Input({ required: true }) cliente!: ClienteListItem;

  @Input() totalAvaliacoes?: number;

  @Input() telefone?: string | null;



  readonly assetsBaseUrl = environment.assetsBaseUrl;



  detailUrl(): string | null {

    return buildClienteDetailUrlFromListItem(this.cliente);

  }



  imageUrl(): string {

    return resolveClienteImageUrl(
      this.cliente.id,
      this.cliente.imagemPrincipal?.caminho,
    );

  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = nextClienteMarcaFallbackUrl(this.cliente.id, img.src);
    if (img.src.endsWith(fallback) || img.dataset['fallbackApplied'] === 'true') {
      return;
    }
    img.dataset['fallbackApplied'] = 'true';
    img.src = fallback;
  }



  enderecoResumo(): string {

    const end = this.cliente.endereco;

    if (!end) {

      return '';

    }

    const cidade = end.cidade?.nome ?? '';

    const bairro = end.bairro?.nome ?? '';

    const uf = end.uf?.sigla ?? '';

    return `${end.logradouro}, ${end.numero} - ${bairro} - ${cidade}/${uf}${this.telefone ? ` Fone: ${this.telefone}` : ''}`;

  }

}


