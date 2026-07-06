export function normalizeTelefoneDigits(ddd: string, telefone: string): string {
  return `${ddd}${telefone}`.replace(/\D/g, '');
}

export function formatTelefoneDisplay(ddd: string, telefone: string): string {
  const dddClean = ddd.replace(/\D/g, '');
  const digits = telefone.replace(/\D/g, '');

  let formatted = digits;
  if (digits.length === 9) {
    formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else if (digits.length === 8) {
    formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `(${dddClean}) ${formatted}`;
}

export function isCelular(telefone: string): boolean {
  const digits = telefone.replace(/\D/g, '');
  return (digits.length === 9 && digits.startsWith('9')) || (digits.length === 8 && digits.startsWith('9'));
}

export function buildWhatsappUrl(ddd: string, telefone: string): string {
  const digits = normalizeTelefoneDigits(ddd, telefone);
  return `https://wa.me/55${digits}`;
}

export function buildTelUrl(ddd: string, telefone: string): string {
  const digits = normalizeTelefoneDigits(ddd, telefone);
  return `tel:+55${digits}`;
}
