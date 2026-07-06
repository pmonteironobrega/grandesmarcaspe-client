import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Comentario,
  CreateComentarioPayload,
  CreateComentarioResponse,
} from '../models/comentario.model';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  list(clienteId: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(
      this.buildUrl(`clientes/${clienteId}/comentarios`),
    );
  }

  create(clienteId: number, payload: CreateComentarioPayload): Observable<CreateComentarioResponse> {
    return this.http.post<CreateComentarioResponse>(
      this.buildUrl(`clientes/${clienteId}/comentarios`),
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
