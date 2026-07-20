// /functions/admin/homepage-buttons.js
// GET protetta - Lista homepage buttons
// POST protetta - Crea nuovo bottone
// PUT protetta - Aggiorna bottone
// DELETE protetta - Elimina bottone

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const url = new URL(request.url);
  const method = request.method;

  // GET - Lista homepage buttons ordinati
  if (method === 'GET') {
    try {
      const rows = await env.DB.prepare(
        `SELECT * FROM homepage_buttons WHERE active = 1 ORDER BY sort_order ASC`
      ).all();

      return new Response(JSON.stringify({ buttons: rows.results }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  // POST - Crea nuovo bottone
  if (method === 'POST') {
    try {
      const body = await request.json();
      const { label, url: buttonUrl, sort_order } = body;

      if (!label || !buttonUrl) {
        return new Response(JSON.stringify({ error: 'Campi obbligatori: label, url' }), { status: 400, headers: JSON_HEADERS });
      }

      const safeLabel = String(label).substring(0, 100).trim();
      const safeUrl = String(buttonUrl).substring(0, 500).trim();
      const safeOrder = Math.max(0, parseInt(sort_order) || 0);

      if (!safeLabel || !safeUrl) {
        return new Response(JSON.stringify({ error: 'label e url non possono essere vuoti' }), { status: 400, headers: JSON_HEADERS });
      }

      await env.DB.prepare(
        `INSERT INTO homepage_buttons (label, url, sort_order, active) VALUES (?, ?, ?, 1)`
      ).bind(safeLabel, safeUrl, safeOrder).run();

      return new Response(JSON.stringify({ ok: true, message: 'Bottone creato con successo' }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  // PUT - Aggiorna bottone
  if (method === 'PUT') {
    try {
      const body = await request.json();
      const { id, label, url: buttonUrl, sort_order, active } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: 'id obbligatorio' }), { status: 400, headers: JSON_HEADERS });
      }

      const numId = parseInt(id);
      const updates = [];
      const params = [];

      if (label !== undefined) {
        const safeLabel = String(label).substring(0, 100).trim();
        if (safeLabel) {
          updates.push('label = ?');
          params.push(safeLabel);
        }
      }

      if (buttonUrl !== undefined) {
        const safeUrl = String(buttonUrl).substring(0, 500).trim();
        if (safeUrl) {
          updates.push('url = ?');
          params.push(safeUrl);
        }
      }

      if (sort_order !== undefined) {
        const safeOrder = Math.max(0, parseInt(sort_order) || 0);
        updates.push('sort_order = ?');
        params.push(safeOrder);
      }

      if (active !== undefined) {
        updates.push('active = ?');
        params.push(active ? 1 : 0);
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: 'Nessun campo valido da aggiornare' }), { status: 400, headers: JSON_HEADERS });
      }

      updates.push('updated_at = datetime("now","localtime")');
      params.push(numId);

      const query = `UPDATE homepage_buttons SET ${updates.join(', ')} WHERE id = ?`;
      await env.DB.prepare(query).bind(...params).run();

      return new Response(JSON.stringify({ ok: true, message: 'Bottone aggiornato con successo' }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  // DELETE - Elimina bottone
  if (method === 'DELETE') {
    try {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: 'id obbligatorio' }), { status: 400, headers: JSON_HEADERS });
      }

      const numId = parseInt(id);
      await env.DB.prepare(`DELETE FROM homepage_buttons WHERE id = ?`).bind(numId).run();

      return new Response(JSON.stringify({ ok: true, message: 'Bottone eliminato con successo' }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: JSON_HEADERS });
}
