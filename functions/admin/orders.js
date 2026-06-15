// /functions/admin/orders.js
// GET protetta - Lista ordini con filtri per status, data, paginazione
// POST protetta - Aggiorna status di un ordine

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const url = new URL(request.url);
  const method = request.method;

  // GET - lista ordini con filtri
  if (method === 'GET') {
    const status  = url.searchParams.get('status') || '';
    const date    = url.searchParams.get('date') || '';
    const since   = url.searchParams.get('since') || '';
    const page    = parseInt(url.searchParams.get('page') || '1');
    const limit   = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset  = (page - 1) * limit;

    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push("date(created_at) = date(?)");
      params.push(date);
    }
    if (since) {
      conditions.push("created_at > ?");
      params.push(since);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Conteggio totale per paginazione
    const countRow = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM orders ${where}`
    ).bind(...params).first();

    const rows = await env.DB.prepare(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    return new Response(JSON.stringify({
      orders: rows.results,
      total: countRow.total,
      page,
      limit
    }), { headers: JSON_HEADERS });
  }

  // POST - aggiorna status ordine
  if (method === 'POST') {
    try {
      const body = await request.json();
      const { orderId, status } = body;
      const validStatuses = ['nuovo', 'preparazione', 'pronto', 'consegnato'];

      if (!orderId || !validStatuses.includes(status)) {
        return new Response(JSON.stringify({ error: 'Parametri non validi' }), { status: 400, headers: JSON_HEADERS });
      }

      await env.DB.prepare(
        `UPDATE orders SET status = ? WHERE id = ?`
      ).bind(status, orderId).run();

      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
    }
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: JSON_HEADERS });
}
