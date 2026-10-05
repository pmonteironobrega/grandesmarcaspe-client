const LOWERCASE_CONNECTORS = new Set([
  'a',
  'à',
  'ao',
  'aos',
  'as',
  'às',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'pela',
  'pelas',
  'pelo',
  'pelos',
  'por',
  'sem',
  'sob',
]);

/**
 * Title case for pt-BR names: connectors stay lowercase (`Farmácias e Drogarias em Recife`).
 * Mixed-case input keeps its inner casing so acronyms survive (`Assistência Técnica para TV`);
 * all-uppercase or all-lowercase input is normalized.
 */
export function capitalizeWords(value: string): string {
  const keepCase = value !== value.toUpperCase() && value !== value.toLowerCase();

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_CONNECTORS.has(lower)) {
        return lower;
      }
      const rest = keepCase ? word.slice(1) : lower.slice(1);
      return lower.charAt(0).toUpperCase() + rest;
    })
    .join(' ');
}
