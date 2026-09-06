export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params.id;

  // Ambil data dari KV
  const longUrl = await env.URL_DB.get(id);

  if (longUrl) {
    // Redirect ke link asli
    return Response.redirect(longUrl, 302);
  }

  // Jika ID tidak ada di database, kirim ke halaman 404 atau balik ke home
  return new Response("Link tidak ditemukan atau sudah kadaluarsa.", { status: 404 });
}
