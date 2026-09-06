const ID_RE = /^[A-Za-z0-9]{5}$/;

async function notFound(context) {
  const url = new URL("/404.html", context.request.url);
  return context.env.ASSETS.fetch(new Request(url, { method: "GET" }));
}

export async function onRequestGet(context) {
  const id = context.params.id;

  if (typeof id !== "string" || !ID_RE.test(id)) {
    return notFound(context);
  }

  const kv = context.env.URLS;
  if (!kv) {
    return new Response("KV binding URLS is not configured.", { status: 500 });
  }

  const destination = await kv.get(id);

  if (!destination) {
    return notFound(context);
  }

  let target;
  try {
    target = new URL(destination);
  } catch {
    return new Response("Invalid destination stored for this short URL.", { status: 500 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("Invalid destination protocol.", { status: 500 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET" || context.request.method === "HEAD") {
    return onRequestGet(context);
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, HEAD" }
  });
}
