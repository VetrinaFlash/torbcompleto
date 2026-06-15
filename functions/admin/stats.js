// /functions/admin/stats.js
// GET protetta - Statistiche: ordini per giorno, top prodotti, revenue

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestGet(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  try {
    // Ordini e revenue per giorno (ultimi 30 giorni)
    const dailyRows = await env.DB.prepare(`
      SELECT date(created_at) as day,
             COUNT(*) as order_count,
             SUM(total) as revenue
      FROM orders
      WHERE created_at >= datetime('now', '-30 days', 'localtime')
      GROUP BY day
      ORDER BY day ASC
    `).all();

    // Totali generali
    const totals = await env.DB.prepare(`
      SELECT COUNT(*) as total_orders,
             COALESCE(SUM(total), 0) as total_revenue
      FROM orders
    `).first();

    // Ordini e revenue oggi
    const today = await env.DB.prepare(`
      SELECT COUNT(*) as today_orders,
             COALESCE(SUM(total), 0) as today_revenue
      FROM orders
      WHERE date(created_at) = date('now', 'localtime')
    `).first();

    // Revenue mese corrente
    const monthRevenue = await env.DB.prepare(`
      SELECT COALESCE(SUM(total), 0) as month_revenue
      FROM orders
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
    `).first();

    // Top 10 prodotti per quantità (analizza items_json)
    // items_json è un array di {name, price, qty} - usiamo analisi in JS
    const allOrders = await env.DB.prepare(`
      SELECT items_json FROM orders
      WHERE created_at >= datetime('now', '-30 days', 'localtime')
    `).all();

    const productStats = {};
    allOrders.results.forEach(row => {
      try {
        const items = JSON.parse(row.items_json);
        items.forEach(item => {
          if (item.name && item.qty > 0 && item.price >= 0) {
            const key = item.name;
            if (!productStats[key]) productStats[key] = { name: key, qty: 0, revenue: 0 };
            productStats[key].qty     += item.qty;
            productStats[key].revenue += item.price * item.qty;
          }
        });
      } catch {}
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    return new Response(JSON.stringify({
      daily: dailyRows.results,
      totals,
      today,
      month_revenue: monthRevenue.month_revenue,
      top_products: topProducts
    }), { headers: JSON_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
}
