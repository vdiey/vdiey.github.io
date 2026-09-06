export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace("/", "");

    // 1. Halaman Landing Page (Generator) ada di /url
    if (path === "url" || path === "url/") {
      return env.ASSETS.fetch(request);
    }

    // 2. API untuk Generate Link (Dipanggil dari frontend)
    if (path === "api/generate" && request.method === "POST") {
      const { longUrl } = await request.json();
      if (!longUrl) return new Response("URL Kosong", { status: 400 });

      // Generate 5 Karakter Random
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let shortId = "";
      for (let i = 0; i < 5; i++) {
        shortId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Simpan ke KV Storage
      await env.URL_DB.put(shortId, longUrl);

      return new Response(JSON.stringify({ shortId }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Handle Redirect untuk ID 5 Karakter
    if (path.length === 5) {
      const redirectUrl = await env.URL_DB.get(path);
      
      if (redirectUrl) {
        return Response.redirect(redirectUrl, 301);
      } else {
        // Jika ID 5 karakter tidak ditemukan, kirim ke 404
        return env.ASSETS.fetch(new URL("/404.html", request.url));
      }
    }

    // 4. Default: Jika asal-asalan (bukan 5 karakter & bukan /url), kirim ke 404
    if (path !== "" && path !== "favicon.ico") {
       return env.ASSETS.fetch(new URL("/404.html", request.url));
    }

    return env.ASSETS.fetch(request);
  }
};
