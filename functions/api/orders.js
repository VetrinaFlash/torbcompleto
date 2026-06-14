// /functions/api/orders.js
// Endpoint pubblico POST - salva un nuovo ordine in D1 dopo il pagamento SumUp
// Chiamato da successo.html con i dati dell'ordine salvati in localStorage

export async function onRequestPost(context) {
  const { env, request } = context;

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    const body = await request.json();

    // Validazione campi obbligatori
    const { orderId, customerName, pickupTime, notes, items, subtotal, discountRate, total } = body;
    if (!orderId || !customerName || !pickupTime || !items || total == null) {
      return new Response(JSON.stringify({ error: 'Dati ordine incompleti' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Sanitizzazione base: campi stringa troncati
    const safeOrderId    = String(orderId).substring(0, 50);
    const safeName       = String(customerName).substring(0, 100);
    const safeTime       = String(pickupTime).substring(0, 10);
    const safeNotes      = String(notes || '').substring(0, 500);
    const safeItemsJson  = JSON.stringify(items).substring(0, 10000);
    const safeSubtotal   = parseFloat(subtotal) || 0;
    const safeDiscount   = parseFloat(discountRate) || 0;
    const safeTotal      = parseFloat(total) || 0;

    // Inserimento ordine in D1
    await env.DB.prepare(
      `INSERT OR IGNORE INTO orders (id, customer_name, pickup_time, notes, items_json, subtotal, discount_rate, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'nuovo')`
    ).bind(safeOrderId, safeName, safeTime, safeNotes, safeItemsJson, safeSubtotal, safeDiscount, safeTotal).run();

    // Aggiorna o crea il cliente nel CRM
    const now = new Date().toISOString();
    const existing = await env.DB.prepare(
      `SELECT id, order_count, total_spent FROM customers WHERE name = ? COLLATE NOCASE LIMIT 1`
    ).bind(safeName).first();

    if (existing) {
      await env.DB.prepare(
        `UPDATE customers SET order_count = order_count + 1, total_spent = total_spent + ?, last_order_at = ? WHERE id = ?`
      ).bind(safeTotal, now, existing.id).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO customers (name, order_count, total_spent, first_order_at, last_order_at) VALUES (?, 1, ?, ?, ?)`
      ).bind(safeName, safeTotal, now, now).run();
    }

    return new Response(JSON.stringify({ ok: true, orderId: safeOrderId }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
