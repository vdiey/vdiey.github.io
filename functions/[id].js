const ID_RE=/^[A-Za-z0-9]{5}$/;

async function notFound(context){
  // Let Pages serve public/404.html for unknown IDs.
  if(context.env?.ASSETS?.fetch){
    const url=new URL(context.request.url);
    url.pathname="/404.html";
    return context.env.ASSETS.fetch(new Request(url,context.request));
  }
  return new Response("404 - Short URL tidak ditemukan.",{
    status:404,headers:{"content-type":"text/plain; charset=UTF-8"}
  });
}

export async function onRequestGet(context){
  const id=String(context.params.id||"");

  // Only IDs of exactly 5 alphanumeric characters can ever redirect.
  if(!ID_RE.test(id)) return notFound(context);

  if(!context.env.URLS) return new Response("KV binding URLS belum dikonfigurasi.",{status:500});

  const destination=await context.env.URLS.get(id);
  if(!destination) return notFound(context);

  try{
    const target=new URL(destination);
    if(target.protocol!=="http:"&&target.protocol!=="https:")return notFound(context);
    return Response.redirect(target.toString(),302);
  }catch{
    return notFound(context);
  }
}

export async function onRequest(context){
  if(context.request.method!=="GET"&&context.request.method!=="HEAD"){
    return new Response("Method Not Allowed",{status:405,headers:{allow:"GET, HEAD"}});
  }
  return onRequestGet(context);
}
