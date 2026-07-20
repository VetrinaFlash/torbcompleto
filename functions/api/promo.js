// /functions/api/promo.js
// Endpoint pubblico POST - Valida e restituisce dettagli del promo code

export async function onRequestPost(context) {
  const { env, request } = context;

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({ error: 'Codice promo obbligatorio' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const safeCode = String(code).toUpperCase().substring(0, 50).trim();

    // Cercapromo code attivo
    const promoData = await env.DB.prepare(
      `SELECT id, code, discount_type, value, active FROM promo_codes WHERE code = ? COLLATE NOCASE AND active = 1 LIMIT 1`
    ).bind(safeCode).first();

    if (!promoData) {
      return new Response(JSON.stringify({ error: 'Codice promo non valido o non attivo' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Restituisci i dati del promo code per calcolo lato frontend
    return new Response(JSON.stringify({
      ok: true,
      promo: {
        code: promoData.code,
        discount_type: promoData.discount_type,
        value: promoData.value
      }
    }), { headers: corsHeaders });

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
