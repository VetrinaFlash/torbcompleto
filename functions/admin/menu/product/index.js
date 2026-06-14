// /functions/admin/menu/product/index.js
// POST - crea un nuovo prodotto

import { getSession, unauthorizedResponse } from '../../../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestPost(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const { category_id, name, description, price, image_url, mandatory_choice, sort_order } = body;

  if (!category_id || !name || price == null) {
    return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti' }), { status: 400, headers: JSON_HEADERS });
  }

  await env.DB.prepare(
    `INSERT INTO products (category_id, name, description, price, image_url, mandatory_choice, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(
    String(category_id).substring(0, 50),
    String(name).substring(0, 200),
    String(description || '').substring(0, 1000),
    parseFloat(price),
    String(image_url || '').substring(0, 500),
    mandatory_choice ? 1 : 0,
    parseInt(sort_order) || 0
  ).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
}
