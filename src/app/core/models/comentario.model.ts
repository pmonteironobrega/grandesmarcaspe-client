export interface Comentario {
  id: number;
  conteudo: string;
  autorNome: string;
  createdAt: string;
  respostas: Comentario[];
}

export interface CreateComentarioPayload {
  conteudo: string;
  parentId?: number;
}

export interface CreateComentarioResponse {
  id: number;
  status: string;
  message: string;
}
