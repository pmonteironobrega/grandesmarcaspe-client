export interface Avaliacao {
  id: number;
  nota: number;
  comentario: string | null;
  autorNome: string;
  createdAt: string;
}

export interface AvaliacaoResumo {
  media: number;
  total: number;
  distribuicao: Record<number, number>;
}

export interface PaginatedAvaliacoes {
  data: Avaliacao[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAvaliacaoPayload {
  nota: number;
  sessaoId: string;
}

export interface CreateAvaliacaoResponse {
  id: number;
  status: string;
  message: string;
}
