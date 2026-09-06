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

    // 2. PRIORITAS: CEK FILE FISIK (watch.html, download.html, url/index.html)
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      return asset;
    }

    // 3. LOGIKA REDIRECT + CEK NEGARA (Hanya untuk ID 5 karakter)
    if (id.length === 5) {
      const longUrl = await env.URL_DB.get(id);
      
      if (longUrl) {
        // Ambil kode negara dari Cloudflare
        const country = request.cf.country; 

        // JIKA PENGUNJUNG DARI INDONESIA
        if (country === "ID") {
          return Response.redirect(longUrl, 301);
        } else {
          // JIKA LUAR NEGERI, LEMPAR KE 404
          const errorPage = await env.ASSETS.fetch(new URL("/404.html", request.url));
          return new Response(errorPage.body, {
            ...errorPage,
            status: 404,
            headers: { "Content-Type": "text/html" }
          });
        }
      }
    }

    // 4. JIKA ASAL KETIK (BUKAN 5 KARAKTER) & FILE TIDAK ADA
    const errorPage = await env.ASSETS.fetch(new URL("/404.html", request.url));
    return new Response(errorPage.body, {
      ...errorPage,
      status: 404,
      headers: { "Content-Type": "text/html" }
    });
  }
};
