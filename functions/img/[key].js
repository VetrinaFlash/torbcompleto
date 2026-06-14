// /functions/img/[key].js
// Endpoint pubblico per servire le immagini da Cloudflare R2
// Nota: gestisce path semplici tipo /img/products/abc123.jpg
// Il parametro key cattura solo il primo segmento - per path nested si usa la riscrittura sotto

export async function onRequestGet(context) {
  const { env, request } = context;

  if (!env.IMAGES) {
    return new Response('R2 non configurato', { status: 503 });
  }

  // Estrae il path completo dopo /img/
  const url  = new URL(request.url);
  const key  = url.pathname.replace(/^\/img\//, '');

  if (!key) return new Response('Chiave mancante', { status: 400 });

  try {
    const object = await env.IMAGES.get(key);

    if (!object) {
      return new Response('Immagine non trovata', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });

  } catch (err) {
    return new Response('Errore: ' + err.message, { status: 500 });
  }
}
