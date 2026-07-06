import { isPlatformBrowser } from '@angular/common';

import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { GeographyListOptions } from '../models/geography-list-options.model';

import { Bairro, Cidade, Uf } from '../models/geography.model';



@Injectable({

  providedIn: 'root',

})

export class GeographyService {

  private http = inject(HttpClient);

  private platformId = inject(PLATFORM_ID);



  getUfs(): Observable<Uf[]> {

    return this.http.get<Uf[]>(this.buildUrl('geography/uf'));

  }



  getCidadesByUf(uf: string, options?: GeographyListOptions): Observable<Cidade[]> {

    return this.http.get<Cidade[]>(

      this.buildUrl(`geography/uf/${uf.toLowerCase()}/cidades`),

      { params: this.buildListParams(options) },

    );

  }



  getBairrosByCidade(

    cidadeSlug: string,

    uf: string,

    options?: GeographyListOptions,

  ): Observable<Bairro[]> {

    const params = this.buildListParams(options).set('uf', uf.toLowerCase());



    return this.http.get<Bairro[]>(

      this.buildUrl(`geography/cidades/${cidadeSlug}/bairros`),

      { params },

    );

  }



  private buildListParams(options?: GeographyListOptions): HttpParams {

    let params = new HttpParams();



    if (options?.comClientes) {

      params = params.set('comClientes', 'true');

    }



    if (options?.categoria) {

      params = params.set('categoria', options.categoria);

    }



    return params;

  }



  private buildUrl(path: string): string {

    const normalized = path.startsWith('/') ? path : `/${path}`;

    if (isPlatformBrowser(this.platformId)) {

      return normalized;

    }

    return `${environment.apiUrl}${normalized}`;

  }

}

