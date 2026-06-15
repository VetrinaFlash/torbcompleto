// /functions/api/menu.js
// Endpoint pubblico GET - restituisce il menu dal database D1
// Formato compatibile con la menuData originale di menu.html

export async function onRequestGet(context) {
  const { env } = context;

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=60" // cache 60 secondi
  };

  try {
    // Legge categorie attive ordinate
    const cats = await env.DB.prepare(
      `SELECT id, name, icon FROM categories WHERE active = 1 ORDER BY sort_order ASC`
    ).all();

    // Legge prodotti attivi ordinati
    const prods = await env.DB.prepare(
      `SELECT id, category_id, name, description, price, image_url, mandatory_choice
       FROM products WHERE active = 1 ORDER BY sort_order ASC`
    ).all();

    // Legge tutte le opzioni (per i prodotti con scelta obbligatoria)
    const opts = await env.DB.prepare(
      `SELECT po.id, po.product_id, po.label
       FROM product_options po
       INNER JOIN products p ON p.id = po.product_id
       WHERE p.active = 1
       ORDER BY po.sort_order ASC, po.id ASC`
    ).all();

    // Raggruppa opzioni per product_id
    const optsByProduct = {};
    opts.results.forEach(o => {
      if (!optsByProduct[o.product_id]) optsByProduct[o.product_id] = [];
      optsByProduct[o.product_id].push({ id: o.id, label: o.label });
    });

    // Mappa prodotti per categoria
    const prodsByCategory = {};
    prods.results.forEach(p => {
      if (!prodsByCategory[p.category_id]) prodsByCategory[p.category_id] = [];
      prodsByCategory[p.category_id].push({
        id: p.id,
        name: p.name,
        desc: p.description || '',
        price: p.price,
        image_url: p.image_url || '',
        mandatory_choice: p.mandatory_choice === 1,
        options: optsByProduct[p.id] || []
      });
    });

    // Costruisce il formato compatibile con menuData
    const menuData = cats.results
      .filter(c => prodsByCategory[c.id] && prodsByCategory[c.id].length > 0)
      .map(c => ({
        id: c.id,
        category: c.name,
        icon: c.icon,
        items: prodsByCategory[c.id] || []
      }));

    return new Response(JSON.stringify(menuData), { headers: corsHeaders });

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
