// /functions/admin/sse.js
// Polling notifiche: restituisce tutti gli ordini con status 'nuovo'
// Il frontend fa il diff per ID per rilevare quelli nuovi

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  try {
    // Restituisce TUTTI gli ordini 'nuovo' delle ultime 24 ore
    const rows = await env.DB.prepare(
      `SELECT id, customer_name, pickup_time, total, status, created_at
       FROM orders
       WHERE status = 'nuovo'
         AND created_at >= datetime('now', '-24 hours', 'localtime')
       ORDER BY created_at DESC
       LIMIT 50`
    ).all();

    return new Response(JSON.stringify({
      newOrders: rows.results || [],
      serverTime: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, newOrders: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
