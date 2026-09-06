const ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH=5;
const MAX_URL_LENGTH=2048;

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,headers:{
      "content-type":"application/json; charset=UTF-8",
      "cache-control":"no-store"
    }
  });
}

function makeId(){
  const bytes=new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out="";
  for(const b of bytes) out+=ALPHABET[b%ALPHABET.length];
  return out;
}

function validUrl(value){
  if(typeof value!=="string"||!value||value.length>MAX_URL_LENGTH)return false;
  try{
    const u=new URL(value);
    return u.protocol==="http:"||u.protocol==="https:";
  }catch{return false}
}

export async function onRequestPost(context){
  if(!context.env.URLS)return json({error:"KV binding URLS belum dikonfigurasi."},500);
  const type=context.request.headers.get("content-type")||"";
  if(!type.toLowerCase().includes("application/json"))return json({error:"Content-Type harus application/json."},415);

  let body;
  try{body=await context.request.json()}catch{return json({error:"JSON tidak valid."},400)}

  const destination=typeof body?.url==="string"?body.url.trim():"";
  if(!validUrl(destination))return json({error:"URL tidak valid. Gunakan http:// atau https://."},400);

  for(let i=0;i<10;i++){
    const id=makeId();
    if(await context.env.URLS.get(id)!==null)continue;

    await context.env.URLS.put(id,destination);
    const origin=new URL(context.request.url).origin;
    return json({id,shortUrl:`${origin}/${id}`},201);
  }
  return json({error:"Tidak bisa mendapatkan ID unik. Coba lagi."},503);
}

export async function onRequest(context){
  if(context.request.method!=="POST")return json({error:"Method Not Allowed"},405);
  return onRequestPost(context);
}
