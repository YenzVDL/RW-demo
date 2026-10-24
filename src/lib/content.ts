import 'server-only';
import {cache} from 'react';
import {draftMode} from 'next/headers';
import {cookies} from 'next/headers';
import {createHmac} from 'node:crypto';
import snapshot from '../../content/snapshot.json';
import {isVisible,releaseIssues} from './policy.mjs';
import type {SiteData,Unit} from './types';
import {validSignature} from './security';

export const production=()=>process.env.SITE_STAGE==='production';
export const siteUrl=()=>process.env.SITE_URL||'http://localhost:3000';
export async function cmsFetch(path:string, init:RequestInit={}) {
  const base=process.env.WORDPRESS_URL;
  if(!base) throw Error('WordPress URL ontbreekt');
  const u=new URL(base);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password) throw Error('Ongeldige CMS-host');
  for(let attempt=0;attempt<2;attempt++) {
    try {
      const r=await fetch(`${base.replace(/\/$/,'')}/wp-json/rwa/v1${path}`,{...init,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(7000)});
      if(!r.ok) throw Error(`CMS ${r.status}`);
      return await r.json();
    } catch(e) {if(attempt)throw e;}
  }
}
export const getSite=cache(async():Promise<SiteData>=>{
  if(process.env.CONTENT_MODE==='offline') {
    if(production()) throw Error('Offline preview is uitgesloten voor productie');
    return {...snapshot,units:(snapshot.units as Unit[]).filter(u=>isVisible(u)),mode:'offline'};
  }
  try {
    const data=await cmsFetch('/site');
    const draft=await draftMode();
    if(production()&&!draft.isEnabled&&releaseIssues(data.units).length) return {fetchedAt:'',units:[],logo:'/assets/rsz_1rsz_logorwa.png',mode:'wordpress',unavailable:true,blocked:true};
    const units=(data.units as Unit[]).filter(u=>isVisible(u,production()));
    if(draft.isEnabled) {
      const [id,expires,scope]=((await cookies()).get('rwa-preview-id')?.value||'').split(':');
      if(id&&/^\d+$/.test(id)&&Number(expires)>Date.now()/1000&&validSignature(process.env.PREVIEW_SECRET,`${expires}:${id}`,scope)) {
        const timestamp=Math.floor(Date.now()/1000).toString();
        const signature=createHmac('sha256',process.env.PREVIEW_SECRET!).update(`${timestamp}:${id}`).digest('hex');
        const preview=await cmsFetch(`/preview/${id}`,{headers:{'x-rwa-timestamp':timestamp,'x-rwa-signature':signature}});
        if(preview.unit){const i=units.findIndex(x=>x.key===preview.unit.key);if(i>=0)units[i]=preview.unit;else units.push(preview.unit);}
      }
    }
    return {...data,units,mode:'wordpress'};
  }catch{
    return {fetchedAt:'',units:[],logo:'/assets/rsz_1rsz_logorwa.png',mode:'wordpress',unavailable:true};
  }
});
export function unitByKey(site:SiteData,key:string){return site.units.find(u=>u.key===key);}
