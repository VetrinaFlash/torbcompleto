// /functions/admin/upload.js
// POST protetta - carica un'immagine su Cloudflare R2
// Accetta multipart/form-data con campo "file"
// Restituisce l'URL pubblico dell'immagine: /img/{filename}

import { getSession, unauthorizedResponse } from '../_shared/auth.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB max
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function onRequestPost(context) {
  const { env, request } = context;

  const secret = env.ADMIN_TOKEN_SECRET || 'torb-secret-fallback-changeme';
  const session = await getSession(request, secret);
  if (!session) return unauthorizedResponse();

  const JSON_HEADERS = { 'Content-Type': 'application/json' };

  // Verifica che R2 sia configurato
  if (!env.IMAGES) {
    return new Response(JSON.stringify({
      error: 'R2 non configurato. Aggiungi il binding IMAGES nel pannello Cloudflare Pages.'
    }), { status: 503, headers: JSON_HEADERS });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'Nessun file ricevuto' }), { status: 400, headers: JSON_HEADERS });
    }

    // Validazione tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Tipo file non supportato. Usa JPG, PNG, WebP o GIF.' }), { status: 400, headers: JSON_HEADERS });
    }

    // Validazione dimensione
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File troppo grande. Massimo 5MB.' }), { status: 400, headers: JSON_HEADERS });
    }

    // Genera nome file univoco
    const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2,'0')).join('');
    const key = `products/${randomHex}.${ext}`;

    // Carica su R2
    await env.IMAGES.put(key, buffer, {
      httpMetadata: { contentType: file.type }
    });

    // Restituisce URL relativo (servito da /img/{key})
    const url = `/img/${key}`;
    return new Response(JSON.stringify({ ok: true, url }), { headers: JSON_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
}
