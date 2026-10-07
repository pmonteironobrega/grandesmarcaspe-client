/** Height kept in the first HTML so the mobile top unit does not push the page. */
export const DETALHES_TOPO_RESERVED_HEIGHT = 250;

/** Ad units from the AdSense account. Each id stays on one page type so the report can split them. */
export const ADSENSE_SLOTS = {
  /** Guiadosestadoshome2 — home, 468x60 */
  homeBanner: '1602418455',
  /** GrandesMarcasPE_detalhes_001 — business detail, below the gallery */
  detalhesTopo: '4181791664',
  /** GrandesMarcasPE_detalhes_2 — business detail, end of the content */
  detalhesConteudo: '9718911578',
  /** Guiadosestados_lugares_300x600 — /r/lugares listings */
  lugares: '6754128851',
  /** GuiadosEstadoscategorias — /c/ listings, below the heading */
  categorias: '5893017257',
  /** GuiadosEstadoscategorias2 — /c/ listings, after the results */
  categorias2: '8846483651',
  /** Guiadosestadoscategoria3 — /c/ listings, after the pagination */
  categoria3: '1323216850',
} as const;
