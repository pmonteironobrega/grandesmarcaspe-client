import { toInternalApiUrl } from './server-api.backend';

describe('toInternalApiUrl', () => {
  const self = 'https://www.example.com.br';
  const api = 'http://127.0.0.1:3001';

  it('maps relative and same-origin URLs to the internal API', () => {
    expect(toInternalApiUrl('/r/cliente/recife/boa-viagem/pe', self, api)).toBe(
      'http://127.0.0.1:3001/r/cliente/recife/boa-viagem/pe',
    );
    expect(toInternalApiUrl(`${self}/c/academias/pe?page=2`, self, api)).toBe(
      'http://127.0.0.1:3001/c/academias/pe?page=2',
    );
  });

  it('leaves other origins and protocol-relative URLs untouched', () => {
    expect(toInternalApiUrl('http://127.0.0.1:3001/auth/me', self, api)).toBe(
      'http://127.0.0.1:3001/auth/me',
    );
    expect(toInternalApiUrl('https://maps.example.com/x', self, api)).toBe('https://maps.example.com/x');
    expect(toInternalApiUrl('//cdn.example.com/x', self, api)).toBe('//cdn.example.com/x');
  });
});
