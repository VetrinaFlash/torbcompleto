// /functions/admin/promo-codes.js
// GET protetta - Lista promo codes con paginazione
// POST protetta - Crea nuovo promo code
// PUT protetta - Aggiorna promo code
// DELETE protetta - Elimina promo code

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const url = new URL(request.url);
  const method = request.method;

  // GET - Lista promo codes con paginazione
  if (method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = (page - 1) * limit;

      const countRow = await env.DB.prepare(
        `SELECT COUNT(*) as total FROM promo_codes`
      ).first();

      const rows = await env.DB.prepare(
        `SELECT * FROM promo_codes ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();

      return new Response(JSON.stringify({
        promo_codes: rows.results,
        total: countRow.total,
        page,
        limit
      }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  // POST - Crea nuovo promo code
  if (method === 'POST') {
    try {
      const body = await request.json();
      const { code, discount_type, value } = body;

      if (!code || !discount_type || value == null) {
        return new Response(JSON.stringify({ error: 'Campi obbligatori: code, discount_type, value' }), { status: 400, headers: JSON_HEADERS });
      }

      const validTypes = ['fixed', 'percentage'];
      if (!validTypes.includes(discount_type)) {
        return new Response(JSON.stringify({ error: 'discount_type deve essere "fixed" o "percentage"' }), { status: 400, headers: JSON_HEADERS });
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        return new Response(JSON.stringify({ error: 'value deve essere un numero positivo' }), { status: 400, headers: JSON_HEADERS });
      }

      const safeCode = String(code).toUpperCase().substring(0, 50).trim();
      if (!safeCode || safeCode.length === 0) {
        return new Response(JSON.stringify({ error: 'code non può essere vuoto' }), { status: 400, headers: JSON_HEADERS });
      }

      // Verifica se il codice esiste già
      const existing = await env.DB.prepare(
        `SELECT id FROM promo_codes WHERE code = ? COLLATE NOCASE`
      ).bind(safeCode).first();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Questo codice esiste già' }), { status: 409, headers: JSON_HEADERS });
      }

      await env.DB.prepare(
        `INSERT INTO promo_codes (code, discount_type, value, active) VALUES (?, ?, ?, 1)`
      ).bind(safeCode, discount_type, numValue).run();

      return new Response(JSON.stringify({ ok: true, message: 'Promo code creato con successo' }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  // PUT - Aggiorna promo code
  if (method === 'PUT') {
    try {
      const body = await request.json();
      const { id, code, discount_type, value, active } = body;

      if (!id || (!code && discount_type === undefined && value === undefined && active === undefined)) {
        return new Response(JSON.stringify({ error: 'Fornisci id e almeno un campo da aggiornare' }), { status: 400, headers: JSON_HEADERS });
      }

      const numId = parseInt(id);
      const updates = [];
      const params = [];

      if (code !== undefined) {
        const safeCode = String(code).toUpperCase().substring(0, 50).trim();
        if (safeCode) {
          updates.push('code = ?');
          params.push(safeCode);
        }
      }

      if (discount_type !== undefined) {
        const validTypes = ['fixed', 'percentage'];
        if (validTypes.includes(discount_type)) {
          updates.push('discount_type = ?');
          params.push(discount_type);
        }
      }

      if (value !== undefined) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
          updates.push('value = ?');
          params.push(numValue);
        }
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

      const query = `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = ?`;
      await env.DB.prepare(query).bind(...params).run();

      return new Response(JSON.stringify({ ok: true, message: 'Promo code aggiornato con successo' }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  // DELETE - Elimina promo code
  if (method === 'DELETE') {
    try {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: 'id obbligatorio' }), { status: 400, headers: JSON_HEADERS });
      }

      const numId = parseInt(id);
      await env.DB.prepare(`DELETE FROM promo_codes WHERE id = ?`).bind(numId).run();

      return new Response(JSON.stringify({ ok: true, message: 'Promo code eliminato con successo' }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: JSON_HEADERS });
}
