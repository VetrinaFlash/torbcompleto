// /functions/admin/settings.js
// GET + POST protette - Lettura e aggiornamento impostazioni chiave-valore

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  // GET - restituisce tutte le impostazioni come oggetto chiave:valore
  if (request.method === 'GET') {
    const rows = await env.DB.prepare(`SELECT key, value FROM settings`).all();
    const settings = {};
    rows.results.forEach(r => { settings[r.key] = r.value; });
    return new Response(JSON.stringify(settings), { headers: JSON_HEADERS });
  }

  // POST - aggiorna una o più impostazioni
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const allowedKeys = ['whatsapp_number', 'promo_bar_text', 'store_override_open', 'opening_hours'];

      for (const [key, value] of Object.entries(body)) {
        if (!allowedKeys.includes(key)) continue; // Ignora chiavi non autorizzate
        await env.DB.prepare(
          `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        ).bind(key, String(value).substring(0, 2000)).run();
      }

      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: JSON_HEADERS });
}
