// /functions/api/settings.js
// Endpoint pubblico GET - restituisce solo le impostazioni necessarie al menu

export async function onRequestGet(context) {
  const { env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60'
  };

  try {
    const rows = await env.DB.prepare(
      `SELECT key, value FROM settings WHERE key IN ('store_override_open', 'opening_hours', 'promo_bar_text')`
    ).all();

    const settings = {
      store_override_open: '',
      opening_hours: '',
      promo_bar_text: ''
    };

    rows.results.forEach(row => {
      settings[row.key] = row.value;
    });

    return new Response(JSON.stringify(settings), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}