// /functions/admin/menu/product/[id].js
// PUT/DELETE su un prodotto specifico - es. /admin/menu/product/301

import { getSession, unauthorizedResponse } from '../../../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request, params } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const prodId = parseInt(params.id);
  const method = request.method;

  if (method === 'PUT') {
    const body = await request.json();
    const { name, description, price, image_url, mandatory_choice, active } = body;
    await env.DB.prepare(
      `UPDATE products SET
        name             = COALESCE(?, name),
        description      = COALESCE(?, description),
        price            = COALESCE(?, price),
        image_url        = COALESCE(?, image_url),
        mandatory_choice = COALESCE(?, mandatory_choice),
        active           = COALESCE(?, active)
       WHERE id = ?`
    ).bind(
      name             ? String(name).substring(0, 200)        : null,
      description != null ? String(description).substring(0, 1000) : null,
      price       != null ? parseFloat(price)                  : null,
      image_url   != null ? String(image_url).substring(0, 500): null,
      mandatory_choice != null ? (mandatory_choice ? 1 : 0)   : null,
      active      != null ? (active ? 1 : 0)                  : null,
      prodId
    ).run();
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  if (method === 'DELETE') {
    await env.DB.prepare(`UPDATE products SET active = 0 WHERE id = ?`).bind(prodId).run();
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: JSON_HEADERS });
}
