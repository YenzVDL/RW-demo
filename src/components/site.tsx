/* eslint-disable @next/next/no-html-link-for-pages -- Preview exit and retry require an uncached full-page request. */
import Link from 'next/link';
import {draftMode} from 'next/headers';
import type {SiteData,Unit} from '@/lib/types';
import {richtext} from '@/lib/richtext';
import {unitByKey} from '@/lib/content';
import {isApproved} from '@/lib/policy.mjs';
import {LanguageSwitch,Navigation,Media} from './interface';

export function Arrow(){return <span aria-hidden="true">↗</span>;}
export function PhoneIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a15 15 0 0 1-7-7l2-2-2-5Z"/></svg>;}
function LegalSymbol({category}:{category?:string}){
  return <svg className="legal-symbol" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {category==='huurrecht'?<><path d="m9 34 31-23 31 23M17 29v39h46V29M33 68V48h15v20M26 36h5m18 0h5"/><path d="M5 73h69"/></>:category==='arbeidsrecht'?<><path d="M12 28h56v39H12zM29 28V17h22v11M12 42l28 9 28-9M36 46v11h8V46"/><path d="M7 73h67"/></>:<><path d="M22 11h37v58l-6-4-6 4-6-4-6 4-6-4-7 4V11Z"/><path d="M30 25h21M30 35h21M30 47h10M47 47h4M13 20v44"/></>}
  </svg>;
}
export function Review({unit,en=false}:{unit?:Unit;en?:boolean}) {
  if(!unit||isApproved(unit))return null;
  const labels={source_imported:en?'Existing text — pending review':'Bestaande tekst — nog te controleren',needs_confirmation:en?'To be confirmed':'Te bevestigen',proposed:en?'Proposed text':'Tekstvoorstel',approved:''};
  return <span className={`review ${unit.editorialStatus}`}>{labels[unit.editorialStatus]}</span>;
}
export function Rich({unit,en=false}:{unit:Unit;en?:boolean}){return <><Review unit={unit} en={en}/><div className="prose" dangerouslySetInnerHTML={{__html:richtext(unit.html)}}/></>;}
export function Channel({unit}:{unit:Unit}){return <><Review unit={unit}/>{unit.schedule&&<p className="channel-schedule">{unit.schedule}</p>}{unit.appointmentRule&&<p className="channel-rule">{unit.appointmentRule}</p>}{unit.purpose&&<p>{unit.purpose}</p>}{unit.html&&<div className="prose" dangerouslySetInnerHTML={{__html:richtext(unit.html)}}/>}</>;}
export function Board({site}:{site:SiteData}){const board=site.units.filter(u=>u.kind==='person'&&u.group==='board'&&u.active);return <section className="board"><h2>Het bestuur</h2>{board.length?<dl>{board.map(u=><div key={u.key}><dt>{u.role}</dt><dd>{u.title}{u.period&&<> · {u.period}</>} <Review unit={u}/></dd></div>)}</dl>:<p className="notice">Het actuele bestuur moet nog worden bevestigd.</p>}</section>;}
export function Source({unit}:{unit:Unit}) {return <p className="source">Bron: <a href={unit.sourceUrl}>bestaande website</a> · opgehaald {new Intl.DateTimeFormat('nl-NL',{dateStyle:'long',timeZone:'Europe/Amsterdam'}).format(new Date(unit.fetchedAt))}. {unit.kind==='article'?'Juridische actualiteit moet nog worden beoordeeld.':''}</p>;}
export function tel(phone:string){return 'tel:'+phone.replace(/[^+\d]/g,'');}
export async function Header({site,en}:{site:SiteData;en:boolean}){
  const contact=unitByKey(site,'contact');
  const pairs:Record<string,string>={'/':'/en','/en':'/'};
  site.units.forEach(u=>{const other=site.units.find(x=>x.key===u.translationKey);if(u.route&&other?.route)pairs[u.route]=other.route;});
  const nav=site.units.filter(u=>u.kind==='navigation'&&u.language===(en?'en':'nl'));
  const links=nav.length?nav.map(u=>({href:u.route,label:u.title})):en?[{href:'/en',label:'Home'},{href:'/en/contact',label:'Contact & consultation'},{href:'/en/about/svra',label:'SVRA'}]:[
    {href:'/juridische-hulp',label:'Juridische hulp'}, {href:'/spreekuur-en-contact',label:'Spreekuur en contact'}, {href:'/over-ons',label:'Over ons'}, {href:'/vrijwilliger-worden',label:'Vrijwilliger worden'}];
  const preview=(await draftMode()).isEnabled;
  return <><a className="skip" href="#main">{en?'Skip to content':'Direct naar inhoud'}</a>
    {(process.env.SITE_STAGE!=='production'||preview)&&<div className="stage-bar"><div className="wrap">{preview?<><strong>Conceptpreview</strong><a href="/api/preview/exit">Preview sluiten</a></>:<><span><strong>{site.mode==='offline'?'Offline preview':'Staging'}</strong> <span className="stage-detail">· {en?'Content pending review':'Inhoud ter controle'}{site.mode==='offline'&&site.fetchedAt?` · bron: ${site.fetchedAt.slice(0,10)}`:''}</span></span><span className="stage-detail">{en?'Not indexed by search engines':'Niet geïndexeerd door zoekmachines'}</span></>}</div></div>}
    <header className="site-header"><div className="wrap header-inner"><Link href={en?'/en':'/'} className="brand" aria-label="Rechtswinkel Amsterdam — home"><img src={site.logo} width="260" height="75" alt="Rechtswinkel Amsterdam"/></Link><Navigation links={links} en={en}/><div className="header-actions"><LanguageSwitch pairs={pairs}/>{contact?.phone&&<a className="phone-header" href={tel(contact.phone)} aria-label={`${en?'Call':'Bel'} ${contact.phone}`}><span><PhoneIcon/></span> <span>{contact.phone}</span></a>}</div></div></header></>;
}
export function Footer({site,en}:{site:SiteData;en:boolean}) {
  if(site.unavailable)return <footer className="site-footer"><div className="wrap">Stichting Rechtswinkel Amsterdam</div></footer>;
  const contact=unitByKey(site,'contact');
  return <footer className="site-footer"><div className="wrap"><div className="footer-top"><div><p className="eyebrow">STICHTING RECHTSWINKEL AMSTERDAM</p><p className="footer-heading">{en?'Legal advice.':'Juridisch advies.'}<br/>{en?'Completely free of charge.':'Geheel gratis.'}</p></div><div><h2>{en?'Contact':'Spreekuur en contact'}</h2>{contact?.address&&<p>{contact.address}</p>}{contact?.phone&&<p><a href={tel(contact.phone)}>{contact.phone}</a></p>}{contact?.email&&<p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>}<Review unit={contact} en={en}/></div><div><h2>{en?'Explore':'Verder lezen'}</h2>{en?<><Link href="/en/contact">Contact & consultation</Link><Link href="/en/about/svra">SVRA</Link></>:<><Link href="/over-ons/team">De medewerkers</Link><Link href="/over-ons/verantwoording">ANBI & jaarverslagen</Link><Link href="/vrijwilliger-worden">Vrijwilliger worden</Link></>}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Stichting Rechtswinkel Amsterdam</span><div><Link href="/privacyverklaring">Privacyverklaring{en?' (Dutch)':''}</Link><Link href="/algemene-voorwaarden">Algemene voorwaarden{en?' (Dutch)':''}</Link></div></div></div></footer>;
}
export function Areas({site}:{site:SiteData}) {
  return <div className="area-list">{site.units.filter(u=>u.kind==='area').map(u=><Link href={u.route} key={u.key} className="area-row"><LegalSymbol category={u.category}/><div className="area-label"><h3>{u.title}</h3><Review unit={u}/></div><div className="area-topics">{site.units.filter(x=>x.kind==='article'&&x.category===u.category).slice(0,1).map(x=><span key={x.key}>{x.title}</span>)}</div><span className="area-arrow"><Arrow/></span></Link>)}</div>;
}
export function Partners({site}:{site:SiteData}){
  const partners=site.units.filter(u=>u.kind==='partner');
  if(!partners.length)return null;
  return <section className="partners wrap"><div className="section-heading"><h2>Met steun van</h2><Link href="/over-ons/partners">Onze partners <Arrow/></Link></div><Review unit={unitByKey(site,'partners')}/><div className="partner-logos">{partners.map(p=><div key={p.key}>{p.image?<Media src={p.image} alt={p.title}/>:p.title}</div>)}</div></section>;
}
export function Unavailable({en=false,blocked=false}:{en?:boolean;blocked?:boolean}){return <section className="wrap unavailable"><p className="eyebrow">{en?'Content unavailable':'Inhoud niet beschikbaar'}</p><h1>{blocked?(en?'The website content is under review.':'De inhoud van deze website wordt nog gecontroleerd.'):(en?'We cannot load the information right now.':'We kunnen de informatie nu niet ophalen.')}</h1><p>{blocked?(en?'This website has not yet been released for publication.':'De website is nog niet vrijgegeven voor publicatie.'):(en?'Please try again later. Contact details and hours are unavailable.':'Probeer het later opnieuw. Contactgegevens en tijden zijn nu niet beschikbaar.')}</p><a href="/">{en?'Try again':'Opnieuw proberen'} <Arrow/></a></section>;}
