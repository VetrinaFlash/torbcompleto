// /functions/admin/menu.js
// Gestione completa del menu: categorie e prodotti
// Metodi supportati: GET, POST, PUT, DELETE - tutti protetti da sessione admin

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequest(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const url    = new URL(request.url);
  const method = request.method;
  const path   = url.pathname; // es: /admin/menu, /admin/menu/category, /admin/menu/product/5

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' } });
  }

  // ---- GET: lista categorie e prodotti ----
  if (method === 'GET') {
    const cats  = await env.DB.prepare(`SELECT * FROM categories ORDER BY sort_order ASC`).all();
    const prods = await env.DB.prepare(`SELECT * FROM products ORDER BY category_id, sort_order ASC`).all();
    return new Response(JSON.stringify({ categories: cats.results, products: prods.results }), { headers: JSON_HEADERS });
  }

  // ---- POST: crea categoria o prodotto ----
  if (method === 'POST') {
    const body = await request.json();

    // Crea categoria
    if (path.endsWith('/category')) {
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

    // Crea prodotto
    if (path.endsWith('/product')) {
      const { category_id, name, description, price, image_url, mandatory_choice, sort_order } = body;
      if (!category_id || !name || price == null) return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti' }), { status: 400, headers: JSON_HEADERS });
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
  }

  // ---- PUT: modifica categoria o prodotto ----
  if (method === 'PUT') {
    const body = await request.json();

    // PUT /admin/menu/category/:id
    const catMatch = path.match(/\/admin\/menu\/category\/([^/]+)$/);
    if (catMatch) {
      const catId    = catMatch[1];
      const { name, icon, sort_order, active } = body;
      await env.DB.prepare(
        `UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), active = COALESCE(?, active) WHERE id = ?`
      ).bind(
        name ? String(name).substring(0, 100) : null,
        icon ? String(icon).substring(0, 10) : null,
        sort_order != null ? parseInt(sort_order) : null,
        active != null ? (active ? 1 : 0) : null,
        catId
      ).run();
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    }

    // PUT /admin/menu/product/:id
    const prodMatch = path.match(/\/admin\/menu\/product\/(\d+)$/);
    if (prodMatch) {
      const prodId = parseInt(prodMatch[1]);
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
        name        ? String(name).substring(0, 200) : null,
        description != null ? String(description).substring(0, 1000) : null,
        price       != null ? parseFloat(price) : null,
        image_url   != null ? String(image_url).substring(0, 500) : null,
        mandatory_choice != null ? (mandatory_choice ? 1 : 0) : null,
        active      != null ? (active ? 1 : 0) : null,
        prodId
      ).run();
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    }
  }

  // ---- DELETE: disattiva categoria o prodotto ----
  if (method === 'DELETE') {
    const catMatch  = path.match(/\/admin\/menu\/category\/([^/]+)$/);
    const prodMatch = path.match(/\/admin\/menu\/product\/(\d+)$/);

    if (catMatch) {
      await env.DB.prepare(`UPDATE categories SET active = 0 WHERE id = ?`).bind(catMatch[1]).run();
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    }
    if (prodMatch) {
      await env.DB.prepare(`UPDATE products SET active = 0 WHERE id = ?`).bind(parseInt(prodMatch[1])).run();
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    }
  }

  return new Response(JSON.stringify({ error: 'Route non trovata' }), { status: 404, headers: JSON_HEADERS });
}
