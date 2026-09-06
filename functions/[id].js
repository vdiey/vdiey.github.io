export async function onRequestGet(context) {
  const { params, env, request } = context;
  const id = params.id;

  // 1. Ambil data dari KV
  const longUrl = await env.URL_DB.get(id);

  if (longUrl) {
    // 2. Jika ID ditemukan, redirect ke link asli
    return Response.redirect(longUrl, 302);
  }

  // 3. JIKA ID TIDAK DITEMUKAN:
  // Ambil URL dasar (origin) contoh: https://viedey.pages.dev
  const url = new URL(request.url);
  
  // Arahkan (Redirect) ke halaman 404.html yang kita buat tadi
  return Response.redirect(`${url.origin}/404.html`, 302);
}
