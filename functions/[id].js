export async function onRequestGet(context) {
  const { params, env, request } = context;
  const id = params.id;

  const longUrl = await env.URL_DB.get(id);

  if (longUrl) {

    return Response.redirect(longUrl, 302);
  }

  const url = new URL(request.url);
  
  return Response.redirect(`${url.origin}/404.html`, 302);
}
