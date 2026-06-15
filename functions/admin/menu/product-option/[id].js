// /functions/admin/menu/product-option/[id].js
// DELETE: rimuove un'opzione specifica

import { getSession, unauthorizedResponse } from '../../../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestDelete(context) {
  const { env, request, params } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const optionId = parseInt(params.id);
  await env.DB.prepare(`DELETE FROM product_options WHERE id = ?`).bind(optionId).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
}
