interface EstadoFallback {
  ID: string;
  Sigla: string;
  Nome: string;
}

export const LISTA_ESTADOS: EstadoFallback[] = [
  { ID: '1', Sigla: 'AC', Nome: 'Acre' },
  { ID: '2', Sigla: 'AL', Nome: 'Alagoas' },
  { ID: '16', Sigla: 'PE', Nome: 'Pernambuco' },
  { ID: '27', Sigla: 'TO', Nome: 'Tocantins' },
];
