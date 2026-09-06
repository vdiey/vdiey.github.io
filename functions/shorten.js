export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { longUrl } = await request.json();
    if (!longUrl) return new Response("Missing URL", { status: 400 });

    // Generate 5 karakter acak
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // SIMPAN KE KV (Database)
    // env.URL_DB adalah nama binding yang harus dibuat di dashboard
    await env.URL_DB.put(id, longUrl);

    const shortUrl = `${new URL(request.url).origin}/${id}`;
    
    return new Response(JSON.stringify({ shortUrl }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
