const SESS_COOKIE = 'gmpe_av_sess';
const RATINGS_COOKIE = 'gmpe_av_clientes';
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

function readRatingsMap(): Record<string, number> {
  const raw = readCookie(RATINGS_COOKIE);
  if (!raw) {
    return {};
  }

  try {
    const map = JSON.parse(raw) as Record<string, number>;
    return map && typeof map === 'object' ? map : {};
  } catch {
    return {};
  }
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isValidSessionId(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

export function getOrCreateSessionId(): string {
  const existing = readCookie(SESS_COOKIE);
  if (existing && isValidSessionId(existing)) {
    return existing;
  }

  const sessionId = createSessionId();
  writeCookie(SESS_COOKIE, sessionId);
  return sessionId;
}

export function getClienteRating(clienteId: number): number | null {
  const nota = readRatingsMap()[String(clienteId)];
  return typeof nota === 'number' && nota >= 1 && nota <= 5 ? nota : null;
}

export function hasRatedCliente(clienteId: number): boolean {
  return getClienteRating(clienteId) !== null;
}

export function markClienteRated(clienteId: number, nota: number): void {
  const map = readRatingsMap();
  map[String(clienteId)] = nota;
  writeCookie(RATINGS_COOKIE, JSON.stringify(map));
}
