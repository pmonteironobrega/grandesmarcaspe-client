import {
  buildTelUrl,
  buildWhatsappUrl,
  formatTelefoneDisplay,
  isCelular,
} from './telefone';

describe('telefone utils', () => {
  it('formats phone numbers for display', () => {
    expect(formatTelefoneDisplay('81', '34431212')).toBe('(81) 3443-1212');
    expect(formatTelefoneDisplay('81', '999887766')).toBe('(81) 99988-7766');
  });

  it('detects mobile numbers', () => {
    expect(isCelular('999887766')).toBe(true);
    expect(isCelular('98887766')).toBe(true);
    expect(isCelular('34431212')).toBe(false);
  });

  it('builds whatsapp and tel urls', () => {
    expect(buildWhatsappUrl('81', '999887766')).toBe('https://wa.me/5581999887766');
    expect(buildTelUrl('81', '34431212')).toBe('tel:+558134431212');
  });
});
