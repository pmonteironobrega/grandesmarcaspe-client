import { capitalizeWords } from './format-text';

describe('capitalizeWords', () => {
  it('keeps connectors lowercase except as the first word', () => {
    expect(capitalizeWords('farmácias e drogarias')).toBe('Farmácias e Drogarias');
    expect(capitalizeWords('Cabo De Santo Agostinho')).toBe('Cabo de Santo Agostinho');
    expect(capitalizeWords('de olho na moda')).toBe('De Olho na Moda');
  });

  it('normalizes all-uppercase input', () => {
    expect(capitalizeWords('BAIRRO DO EXEMPLO')).toBe('Bairro do Exemplo');
  });

  it('keeps acronyms in mixed-case input', () => {
    expect(capitalizeWords('Assistência Técnica para TV')).toBe('Assistência Técnica para TV');
  });

  it('collapses extra whitespace', () => {
    expect(capitalizeWords('  moto   boy ')).toBe('Moto Boy');
  });
});
