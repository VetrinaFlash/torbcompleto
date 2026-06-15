// /functions/admin/menu/product/[id]/options.js
// GET: lista opzioni di un prodotto
// POST: aggiunge un'opzione a un prodotto

import { getSession, unauthorizedResponse } from '../../../../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request, params } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const productId = parseInt(params.id);
  const method = request.method;

  // GET - lista opzioni del prodotto
  if (method === 'GET') {
    const rows = await env.DB.prepare(
      `SELECT * FROM product_options WHERE product_id = ? ORDER BY sort_order ASC, id ASC`
    ).bind(productId).all();
    return new Response(JSON.stringify(rows.results), { headers: JSON_HEADERS });
  }

  // POST - aggiunge nuova opzione
  if (method === 'POST') {
    const body = await request.json();
    const label = String(body.label || '').trim().substring(0, 100);
    if (!label) return new Response(JSON.stringify({ error: 'Label obbligatoria' }), { status: 400, headers: JSON_HEADERS });

    const result = await env.DB.prepare(
      `INSERT INTO product_options (product_id, label, sort_order) VALUES (?, ?, COALESCE((SELECT MAX(sort_order)+1 FROM product_options WHERE product_id = ?), 0))`
    ).bind(productId, label, productId).run();

    return new Response(JSON.stringify({ ok: true, id: result.meta?.last_row_id }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: JSON_HEADERS });
}
