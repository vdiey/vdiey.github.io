const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 5;
const MAX_ATTEMPTS = 10;

function makeId() {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);

  let id = "";
  for (const byte of bytes) {
    id += ALPHABET[byte % ALPHABET.length];
  }
  return id;
}

export async function onRequestPost(context) {
  const kv = context.env.URLS;

  if (!kv) {
    return Response.json(
      { error: "KV binding URLS is not configured." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const destination = typeof body?.destination === "string"
    ? body.destination.trim()
    : "";

  if (!destination || destination.length > 2048) {
    return Response.json(
      { error: "Destination URL is required and must be at most 2048 characters." },
      { status: 400 }
    );
  }

  let target;
  try {
    target = new URL(destination);
  } catch {
    return Response.json(
      { error: "Destination must be a valid URL." },
      { status: 400 }
    );
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return Response.json(
      { error: "Only http:// and https:// destinations are allowed." },
      { status: 400 }
    );
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const id = makeId();
    const existing = await kv.get(id);

    if (existing === null) {
      await kv.put(id, target.toString());

      const origin = new URL(context.request.url).origin;
      return Response.json(
        {
          id,
          shortUrl: `${origin}/${id}`
        },
        { status: 201 }
      );
    }
  }

  return Response.json(
    { error: "Could not generate a unique short URL. Please try again." },
    { status: 503 }
  );
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" }
  });
}
