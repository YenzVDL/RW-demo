import {draftMode,cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {fresh,validSignature} from '@/lib/security';
import {cmsFetch} from '@/lib/content';
import {createHmac} from 'node:crypto';
export async function GET(request:Request){
  const q=new URL(request.url).searchParams,id=q.get('id'),ts=q.get('ts'),sig=q.get('sig');
  if(!id||!/^\d+$/.test(id)||!fresh(ts)||!validSignature(process.env.PREVIEW_SECRET,`${ts}:${id}`,sig))return new Response('Unauthorized',{status:401});
  const timestamp=Math.floor(Date.now()/1000).toString();
  const signature=createHmac('sha256',process.env.PREVIEW_SECRET!).update(`${timestamp}:${id}`).digest('hex');
  let data;try{data=await cmsFetch(`/preview/${id}`,{headers:{'x-rwa-timestamp':timestamp,'x-rwa-signature':signature}});}catch{return new Response('Preview unavailable',{status:503});}
  const route=data.unit?.route;if(!route||!route.startsWith('/')||route.startsWith('//')||route.includes('\\'))return new Response('Invalid route',{status:400});
  (await draftMode()).enable();
  const expires=Math.floor(Date.now()/1000)+1800;
  const scope=createHmac('sha256',process.env.PREVIEW_SECRET!).update(`${expires}:${id}`).digest('hex');
  (await cookies()).set('rwa-preview-id',`${id}:${expires}:${scope}`,{httpOnly:true,sameSite:'lax',secure:process.env.SITE_STAGE==='production',path:'/',maxAge:1800});
  return new NextResponse(null,{status:307,headers:{Location:route,'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
}
