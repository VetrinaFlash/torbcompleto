// /functions/admin/menu/category/[id].js
// PUT/DELETE su una categoria specifica - es. /admin/menu/category/tapas

import { getSession, unauthorizedResponse } from '../../../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request, params } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const catId = params.id;
  const method = request.method;

  if (method === 'PUT') {
    const body = await request.json();
    const { name, icon, sort_order, active } = body;
    await env.DB.prepare(
      `UPDATE categories SET
        name       = COALESCE(?, name),
        icon       = COALESCE(?, icon),
        sort_order = COALESCE(?, sort_order),
        active     = COALESCE(?, active)
       WHERE id = ?`
    ).bind(
      name        ? String(name).substring(0, 100) : null,
      icon        ? String(icon).substring(0, 10)  : null,
      sort_order != null ? parseInt(sort_order)    : null,
      active     != null ? (active ? 1 : 0)        : null,
      catId
    ).run();
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  if (method === 'DELETE') {
    await env.DB.prepare(`UPDATE categories SET active = 0 WHERE id = ?`).bind(catId).run();
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: JSON_HEADERS });
}
