// /functions/api/homepage.js
// Endpoint pubblico GET - Restituisce configurazione homepage (bottoni + orari)

export async function onRequestGet(context) {
  const { env, request } = context;

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // Ricevi homepage buttons attivi ordinati per sort_order
    const buttonsData = await env.DB.prepare(
      `SELECT id, label, url, sort_order FROM homepage_buttons WHERE active = 1 ORDER BY sort_order ASC`
    ).all();

    // Ricevi opening_hours da settings
    const settingsData = await env.DB.prepare(
      `SELECT value FROM settings WHERE key = 'opening_hours'`
    ).first();

    let openingHours = {};
    if (settingsData && settingsData.value) {
      try {
        openingHours = JSON.parse(settingsData.value);
      } catch {
        openingHours = {};
      }
    }

    return new Response(JSON.stringify({
      buttons: buttonsData.results,
      opening_hours: openingHours
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
