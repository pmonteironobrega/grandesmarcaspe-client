import { BuscaFilters, BuscaParams } from '../models/paginated-response.model';



export interface BuscaRoute {

  commands: string[];

  queryParams: Record<string, string>;

}



export function buildBuscaRoute(params: BuscaParams, page = 1): BuscaRoute {

  const queryParams: Record<string, string> = {

    q: params.q.trim(),

    uf: params.uf.toLowerCase(),

  };



  if (params.categoria) {

    queryParams['categoria'] = params.categoria;

  }

  if (params.cidade) {

    queryParams['cidade'] = params.cidade;

  }

  if (params.bairro) {

    queryParams['bairro'] = params.bairro;

  }

  if (page >= 2) {

    queryParams['page'] = String(page);

  }



  return { commands: ['/busca'], queryParams };

}



export function buildBuscaUrl(params: BuscaParams, page = 1): string {

  const { commands, queryParams } = buildBuscaRoute(params, page);

  const path = commands.join('/');

  const query = new URLSearchParams(queryParams).toString();

  return query ? `${path}?${query}` : path;

}



export function parseBuscaParamsFromQuery(

  queryParams: Record<string, string | undefined>,

): BuscaParams | null {

  const q = queryParams['q']?.trim() ?? '';

  const uf = queryParams['uf']?.trim().toLowerCase() ?? '';



  if (q.length < 2 || !uf) {

    return null;

  }



  const pageParam = queryParams['page'];

  const page = Number(pageParam);

  const resolvedPage = Number.isInteger(page) && page >= 2 ? page : 1;



  return {

    q,

    uf,

    categoria: queryParams['categoria']?.trim() || null,

    cidade: queryParams['cidade']?.trim() || null,

    bairro: queryParams['bairro']?.trim() || null,

    page: resolvedPage,

  };

}



export function buildBuscaRouteFromFilters(filters: BuscaFilters, page = 1): BuscaRoute {

  return buildBuscaRoute(

    {

      q: filters.q,

      uf: filters.uf,

      categoria: filters.categoria,

      cidade: filters.cidade,

      bairro: filters.bairro,

    },

    page,

  );

}


