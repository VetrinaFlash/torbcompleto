// /functions/admin/customers.js
// GET protetta - Lista clienti CRM con paginazione e ricerca per nome

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestGet(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const url    = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const page   = parseInt(url.searchParams.get('page') || '1');
  const limit  = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const customerId = url.searchParams.get('id');

  // Dettaglio cliente singolo con i suoi ordini
  if (customerId) {
    const customer = await env.DB.prepare(
      `SELECT * FROM customers WHERE id = ?`
    ).bind(parseInt(customerId)).first();

    if (!customer) {
      return new Response(JSON.stringify({ error: 'Cliente non trovato' }), { status: 404, headers: JSON_HEADERS });
    }

    const orders = await env.DB.prepare(
      `SELECT id, pickup_time, total, status, created_at FROM orders WHERE customer_name = ? COLLATE NOCASE ORDER BY created_at DESC LIMIT 50`
    ).bind(customer.name).all();

    return new Response(JSON.stringify({ customer, orders: orders.results }), { headers: JSON_HEADERS });
  }

  // Lista clienti con ricerca
  let where = '';
  let params = [];
  if (search) {
    where = 'WHERE name LIKE ?';
    params.push(`%${search}%`);
  }

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM customers ${where}`
  ).bind(...params).first();

  const rows = await env.DB.prepare(
    `SELECT * FROM customers ${where} ORDER BY last_order_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return new Response(JSON.stringify({
    customers: rows.results,
    total: countRow.total,
    page,
    limit
  }), { headers: JSON_HEADERS });
}
