// /functions/admin/menu/category/index.js
// POST - crea una nuova categoria

import { getSession, unauthorizedResponse } from '../../../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestPost(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const { id, name, icon, sort_order } = body;

  if (!id || !name) return new Response(JSON.stringify({ error: 'id e name obbligatori' }), { status: 400, headers: JSON_HEADERS });

  const safeId   = String(id).replace(/[^a-z0-9-]/gi, '').substring(0, 50);
  const safeName = String(name).substring(0, 100);
  const safeIcon = String(icon || '🍴').substring(0, 10);

  await env.DB.prepare(
    `INSERT INTO categories (id, name, icon, sort_order, active) VALUES (?, ?, ?, ?, 1)`
  ).bind(safeId, safeName, safeIcon, parseInt(sort_order) || 0).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
}
