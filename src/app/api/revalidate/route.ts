import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {fresh,validSignature} from '@/lib/security';
const seen=new Map<string,number>();
export async function POST(request:Request){
  if(Number(request.headers.get('content-length')||0)>16384)return new Response('Payload too large',{status:413});
  const raw=await request.text();if(raw.length>16384)return new Response('Payload too large',{status:413});
  const ts=request.headers.get('x-rwa-timestamp'),sig=request.headers.get('x-rwa-signature');
  if(!fresh(ts)||!validSignature(process.env.REVALIDATE_SECRET,`${ts}.${raw}`,sig))return new Response('Unauthorized',{status:401});
  for(const [k,v] of seen)if(v<Date.now()-300000)seen.delete(k);
  if(seen.has(sig!))return new Response('Replay',{status:409});
  seen.set(sig!,Date.now());
  revalidatePath('/','layout');
  return NextResponse.json({revalidated:true});
}
