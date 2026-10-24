import Link from 'next/link';
import type {SiteData} from '@/lib/types';
import {unitByKey} from '@/lib/content';
import {isApproved} from '@/lib/policy.mjs';
import {Arrow,Areas,Channel,Partners,PhoneIcon,Review,Rich,tel} from './site';
import {Media} from './interface';

export default function Home({site,en}:{site:SiteData;en:boolean}){
  const intro=unitByKey(site,en?'home-en':'home-intro');
  const contact=unitByKey(site,'contact');
  const phone=unitByKey(site,'phone');
  const about=unitByKey(site,'about-intro');
  const people=site.units.filter(u=>u.kind==='person'&&u.group!=='board'&&u.active&&u.image).slice(0,3);

  return <>
    <section className="opening wrap" aria-labelledby="opening-title">
      <div className="opening-copy">
        <p className="eyebrow opening-kicker">STICHTING RECHTSWINKEL AMSTERDAM</p>
        <div className="opening-title">
          <h1 id="opening-title"><span>{en?'Legal':'Juridisch'}</span>{' '}<span>{en?'advice.':'advies.'}</span></h1>
          <p className="free-note">{en?'Completely free.':'Geheel gratis.'}</p>
        </div>
        {intro&&<div className="opening-intro"><Rich unit={intro} en={en}/></div>}
        <div className="opening-actions">
          <Link className="button" href={en?'/en/contact':'/spreekuur-en-contact'}>{en?'Contact & consultation':'Zo krijgt u advies'} <Arrow/></Link>
          {!en&&<a className="text-link" href="#hulpgebieden">Waarmee kunnen we helpen? <span aria-hidden="true">↓</span></a>}
        </div>
      </div>
      <aside className="call-slip" aria-label={en?'Contact':'Bel met uw vraag'}>
        <div className="call-slip-top"><p className="eyebrow">{en?'CONTACT':'BEL MET UW VRAAG'}</p><PhoneIcon/></div>
        {contact?.phone?<a className="slip-number" href={tel(contact.phone)}>{contact.phone}<Arrow/></a>:<h2>{en?'Contact information pending review':'Contactgegevens nog te bevestigen'}</h2>}
        <Review unit={contact} en={en}/>
        {!en&&phone?.schedule&&<p className="slip-schedule">{phone.schedule}</p>}
        <div className="slip-visit">
          <span className="slip-turn" aria-hidden="true">↳</span>
          <div><Link href={en?'/en/contact':'/spreekuur-en-contact'}>{en?'Consultation on location':'Liever langskomen?'} <Arrow/></Link>{contact?.address&&<p>{contact.address}</p>}</div>
        </div>
        <Link className="slip-bottom" href={en?'/en/contact':'/spreekuur-en-contact'}>{en?'Contact & consultation':'Spreekuur en contact'} <Arrow/></Link>
      </aside>
      <div className="opening-bottom" aria-hidden="true"><span>RECHTSWINKEL</span><span>AMSTERDAM</span><span className="opening-down">↓</span></div>
    </section>

    {!en&&<>
      <section className="help-directory" id="hulpgebieden" aria-labelledby="directory-title">
        <div className="wrap">
          <div className="directory-heading"><p className="eyebrow">JURIDISCHE HULP</p><h2 id="directory-title">Waar gaat uw vraag over?</h2></div>
          <Areas site={site}/>
        </div>
      </section>

      <section className="visit-section wrap" aria-labelledby="visit-title">
        <div className="visit-heading"><p className="eyebrow">ONZE WERKWIJZE</p><h2 id="visit-title">Bel met uw vraag.<br/><em>Of kom langs.</em></h2><Link className="text-link" href="/spreekuur-en-contact">Alle contactmogelijkheden <Arrow/></Link></div>
        <div className="visit-routes">
          {phone&&<article className="visit-phone"><PhoneIcon/><div><h3>{phone.title}</h3><Channel unit={phone}/></div></article>}
          <div className="visit-branches">
            {['walkin','appointment'].map(key=>{
              const unit=unitByKey(site,key);
              return unit&&<details className="visit-route" key={key}>
                <summary><div><h3>{unit.title}</h3>{unit.schedule&&<p>{unit.schedule}</p>}<Review unit={unit}/></div><span className="route-toggle" aria-hidden="true"/></summary>
                <div className="route-body"><Channel unit={unit}/></div>
              </details>;
            })}
          </div>
        </div>
      </section>

      {about&&<section className="people-section" aria-labelledby="people-title"><div className="wrap people-layout">
        <div className="people-story"><p className="eyebrow">OVER ONS</p><h2 id="people-title">De mensen achter<br/>de Rechtswinkel.</h2>
          {!!people.length&&<><div className="portrait-strip">{people.map(person=><figure key={person.key}><Media src={person.image!} srcSet={person.imageSrcSet} alt={person.title}/><figcaption>{person.title}</figcaption></figure>)}</div><div className="portrait-caption"><Link className="text-link" href="/over-ons/team">De medewerkers <Arrow/></Link><Review unit={people.find(person=>!isApproved(person))}/></div></>}
        </div>
        <div className="people-copy"><Rich unit={about}/><Link className="text-link" href="/over-ons">Meer over de Rechtswinkel <Arrow/></Link></div>
      </div></section>}
      <Partners site={site}/>
    </>}

    {en&&<section className="wrap english-content"><h2>Contact & consultation</h2><p>Labour law · tenancy law · consumer law</p><p className="notice">The Dutch and English source pages contain different consultation details. These details need confirmation.</p><Link className="button" href="/en/contact">View existing contact information <Arrow/></Link><p><Link href="/en/about/svra">Stichting Vrienden Rechtswinkel Amsterdam <Arrow/></Link></p></section>}
  </>;
}
