import Link from 'next/link';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getSite,unitByKey,production} from '@/lib/content';
import type {SiteData,Unit} from '@/lib/types';
import {Arrow,Areas,Partners,Rich,Review,Source,Unavailable,tel,Channel,Board} from '@/components/site';
import {Media} from '@/components/interface';
import {isApproved,activeAt} from '@/lib/policy.mjs';

type Props={params:Promise<{slug?:string[]}>};
const routeFrom=(slug?:string[])=>'/'+(slug||[]).join('/');
const indexTitles:Record<string,string>={'/':'Juridisch advies. Geheel gratis.','/juridische-hulp':'Juridische hulp','/en':'Legal advice. Completely free of charge.'};
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const route=routeFrom((await params).slug),site=await getSite(),u=site.units.find(u=>u.route===route);
  const translated=site.units.find(x=>x.key===u?.translationKey);
  return {title:indexTitles[route]||u?.title||'Informatie',alternates:{canonical:route,languages:u&&translated?.route?{[u.language]:u.route,[translated.language]:translated.route}:undefined},robots:site.unavailable||!production()||!!(u&&!isApproved(u))?{index:false,follow:false}:{index:true,follow:true}};
}
function PageHeading({title,eyebrow='RECHTSWINKEL AMSTERDAM',children}:{title:string;eyebrow?:string;children?:React.ReactNode}){return <div className="page-heading"><div className="wrap"><Link className="back" href="/">← Home</Link><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</div></div>;}
function Home({site,en}:{site:SiteData;en:boolean}){
  const intro=unitByKey(site,en?'home-en':'home-intro');const phone=unitByKey(site,'contact');const channel=unitByKey(site,'phone');
  const about=unitByKey(site,'about-intro');
  return <>
    <section className="hero wrap"><div className="hero-copy"><p className="eyebrow"><span className="red-rule"/> STICHTING RECHTSWINKEL AMSTERDAM</p><h1>{en?'Legal advice.':'Juridisch advies.'}<br/><em>{en?'Completely free.':'Geheel gratis.'}</em></h1>{intro&&<div className="hero-intro"><Rich unit={intro} en={en}/></div>}<div className="hero-actions"><Link className="button" href={en?'/en/contact':'/spreekuur-en-contact'}>{en?'Contact & consultation':'Zo krijgt u advies'} <Arrow/></Link>{!en&&<Link className="text-link" href="/juridische-hulp">Waarmee kunnen we helpen? <span aria-hidden="true">↓</span></Link>}</div></div>
    <aside className="contact-note"><p className="eyebrow">{en?'CONTACT':'BEL MET UW VRAAG'}</p>{phone?.phone?<a className="hero-number" href={tel(phone.phone)}>{phone.phone}<Arrow/></a>:<h2>{en?'Contact information pending review':'Contactgegevens nog te bevestigen'}</h2>}<Review unit={phone} en={en}/>{phone&&!en&&<p className="small-prose">{channel?.schedule}</p>}<div className="contact-note-bottom"><span className="mini-icon" aria-hidden="true">↳</span><Link href={en?'/en/contact':'/spreekuur-en-contact'}>{en?'Consultation on location':'Liever langskomen?'}<span>{en?'View contact information':'Bekijk spreekuur en contact'} <Arrow/></span></Link></div></aside></section>
    {!en&&<><section className="legal-section"><div className="wrap legal-grid"><div className="section-intro"><p className="eyebrow">JURIDISCHE HULP</p><h2>Waar gaat<br/>uw vraag over?</h2><p>Arbeidsrecht, huurrecht en consumentenrecht.</p><Review unit={unitByKey(site,'area-huurrecht')}/></div><Areas site={site}/></div></section>
    <section className="wrap how-section"><div className="section-heading"><div><p className="eyebrow">ONZE WERKWIJZE</p><h2>Een eerste stap naar advies.</h2></div><Link href="/spreekuur-en-contact">Alle contactmogelijkheden <Arrow/></Link></div><div className="steps">{['phone','walkin','appointment'].map((key,i)=>{const u=unitByKey(site,key);return u&&<article key={key}><div className="step-number">0{i+1}<span aria-hidden="true">{['↗','↳','→'][i]}</span></div><h3>{u.title}</h3><Channel unit={u}/></article>;})}</div></section>
    {about&&<section className="about-band"><div className="wrap about-grid"><div><p className="eyebrow">OVER ONS</p><h2>De Rechtswinkel.<br/> Voor Amsterdam.</h2></div><div><Rich unit={about}/><Link className="text-link" href="/over-ons">Meer over de Rechtswinkel <Arrow/></Link></div></div></section>}
    <Partners site={site}/></>}
    {en&&<section className="wrap english-content"><h2>Contact & consultation</h2><p>Labour law · tenancy law · consumer law</p><p className="notice">The Dutch and English source pages contain different consultation details. These details need confirmation.</p><Link className="button" href="/en/contact">View existing contact information <Arrow/></Link><p><Link href="/en/about/svra">Stichting Vrienden Rechtswinkel Amsterdam <Arrow/></Link></p></section>}
  </>;
}
function ArticleList({site,category}:{site:SiteData;category:string}){return <div className="article-list">{site.units.filter(u=>u.kind==='article'&&u.category===category).map(u=><Link key={u.key} href={u.route}><div><h2>{u.title}</h2><Review unit={u}/></div><Arrow/></Link>)}</div>;}
function PageContent({site,unit,en}:{site:SiteData;unit:Unit;en:boolean}){
  if(unit.kind==='recruitment'&&unit.deadline&&!activeAt(unit))return <><PageHeading title={unit.title}/><section className="wrap english-content"><p>Deze wervingsronde is gesloten.</p></section></>;
  if(unit.kind==='area')return <><PageHeading title={unit.title} eyebrow="JURIDISCHE HULP"><Review unit={unit}/></PageHeading><div className="wrap content-layout"><div><p className="notice">Bestaande juridische uitleg. De juridische actualiteit moet nog door de stichting worden beoordeeld.</p><ArticleList site={site} category={unit.category||''}/></div><HelpAside site={site}/></div></>;
  if(unit.kind==='article')return <><PageHeading title={unit.title} eyebrow={unit.category?.toUpperCase()}><Review unit={unit}/></PageHeading><div className="wrap content-layout"><article><p className="notice">Bestaande juridische tekst — nog te controleren. Deze bronimport is geen bevestiging dat de uitleg juridisch actueel is.</p><Rich unit={unit}/><Source unit={unit}/><Link className="text-link" href={'/juridische-hulp/'+unit.category}>← Alle vragen over {unit.category}</Link></article><HelpAside site={site}/></div></>;
  return <><PageHeading title={unit.title} eyebrow={en?'RECHTSWINKEL AMSTERDAM':'INFORMATIE'}><Review unit={unit} en={en}/></PageHeading><div className="wrap content-layout"><article>
    {unit.kind==='contact'&&<><p className="notice">{en?'The consultation details differ between the Dutch and English source. Please confirm the current arrangements with the foundation.':'Tijden en bezoekroutes zijn overgenomen uit de bron en moeten nog worden bevestigd. Ook de hervattingsmelding zonder jaartal moet worden gecontroleerd.'}</p><Rich unit={unit} en={en}/><div className="contact-details">{unitByKey(site,'contact')?.phone&&<a href={tel(unitByKey(site,'contact')!.phone!)}>{unitByKey(site,'contact')!.phone} <Arrow/></a>}{unitByKey(site,'contact')?.address&&<p>{unitByKey(site,'contact')!.address}</p>}{unitByKey(site,'contact')?.email&&<a href={'mailto:'+unitByKey(site,'contact')!.email}>{unitByKey(site,'contact')!.email} <Arrow/></a>}</div>{!en&&<div className="contact-channels">{site.units.filter(u=>u.kind==='channel').map(u=><section key={u.key} id={u.channel}><h2>{u.title}</h2><Channel unit={u}/></section>)}</div>}</>}
    {unit.kind==='recruitment'&&<p className="notice">De bron noemt januari 2027 en een deadline van 7 december zonder jaartal. De losse wervingspagina noemt 2024 en andere eisen. De huidige werving moet worden bevestigd; hieronder staat de bestaande tekst.</p>}
    {unit.key==='accountability'&&<p className="notice">De bestuursgegevens verschillen tussen ANBI en de medewerkerspagina. Beide bronversies zijn bewaard; de stichting moet het actuele bestuur bevestigen.</p>}
    {(unit.kind!=='contact')&&<Rich unit={unit} en={en}/>}
    {unit.kind==='recruitment'&&<section className="recruitment-details"><h2>Wie zoeken wij?</h2>{unit.requirements&&<p>{unit.requirements}</p>}{unit.commitment&&<p>Inzetduur: {unit.commitment}</p>}{unit.startMoment&&<p>Startmoment: {unit.startMoment}</p>}{unit.deadline&&<p>Deadline: {new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',dateStyle:'long',timeStyle:'short'}).format(new Date(unit.deadline))}</p>}{unit.recruitmentStatus==='open'&&unit.applicationUrl&&<a className="button" href={unit.applicationUrl}>Aanmelden <Arrow/></a>}</section>}
    {unit.key==='about-intro'&&<div className="subpage-links">{[['/over-ons/team','De medewerkers'],['/over-ons/partners','Onze partners'],['/over-ons/svra','Stichting Vrienden Rechtswinkel Amsterdam'],['/over-ons/verantwoording','Verantwoording, ANBI & documenten']].map(([href,label])=><Link key={href} href={href}>{label}<Arrow/></Link>)}</div>}
    {unit.key==='team'&&<div className="team-grid">{site.units.filter(u=>u.kind==='person'&&u.group!=='board'&&u.active).map(u=><article key={u.key}>{u.image&&<Media src={u.image} srcSet={u.imageSrcSet} alt={u.title}/>}<h2>{u.title}</h2><p>{u.role}</p><Review unit={u}/></article>)}</div>}
    {unit.key==='partners'&&<div className="partner-grid">{site.units.filter(u=>u.kind==='partner').map(u=><article key={u.key}>{u.image&&<Media src={u.image} alt={u.title}/>}<h2>{u.title}</h2><Review unit={u}/>{u.link&&<a href={u.link}>Website <Arrow/></a>}</article>)}</div>}
    {unit.key==='accountability'&&<div className="documents"><h2>Jaarverslagen en beleidsplan</h2>{[...new Set(site.units.filter(u=>u.kind==='document').map(u=>u.year))].sort((a,b)=>(b||0)-(a||0)).map(year=><section key={year}><h3>{year}</h3>{site.units.filter(u=>u.kind==='document'&&u.year===year).map(u=><a key={u.key} href={u.fileUrl}><div>{u.title}<small>PDF · {u.documentType}</small><Review unit={u}/></div><span aria-hidden="true">↓</span></a>)}</section>)}</div>}
    {(unit.key==='accountability'||unit.key==='team')&&<Board site={site}/>}
    <Source unit={unit}/>
  </article><HelpAside site={site} en={en}/></div></>;
}
function HelpAside({site,en=false}:{site:SiteData;en?:boolean}){const phone=unitByKey(site,'contact');return <aside className="help-aside"><p className="eyebrow">{en?'CONTACT':'EEN JURIDISCHE VRAAG?'}</p><h2>{en?'Call with your question.':'Bel met uw vraag.'}</h2>{phone?.phone&&<a className="aside-phone" href={tel(phone.phone)}>{phone.phone}<Arrow/></a>}<Review unit={phone} en={en}/><Link href={en?'/en/contact':'/spreekuur-en-contact'}>{en?'Contact & consultation':'Spreekuur en contact'} <Arrow/></Link></aside>;}
export default async function Page({params}:Props){
  const route=routeFrom((await params).slug),site=await getSite(),en=route.startsWith('/en');
  if(site.unavailable)return <Unavailable en={en} blocked={site.blocked}/>;
  if(route==='/'||route==='/en')return <Home site={site} en={en}/>;
  if(route==='/translation-unavailable'||route==='/en/translation-unavailable')return <><PageHeading title={en?'This translation is not available.':'Deze vertaling is niet beschikbaar.'}/><div className="wrap english-content"><p>{en?'There is no English version of this topic yet.':'Er is nog geen Nederlandse versie van dit onderwerp beschikbaar.'}</p><Link href={en?'/en':'/'}>{en?'English homepage':'Nederlandse homepage'} <Arrow/></Link></div></>;
  if(route==='/juridische-hulp')return <><PageHeading title="Juridische hulp"/><section className="wrap overview"><Areas site={site}/></section></>;
  const unit=site.units.find(u=>u.route===route);if(!unit)notFound();
  return <PageContent site={site} unit={unit} en={en}/>;
}
