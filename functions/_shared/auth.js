// /functions/_shared/auth.js
// Utility per firmare e verificare i cookie di sessione admin
// Usa crypto.subtle disponibile nel runtime Cloudflare Workers

const COOKIE_NAME = 'torb_admin_session';
const TOKEN_TTL   = 8 * 60 * 60 * 1000; // 8 ore in ms

/**
 * Genera un token firmato con HMAC-SHA256.
 * Formato: base64url(payload).base64url(firma)
 */
export async function signToken(secret, payload) {
  const data = btoa(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

/**
 * Verifica un token firmato. Restituisce il payload o null se non valido.
 */
export async function verifyToken(secret, token) {
  try {
    const [data, sigB64] = token.split('.');
    if (!data || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;

    const payload = JSON.parse(atob(data));
    // Controlla scadenza
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Legge il cookie di sessione dalla request e lo verifica.
 * Restituisce il payload o null.
 */
export async function getSession(request, secret) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifyToken(secret, decodeURIComponent(match[1]));
}

/**
 * Costruisce il valore del Set-Cookie per la sessione admin.
 */
export async function buildSessionCookie(secret) {
  const payload = { admin: true, exp: Date.now() + TOKEN_TTL };
  const token = await signToken(secret, payload);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TOKEN_TTL / 1000}`;
}

/**
 * Cookie di logout (scaduto immediatamente).
 */
export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

/**
 * Risposta 401 standard.
 */
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Non autorizzato' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
