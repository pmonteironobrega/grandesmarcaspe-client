import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvaliacaoResumo,
  CreateAvaliacaoPayload,
  CreateAvaliacaoResponse,
  PaginatedAvaliacoes,
} from '../models/avaliacao.model';

@Injectable({
  providedIn: 'root',
})
export class AvaliacaoService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  getResumo(clienteId: number): Observable<AvaliacaoResumo> {
    return this.http.get<AvaliacaoResumo>(
      this.buildUrl(`clientes/${clienteId}/avaliacoes/resumo`),
    );
  }

  list(clienteId: number, page = 1): Observable<PaginatedAvaliacoes> {
    return this.http.get<PaginatedAvaliacoes>(
      this.buildUrl(`clientes/${clienteId}/avaliacoes?page=${page}`),
    );
  }

  create(clienteId: number, payload: CreateAvaliacaoPayload): Observable<CreateAvaliacaoResponse> {
    return this.http.post<CreateAvaliacaoResponse>(
      this.buildUrl(`clientes/${clienteId}/avaliacoes`),
      payload,
    );
  }

  private buildUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (isPlatformBrowser(this.platformId)) {
      return normalized;
    }
    return `${environment.apiUrl}${normalized}`;
  }
}
