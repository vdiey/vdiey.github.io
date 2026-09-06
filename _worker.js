export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const id = path.replace("/", "");

    // 1. API GENERATE (Tetap sama)
    if (path === "/api/generate" && request.method === "POST") {
      try {
        const { longUrl } = await request.json();
        if (!longUrl) return new Response("URL kosong", { status: 400 });
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let shortId = "";
        for (let i = 0; i < 5; i++) {
          shortId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        await env.URL_DB.put(shortId, longUrl);
        return new Response(JSON.stringify({ shortId }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response("Error", { status: 500 });
      }
    }

    // 2. PRIORITAS: CEK FILE FISIK (watch.html, download.html, dll)
    // Kita coba ambil filenya dulu dari sistem asset Cloudflare
    const asset = await env.ASSETS.fetch(request);
    
    // Jika file ditemukan (status 200), langsung tampilkan
    if (asset.status !== 404) {
      return asset;
    }

    // 3. JIKA FILE TIDAK DITEMUKAN, BARU CEK SHORT URL (5 Karakter)
    if (id.length === 5) {
      const longUrl = await env.URL_DB.get(id);
      if (longUrl) {
        return Response.redirect(longUrl, 301);
      }
      // Jika 5 karakter tapi tidak ada di KV, biarkan lanjut ke bawah untuk kena 404.html
    }

    // 4. JIKA SEMUA GAGAL, TAMPILKAN LANDING PAGE 404 (Untuk link asal-asalan)
    const errorPage = await env.ASSETS.fetch(new URL("/404.html", request.url));
    return new Response(errorPage.body, {
      ...errorPage,
      status: 404,
      headers: { "Content-Type": "text/html" }
    });
  }
};
