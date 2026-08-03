export interface ApiErrorDetail {
  field: string;
  messages: string[];
}

export interface ApiErrorBody {
  statusCode?: number;
  message?: string;
  error?: string;
  details?: ApiErrorDetail[];
}

type ApiMessageContext = 'avaliacao' | 'comentario' | 'auth' | 'generic';

function extractErrorBody(error: unknown): ApiErrorBody | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as { error?: ApiErrorBody; status?: number };
  if (candidate.error && typeof candidate.error === 'object') {
    return {
      ...candidate.error,
      statusCode: candidate.error.statusCode ?? candidate.status,
    };
  }

  return null;
}

function hasValidationDetails(body: ApiErrorBody | null): boolean {
  return Boolean(body?.details?.length) || body?.message === 'Validation failed';
}

function mapValidationMessage(context: ApiMessageContext, body: ApiErrorBody | null): string {
  const fields = new Set(body?.details?.map((item) => item.field) ?? []);

  if (context === 'avaliacao') {
    if (fields.has('sessaoId') || fields.has('autorNome') || fields.has('autorEmail')) {
      return 'Não foi possível identificar sua sessão. Recarregue a página e tente novamente.';
    }
    if (fields.has('nota')) {
      return 'Selecione uma nota entre 1 e 5 estrelas.';
    }
    return 'Não foi possível registrar sua avaliação. Tente novamente.';
  }

  if (context === 'comentario') {
    if (fields.has('conteudo')) {
      return 'Escreva um comentário com pelo menos 2 caracteres.';
    }
    return 'Não foi possível publicar seu comentário. Tente novamente.';
  }

  if (context === 'auth') {
    if (fields.has('email')) {
      return 'Informe um e-mail válido.';
    }
    if (fields.has('senha')) {
      return 'Informe uma senha válida.';
    }
    if (fields.has('nome')) {
      return 'Informe seu nome.';
    }
    return 'Não foi possível concluir o login. Verifique os dados e tente novamente.';
  }

  return 'Não foi possível concluir a ação. Verifique os dados e tente novamente.';
}

function mapKnownServerMessage(message: string, context: ApiMessageContext): string | null {
  const normalized = message.toLowerCase();

  if (normalized.includes('já enviou uma avaliação') || normalized.includes('ja enviou uma avaliacao')) {
    return 'Você já avaliou este estabelecimento.';
  }

  if (normalized.includes('muitas avaliações') || normalized.includes('muitas avaliacoes')) {
    return 'Muitas avaliações em pouco tempo. Aguarde um momento e tente novamente.';
  }

  if (normalized.includes('muitos comentários') || normalized.includes('muitos comentarios')) {
    return 'Muitos comentários em pouco tempo. Aguarde um momento e tente novamente.';
  }

  if (normalized.includes('estabelecimento não encontrado') || normalized.includes('estabelecimento nao encontrado')) {
    return 'Este estabelecimento não foi encontrado.';
  }

  if (context === 'comentario' && normalized.includes('comentário pai inválido')) {
    return 'Não foi possível responder a este comentário.';
  }

  if (context === 'auth') {
    if (
      normalized.includes('credenciais inválidas') ||
      normalized.includes('credenciais invalidas') ||
      normalized.includes('invalid credentials')
    ) {
      return 'E-mail ou senha incorretos.';
    }
    if (normalized.includes('senha atual incorreta')) {
      return 'Senha atual incorreta.';
    }
    if (normalized.includes('e-mail já cadastrado') || normalized.includes('email já cadastrado')) {
      return 'Este e-mail já está cadastrado.';
    }
    if (normalized.includes('acesso permitido apenas')) {
      return 'Acesso permitido apenas para usuários da plataforma.';
    }
  }

  return null;
}

export function resolveApiErrorMessage(error: unknown, context: ApiMessageContext = 'generic'): string {
  const body = extractErrorBody(error);
  const status = body?.statusCode ?? (error as { status?: number })?.status;

  if (status === 401 && context === 'comentario') {
    return 'Faça login para comentar.';
  }

  if (status === 409) {
    return context === 'comentario'
      ? 'Esta ação não pode ser repetida.'
      : 'Você já avaliou este estabelecimento.';
  }

  if (status === 429) {
    return context === 'comentario'
      ? 'Muitos comentários em pouco tempo. Aguarde um momento e tente novamente.'
      : 'Muitas avaliações em pouco tempo. Aguarde um momento e tente novamente.';
  }

  if (hasValidationDetails(body)) {
    return mapValidationMessage(context, body);
  }

  if (body?.message) {
    const known = mapKnownServerMessage(body.message, context);
    if (known) {
      return known;
    }
  }

  if (status === 404 && context === 'auth') {
    return 'Serviço de autenticação indisponível. Reinicie a API do backend.';
  }

  if (status === 0 || status === undefined) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }

  return context === 'avaliacao'
    ? 'Não foi possível registrar sua avaliação. Tente novamente.'
    : context === 'comentario'
      ? 'Não foi possível publicar seu comentário. Tente novamente.'
      : context === 'auth'
        ? 'Não foi possível concluir o login. Tente novamente.'
        : 'Não foi possível concluir a ação. Tente novamente.';
}
