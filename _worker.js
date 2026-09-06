export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname; // Contoh: "/T8v2R" atau "/url"
    const id = path.substring(1); // Mengambil ID setelah tanda "/"

    // 1. API UNTUK GENERATE (POST)
    if (path === "/api/generate" && request.method === "POST") {
      try {
        const { longUrl } = await request.json();
        if (!longUrl) return new Response("URL kosong", { status: 400 });

        // Generate 5 karakter acak
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let shortId = "";
        for (let i = 0; i < 5; i++) {
          shortId += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Simpan ke KV
        await env.URL_DB.put(shortId, longUrl);

        return new Response(JSON.stringify({ shortId }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response("Error", { status: 500 });
      }
    }

    // 2. LOGIK REDIRECT ID 5 KARAKTER
    // Jika panjang path adalah 5 karakter (misal vdiy.pages.dev/T8v2R)
    if (id.length === 5) {
      const longUrl = await env.URL_DB.get(id);
      if (longUrl) {
        return Response.redirect(longUrl, 301);
      } else {
        // Jika 5 karakter tapi tidak terdaftar di database, arahkan ke 404
        return env.ASSETS.fetch(new URL("/404.html", request.url));
      }
    }

    // 3. LAYANI FILE STATIS (Termasuk /url/index.html)
    // Biarkan Cloudflare Pages mencari file di folder asli
    const response = await env.ASSETS.fetch(request);

    // 4. JIKA FILE TIDAK DITEMUKAN (Status 404)
    // Jika orang asal ngetik (misal /abc atau /halo-dunia), arahkan ke 404
    if (response.status === 404) {
      return env.ASSETS.fetch(new URL("/404.html", request.url));
    }

    return response;
  }
};
