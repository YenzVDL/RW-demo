'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState,useRef} from 'react';
import type {Unit} from '@/lib/types';
import {activeAt,isApproved} from '@/lib/policy.mjs';

export function LanguageSwitch({pairs}:{pairs:Record<string,string>}) {
  const path=usePathname(); const en=path.startsWith('/en');
  const target=pairs[path]||`${en?'/':'/en/'}translation-unavailable?from=${encodeURIComponent(path)}`;
  return <a className="language" href={target} hrefLang={en?'nl':'en'} aria-label={en?'Nederlands':'English'}><span aria-hidden="true">◎</span> {en?'NL':'EN'} <span aria-hidden="true">↗</span></a>;
}
export function Navigation({links,en}:{links:{href:string;label:string}[];en:boolean}){
  const path=usePathname();const [open,setOpen]=useState(false);
  return <><button className="menu-toggle" onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls="primary-nav">{open?(en?'Close':'Sluiten'):'Menu'} <span aria-hidden="true">{open?'×':'☰'}</span></button><nav id="primary-nav" aria-label={en?'Main navigation':'Hoofdnavigatie'} className={open?'nav open':'nav'}>{links.map(l=><Link key={l.href} href={l.href} onClick={()=>setOpen(false)} aria-current={path===l.href?'page':undefined}>{l.label}</Link>)}</nav></>;
}
const anchors:Record<string,string>={inloopspreekuur:'/spreekuur-en-contact',contact:'/spreekuur-en-contact',overons:'/over-ons',werkenbij:'/vrijwilliger-worden',zakelijk:'/over-ons/partners',svra:'/over-ons/svra',vgv:'/juridische-hulp'};
export function LegacyAnchors(){useEffect(()=>{if(location.pathname==='/'){const target=anchors[location.hash.slice(1)];if(target)location.replace(target);}},[]);return null;}
export function Media({src,alt,className,srcSet}:{src:string;alt:string;className?:string;srcSet?:string}){
  const [failedFor,setFailedFor]=useState<string>();const ref=useRef<HTMLImageElement>(null);
  useEffect(()=>{const el=ref.current;if(el?.complete&&el.naturalWidth===0)queueMicrotask(()=>setFailedFor(src));},[src]);
  return failedFor===src?<span className="media-fallback">{alt}</span>:<img ref={ref} src={src} srcSet={srcSet||undefined} sizes={srcSet?'(max-width: 680px) 45vw, (max-width: 1180px) 20vw, 260px':undefined} alt={alt} className={className} loading="lazy" onError={()=>setFailedFor(src)}/>;
}
export function NoticeList({notices,now:initialNow,en}:{notices:Unit[];now:number;en:boolean}){
  const [now,setNow]=useState(initialNow);
  useEffect(()=>{
    const dates=notices.flatMap(u=>[u.startsAt,u.endsAt]).filter(Boolean).map(d=>Date.parse(d!)).filter(d=>d>now);
    if(!dates.length)return;
    const timer=setTimeout(()=>setNow(Date.now()),Math.min(Math.min(...dates)-Date.now()+25,2147483647));
    return ()=>clearTimeout(timer);
  },[notices,now]);
  const active=notices.filter(u=>activeAt(u,now));
  if(!active.length)return null;
  return <section className="notice-list" aria-label={en?'Current notices':'Actuele meldingen'} aria-live="polite"><div className="wrap">{active.map(u=><article key={u.key}><strong>{u.title}</strong>{!isApproved(u)&&<span className="review">{u.editorialStatus==='proposed'?(en?'Proposed text':'Tekstvoorstel'):(en?'To be confirmed':'Te bevestigen')}</span>}<div dangerouslySetInnerHTML={{__html:u.html}}/>{u.appliesTo&&<a href={(en?'/en/contact':'/spreekuur-en-contact')+'#'+u.appliesTo}>{en?'Contact information':'Spreekuur en contact'} ↗</a>}</article>)}</div></section>;
}
