// /functions/admin/check.js
// GET - Verifica se la sessione admin è valida

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);

  if (!session) return unauthorizedResponse();

  return new Response(JSON.stringify({ authenticated: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
