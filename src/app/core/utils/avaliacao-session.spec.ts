import {
  getClienteRating,
  getOrCreateSessionId,
  hasRatedCliente,
  markClienteRated,
} from './avaliacao-session';

describe('avaliacao-session', () => {
  beforeEach(() => {
    document.cookie = 'gmpe_av_sess=; path=/; max-age=0';
    document.cookie = 'gmpe_av_clientes=; path=/; max-age=0';
  });

  it('creates and reuses session id cookie', () => {
    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it('replaces invalid session cookie', () => {
    document.cookie = 'gmpe_av_sess=invalid-session; path=/; max-age=3600';

    const sessionId = getOrCreateSessionId();

    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(getOrCreateSessionId()).toBe(sessionId);
  });

  it('tracks ratings per cliente in cookie', () => {
    expect(hasRatedCliente(42)).toBe(false);

    markClienteRated(42, 4);

    expect(hasRatedCliente(42)).toBe(true);
    expect(getClienteRating(42)).toBe(4);
    expect(getClienteRating(99)).toBeNull();
  });
});
