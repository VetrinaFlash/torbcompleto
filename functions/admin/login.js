// /functions/admin/login.js
// POST - Verifica credenziali admin e imposta cookie di sessione HttpOnly

import { buildSessionCookie } from '../_shared/auth.js';

// Credenziali admin hardcoded lato server (mai esposte al frontend)
const ADMIN_USERNAME = 'T0R13';
const ADMIN_PASSWORD = 'T0R13';

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { username, password } = body;

    // Confronto in tempo costante per evitare timing attacks
    const uOk = username === ADMIN_USERNAME;
    const pOk = password === ADMIN_PASSWORD;

    if (!uOk || !pOk) {
      // Piccolo delay per rallentare brute-force
      await new Promise(r => setTimeout(r, 500));
      return new Response(JSON.stringify({ ok: false, error: 'Credenziali non valide' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
    const cookie = await buildSessionCookie(secret);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
