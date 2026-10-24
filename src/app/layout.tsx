import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {getSite,production,siteUrl} from '@/lib/content';
import {Header,Footer} from '@/components/site';
import {LegacyAnchors,NoticeList} from '@/components/interface';
import {richtext} from '@/lib/richtext';
import './globals.css';
import './identity.css';
export const dynamic='force-dynamic';
export async function generateMetadata():Promise<Metadata>{return {metadataBase:new URL(siteUrl()),title:{default:'Rechtswinkel Amsterdam · Gratis juridisch advies',template:'%s · Rechtswinkel Amsterdam'},robots:production()?{index:true,follow:true}:{index:false,follow:false}};}
export default async function RootLayout({children}:{children:React.ReactNode}){
  const site=await getSite();const en=(await headers()).get('x-rwa-lang')==='en';
  // eslint-disable-next-line react-hooks/purity -- Dynamic server render supplies one timestamp for matching SSR and client hydration.
  return <html lang={en?'en':'nl'}><body><Header site={site} en={en}/><NoticeList notices={site.units.filter(u=>u.kind==='notice'&&u.language===(en?'en':'nl')).map(u=>({...u,html:richtext(u.html)}))} now={Date.now()} en={en}/><main id="main" tabIndex={-1}>{children}</main><Footer site={site} en={en}/><LegacyAnchors/></body></html>;
}
