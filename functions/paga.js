// 1. Questa funzione riceve i dati del carrello (metodo POST)
export async function onRequestPost(context) {
  const { env, request } = context;

  // Intestazioni per evitare blocchi del browser
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body = await request.json();
    const cartItems = body.items || [];
    const sumupToken = env.SUMUP_SECRET_KEY || env.SUMUP_ACCESS_TOKEN || env.SUMUP_TOKEN;
    const sumupEmail = env.SUMUP_EMAIL || env.SUMUP_PAY_TO_EMAIL;

    if (!sumupToken || !sumupEmail) {
      return new Response(JSON.stringify({
        error: 'Configurazione SumUp mancante',
        details: 'Imposta SUMUP_SECRET_KEY (o SUMUP_ACCESS_TOKEN) e SUMUP_EMAIL nelle variabili ambiente di Cloudflare Pages.'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Calcola il totale
    let totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    totalAmount = Math.round(totalAmount * 100) / 100;

    // Invia la richiesta a SumUp
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sumupToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkout_reference: `TOR-${Date.now()}`,
        amount: totalAmount,
        currency: "EUR",
        pay_to_email: sumupEmail,
        description: "Ordine TORB"
      })
    });

    const responseText = await response.text();
    let data = {};
    try { data = responseText ? JSON.parse(responseText) : {}; } catch { data = { raw: responseText }; }

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: 'SumUp ha rifiutato la richiesta',
        status: response.status,
        details: data.error || data.message || data.raw || 'Risposta non disponibile'
      }), {
        status: 502,
        headers: corsHeaders
      });
    }

    // Restituisce l'ID di SumUp al tuo menu.html
return new Response(JSON.stringify({ checkoutId: data.id }), {
	  status: 200, 
      headers: corsHeaders 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// 2. Questa funzione risponde alle verifiche di sicurezza del browser (metodo OPTIONS)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}