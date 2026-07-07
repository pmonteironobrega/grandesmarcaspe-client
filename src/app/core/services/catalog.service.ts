import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../models/categoria.model';
import { ClienteDetail } from '../models/cliente-detail.model';
import { ClienteListItem } from '../models/cliente-list-item.model';
import { BUSCA_PAGE_SIZE } from '../constants/catalog';
import { PaginatedClientes, PaginatedBusca, BuscaParams } from '../models/paginated-response.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  getCategorias(uf: string): Observable<Categoria[]> {
    const params = new URLSearchParams({
      comClientes: 'true',
      uf: uf.toLowerCase(),
    });
    return this.http.get<Categoria[]>(this.buildUrl(`categorias?${params.toString()}`));
  }

  getClientesByLegacyPath(path: string, page = 1): Observable<PaginatedClientes> {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    const query = page >= 2 ? `?page=${page}` : '';
    return this.http.get<PaginatedClientes>(this.buildUrl(`${normalized}${query}`));
  }

  getClienteDetail(
    clienteSlug: string,
    cidadeSlug: string,
    bairroSlug: string,
    uf: string,
  ): Observable<ClienteDetail> {
    return this.http.get<ClienteDetail>(
      this.buildUrl(`r/${clienteSlug}/${cidadeSlug}/${bairroSlug}/${uf.toLowerCase()}`),
    );
  }

  getDestaques(uf: string, limit = 6): Observable<ClienteListItem[]> {
    return this.http.get<ClienteListItem[]>(
      this.buildUrl(`catalog/destaques?uf=${uf.toLowerCase()}&limit=${limit}`),
    );
  }

  getCategoriasPopulares(uf: string, limit = 12): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(
      this.buildUrl(`catalog/categorias-populares?uf=${uf.toLowerCase()}&limit=${limit}`),
    );
  }

  buscar(params: BuscaParams): Observable<PaginatedBusca> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.q.trim());
    searchParams.set('uf', params.uf.toLowerCase());

    if (params.categoria) {
      searchParams.set('categoria', params.categoria);
    }
    if (params.cidade) {
      searchParams.set('cidade', params.cidade);
    }
    if (params.bairro) {
      searchParams.set('bairro', params.bairro);
    }
    const page = params.page ?? 1;
    searchParams.set('perPage', String(BUSCA_PAGE_SIZE));
    if (page >= 2) {
      searchParams.set('page', String(page));
    }

    return this.http.get<PaginatedBusca>(this.buildUrl(`busca?${searchParams.toString()}`));
  }

  private buildUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (isPlatformBrowser(this.platformId)) {
      return normalized;
    }
    return `${environment.apiUrl}${normalized}`;
  }
}
