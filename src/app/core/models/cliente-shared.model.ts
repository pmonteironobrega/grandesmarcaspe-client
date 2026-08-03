export interface CategoriaSummary {
  id: number;
  nome: string;
  slug: string;
}

export interface PlanoSummary {
  id: number;
  nome: string | null;
}

export interface GeographySummary {
  id: number;
  nome: string;
  slug?: string;
  sigla?: string;
}

export interface ClienteEndereco {
  id: number;
  logradouro: string;
  complemento: string | null;
  numero: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  uf: GeographySummary;
  cidade: GeographySummary | null;
  bairro: GeographySummary | null;
}

export interface ClienteTelefone {
  id: number;
  ddd: string;
  telefone: string;
}

export interface ClienteImagem {
  id: number;
  caminho: string;
  tipo: string;
  principal: boolean;
}

export interface ClienteTag {
  id: number;
  nome: string;
}
