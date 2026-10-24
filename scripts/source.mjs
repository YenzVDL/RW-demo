import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {decodeHTML} from 'entities';
import sanitize from 'sanitize-html';
import sharp from 'sharp';

const origin = 'https://rechtswinkelamsterdam.nl';
await fs.mkdir('content/raw', {recursive:true});
await fs.mkdir('public/assets', {recursive:true});
const stamp = new Date().toISOString();
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function get(url) {
  if(new URL(url).origin !== origin) throw Error('Unknown source host');
  const r = await fetch(url, {signal:AbortSignal.timeout(25000),redirect:'error'});
  if(!r.ok) throw Error(`${r.status}: ${url}`);
  return r;
}
if(process.argv.includes('--fetch')) {
  for(const kind of ['pages','media','posts']) {
    const all=[];
    for(let page=1,total=1;page<=total && page<=20;page++) {
      const r=await get(`${origin}/wp-json/wp/v2/${kind}?per_page=100&page=${page}`);
      total=Number(r.headers.get('x-wp-totalpages') || 1);
      const data=await r.json(); all.push(...data);
      await fs.writeFile(`content/raw/${kind}-${page}.json`,JSON.stringify(data,null,2));
      await new Promise(r=>setTimeout(r,150));
    }
    await fs.writeFile(`content/raw/${kind}.json`,JSON.stringify(all,null,2));
    console.log(`Fetched ${all.length} ${kind}`);
  }
  for(const [name,url] of [['home',origin+'/'],['sitemap',origin+'/wp-sitemap.xml'],['brand-css',origin+'/wp-content/uploads/the7-css/css-vars.css']]) {
    const r=await get(url); await fs.writeFile(`content/raw/${name}.${name==='brand-css'?'css':'html'}`,await r.text());
  }
  await fs.writeFile('content/raw/fetch.json',JSON.stringify({fetchedAt:stamp,origin},null,2));
}
const pages=JSON.parse(await fs.readFile('content/raw/pages.json','utf8'));
const media=JSON.parse(await fs.readFile('content/raw/media.json','utf8'));
const fetchedAt=JSON.parse(await fs.readFile('content/raw/fetch.json','utf8').catch(()=>JSON.stringify({fetchedAt:stamp}))).fetchedAt;
const page=id=>pages.find(p=>p.id===id);
const decode=s=>decodeHTML(s).replace(/[”″]/g,'"');
function clean(s) {
  const $=load(s.replace(/\[vc_raw_html\][\s\S]*?\[\/vc_raw_html\]/gi,''));
  $('script,style,iframe,sr7-module,.owl-carousel').remove();
  return sanitize($.html().replace(/\[[^\]]*\]/g,''),{
    allowedTags:['p','h2','h3','h4','strong','em','ul','ol','li','br','a','blockquote','table','thead','tbody','tr','td','th'],
    allowedAttributes:{a:['href']},allowedSchemes:['https','http','mailto','tel'],
    exclusiveFilter:f=>f.tag==='p'&&!f.text.trim(),
  }).trim();
}
const text=s=>load(s).text().replace(/\s+/g,' ').trim();
const units=[];
function add(key,p,title,route,html,extras={}) {
  const u={key,sourceId:p.id,sourceUrl:p.link,fetchedAt,sourceModifiedAt:p.modified_gmt+'Z',
    originalText:html||p.content.rendered,title,route,language:route.startsWith('/en')?'en':'nl',html:clean(html),
    editorialStatus:'source_imported',publicationStatus:'publish',kind:'page',essential:false,...extras};
  u.importHash=hash(u); units.push(u); return u;
}
const home=page(487), english=page(153);
const homeDecoded=decode(home.content.rendered);
function section(id,p=home) {
  const s=decode(p.content.rendered);
  const re=new RegExp('\\[vc_row(?=[^\\]]*el_id="'+id+'")[^\\]]*\\]([\\s\\S]*?)(?=\\[vc_row(?: |\\])|$)');
  return re.exec(s)?.[1] || '';
}
// Exact source excerpt; counts and disputed board data are kept only in the raw export.
add('home-intro',home,'Juridisch advies. Geheel gratis.','/', '<p>Heeft u een juridische vraag? Bij de Rechtswinkel Amsterdam staan we klaar om u te helpen!</p>');
add('about-intro',home,'Over ons','/over-ons','<p>De Rechtswinkel Amsterdam geeft al sinds 1972 juridisch advies.</p><p>Om bezoekers zo goed mogelijk te kunnen adviseren met informatie die up-to-date is, krijgt het team iedere week scholingen over uiteenlopende onderwerpen.</p><p>Alle medewerkers van de Rechtswinkel maken het samen mogelijk dat de stichting kan doen waarvoor ze is opgericht: Het geven van gratis juridisch advies!</p>');
add('contact',home,'Spreekuur en contact','/spreekuur-en-contact','<p>Heeft u een juridische vraag? Bij de Rechtswinkel Amsterdam staan we klaar om u te helpen!</p>',{kind:'contact',originalText:section('inloopspreekuur'),essential:true,editorialStatus:'needs_confirmation',phone:'020 673 13 11',address:'Dusartstraat 50–52, 1072 HT Amsterdam',email:'info@rechtswinkelamsterdam.nl'});
add('phone',home,'Telefonisch advies','', '',{kind:'channel',channel:'telephone',schedule:'Iedere werkdag van 10:00 tot 18:00',contactKey:'contact',essential:true,editorialStatus:'needs_confirmation'});
add('walkin',home,'Inloopspreekuur','', '<p>Het inloopspreekuur is enkel bedoeld voor direct advies, er worden hier dus geen zaken aangenomen voor verdere behandeling. Hiervoor dienen wij naderhand nog een extra afspraak in te plannen voor een reguliere spreekuur.</p>',{kind:'channel',channel:'walkin',schedule:'Dinsdagavond van 19:00 tot 21:00',appointmentRule:'Zonder afspraak',contactKey:'contact',essential:true,editorialStatus:'needs_confirmation'});
add('appointment',home,'Vervolgafspraak','', '<p>Om ervoor te zorgen dat we u zo goed mogelijk kunnen adviseren, vragen we u eerst telefonisch contact met ons op te nemen.</p>',{kind:'channel',channel:'appointment',schedule:'Woensdag- of donderdagavond van 18:00 tot 20:00',appointmentRule:'Op afspraak, na telefonisch contact',contactKey:'contact',essential:true,editorialStatus:'needs_confirmation'});
add('recruitment',home,'Vrijwilliger worden','/vrijwilliger-worden',section('werkenbij'),{kind:'recruitment',editorialStatus:'needs_confirmation',essential:true,recruitmentStatus:'review',deadline:'',startMoment:'januari 2027',applicationUrl:'mailto:sollicitaties@rechtswinkelamsterdam.nl'});
add('partners',home,'Onze partners','/over-ons/partners',section('zakelijk'),{editorialStatus:'needs_confirmation'});
add('svra',page(182),'Stichting Vrienden Rechtswinkel Amsterdam','/over-ons/svra',page(182).content.rendered,{translationKey:'svra-en'});
add('svra-en',page(184),'Stichting Vrienden Rechtswinkel Amsterdam','/en/about/svra',page(184).content.rendered,{translationKey:'svra'});
add('privacy',page(242),'Privacyverklaring','/privacyverklaring',page(242).content.rendered,{essential:true});
add('terms',page(239),'Algemene voorwaarden','/algemene-voorwaarden',page(239).content.rendered,{essential:true});
add('accountability',page(308),'Verantwoording & ANBI','/over-ons/verantwoording',page(308).content.rendered,{editorialStatus:'needs_confirmation',essential:true});
add('team',page(265),'De medewerkers','/over-ons/team','<p>De medewerkers</p>',{editorialStatus:'needs_confirmation',originalText:page(265).content.rendered});
const categoryNames=['huurrecht','arbeidsrecht','consumentenrecht'];
const articleSlugs=['opzegging-door-verhuurder','huur-opzeggen','borg','onderhoudskosten','bijkomende-huurkosten','vaststellingsovereenkomst','concurrentiebeding','nulurencontract','loon-bij-ziekte','proeftijd','koop-op-afstand','algemene-voorwaarden'];
const questions=[...homeDecoded.matchAll(/\[vc_accordion_tab[^\]]*title="([^"]+)"[^\]]*\]([\s\S]*?)(?=\[\/vc_accordion_tab\]|$)/g)];
questions.forEach((m,i)=>{
  const category=categoryNames[i<5?0:i<10?1:2];
  add(`article-${articleSlugs[i]||i}`,home,m[1],`/juridische-hulp/${category}/${articleSlugs[i]||i}`,m[2],{kind:'article',category,essential:true});
});
for(const category of categoryNames) add(`area-${category}`,home,category[0].toUpperCase()+category.slice(1),`/juridische-hulp/${category}`,'',{kind:'area',category,essential:true});
const oldQuestions=[...decode(page(19).content.rendered).matchAll(/\[vc_accordion_tab[^\]]*title="([^"]+)"[^\]]*\]([\s\S]*?)(?=\[\/vc_accordion_tab\]|$)/g)];
oldQuestions.filter(m=>!questions.some(q=>q[1]===m[1])).forEach((m,i)=>add(`legacy-question-${i}`,page(19),m[1],'',m[2],{kind:'candidate',publicationStatus:'draft',editorialStatus:'needs_confirmation'}));
const enText=clean(english.content.rendered); const en$=load(enText);
const enSection=(start,end)=>{const s=en$.html(); const i=s.indexOf(start); const j=s.indexOf(end,i+start.length); return i<0?'':s.slice(i,j<0?undefined:j);};
add('home-en',english,'Legal advice. Completely free of charge.','/en','<p>The Rechtswinkel Amsterdam has been giving free legal advice since 1972.</p>',{translationKey:'home-intro'});
units.find(x=>x.key==='home-intro').translationKey='home-en';
add('contact-en',english,'Contact & consultation','/en/contact',enSection('<h2>Consultancy','<h2>About').replace(/on 020[^<]*?every weekday/,'every weekday'),{kind:'contact',contactKey:'contact',essential:true,editorialStatus:'needs_confirmation',translationKey:'contact'});
units.find(x=>x.key==='contact').translationKey='contact-en';
// All media fetched publicly; only source-context assets are selected for use.
const assets=[];
async function asset(url,context,meta) {
  if(new URL(url).origin!==origin) throw Error('Unknown asset host');
  let filename=decodeURIComponent(new URL(url).pathname.split('/').pop()).replace(/[^a-zA-Z0-9._-]/g,'_');
  const local=`/assets/${filename}`;
  try { await fs.access('public'+local); } catch { const r=await get(url); await fs.writeFile('public'+local,Buffer.from(await r.arrayBuffer())); }
  if(!assets.some(a=>a.sourceUrl===url)) {
    const variants=[];
    if(meta?.media_details?.width>1200 && /\.(jpg|jpeg|png)$/i.test(filename))for(const width of [480,960,1440]){
      const variant=`/assets/${filename.replace(/\.[^.]+$/,'')}-${width}.webp`;
      try{await fs.access('public'+variant);}catch{await sharp('public'+local).resize({width,withoutEnlargement:true}).webp({quality:83}).toFile('public'+variant);}
      variants.push({localPath:variant,width});
    }
    assets.push({sourceUrl:url,sourceId:meta?.id||null,localPath:local,filename,width:meta?.media_details?.width||null,height:meta?.media_details?.height||null,language:'nl',existingAlt:meta?.alt_text||'',context,fetchedAt,variants});
  }
  return local;
}
const logoUrl=origin+'/wp-content/uploads/2019/10/rsz_1rsz_logorwa.png';
await asset(logoUrl,'Bestaand organisatielogo',media.find(m=>m.source_url===logoUrl));
const docs$=load(page(244).content.rendered);
for(const a of docs$('a[href$=".pdf"]').toArray()) {
  const url=docs$(a).attr('href'); const file=await asset(url,'Document uit het bestaande documentenoverzicht',media.find(m=>m.source_url===url));
  const title=docs$(a).text(); add(`doc-${hash(url).slice(0,10)}`,page(244),title,'',`<p><a href="${file}">${title}</a></p>`,{kind:'document',fileUrl:file,year:Number(title.match(/20\d{2}/)?.[0]||0),documentType:/beleidsplan/i.test(title)?'Beleidsplan':/ANBI/.test(title)?'ANBI':'Jaarstukken'});
}
const teamRaw=decode(page(265).content.rendered);
for(const m of teamRaw.matchAll(/\[vc_single_image[^\]]*image="(\d+)"[^\]]*\][\s\S]*?<strong>([^<]+)<\/strong>/g)) {
  const item=media.find(a=>a.id===Number(m[1])); if(!item) continue;
  const img=await asset(item.source_url,[979,980,978].includes(item.id)?'Medewerker zoals gekoppeld op /de-medewerkers/; afzonderlijk portret ook op de homepage':'Medewerker zoals gekoppeld op /de-medewerkers/',item);
  add(`person-${m[1]}`,page(265),m[2],'','',{kind:'person',image:img,role:'Medewerker',period:'',active:true,editorialStatus:'needs_confirmation'});
}
// Board versions remain separate unpublished records. No source is chosen as the current board.
for(const p of [page(265),page(308)]) {
  const $=load(clean(p.content.rendered));
  for(const el of $('p').toArray()){
    const line=$(el).text().trim();const match=/^(Voorzitter|Secretaris|Penningmeester|Huismeester|Diensthoofd)\s*[:–-]\s*(.+?)[;.]?$/.exec(line);
    if(match)add(`board-${p.id}-${match[1].toLowerCase()}`,p,match[2].replace(/[;.]$/,''),'',$(el).html(),{kind:'person',role:match[1],group:'board',active:false,publicationStatus:'draft',editorialStatus:'needs_confirmation'});
  }
}
const accountability=units.find(u=>u.key==='accountability');
const recruitment=units.find(u=>u.key==='recruitment');
recruitment.originalText=section('werkenbij');
recruitment.requirements='Minimaal: 2e jaars WO rechtenstudenten, of 3e jaars HBO rechtenstudenten, of 3e jaars SJD studenten';
recruitment.commitment='12 maanden';
recruitment.html=recruitment.html.replace(/<p><strong>Wie zoeken wij\?[\s\S]*?<\/p>/,'').replace(/<p>Lijkt het jou leuk[\s\S]*?<\/p>/,'');
// Replace duplicated contacts and contradictory board names with shared components.
accountability.html=accountability.html.replace(/<p>Het bestuur van de Stichting Rechtswinkel Amsterdam is te contacteren[\s\S]*?<\/p>/,'').replace(/<p>Het bestuur van de Stichting Rechtswinkel Amsterdam bestaat uit vijf bestuurders\.[\s\S]*?<p>Diensthoofd[\s\S]*?<\/p>/,'');
const blog=JSON.parse(await fs.readFile('content/raw/posts.json','utf8'));
for(const p of blog.filter(p=>!/hello world/i.test(p.title.rendered)))add(`post-${p.id}`,p,text(p.title.rendered),'',p.content.rendered,{kind:'candidate',publicationStatus:'draft',editorialStatus:'needs_confirmation'});
// No general hero photograph: source hero is generic imagery. Person photographs stay on the team page.
const partnerItems=[{id:1024,name:'A&O Shearman'},{id:219,name:'Loyens & Loeff'},{id:520,name:'Stibbe'},{id:522,name:'Raad voor Rechtsbijstand'},{id:1008,name:'De Brauw Blackstone Westbroek'}];
for(const item of partnerItems) {const m=media.find(m=>m.id===item.id);if(m){const image=await asset(m.source_url,'Partnerlogo op de Nederlandse homepage',m);add(`partner-${item.id}`,home,item.name,'','',{kind:'partner',image,editorialStatus:'needs_confirmation'});}}
const destinationByPath={'/':'/','/home/':'/','/de-medewerkers/':'/over-ons/team','/werken-bij/':'/vrijwilliger-worden','/anbi/':'/over-ons/verantwoording','/jaarverslagen/':'/over-ons/verantwoording','/svra/':'/over-ons/svra','/privacyverklaring/':'/privacyverklaring','/algemene-voorwaarden/':'/algemene-voorwaarden','/en/home-english/':'/en','/en/svra-2/':'/en/about/svra'};
for(const u of [...units]) {
  const picture=assets.find(a=>a.localPath===u.image);
  if(picture?.variants?.length)u.imageSrcSet=picture.variants.map(v=>`${v.localPath} ${v.width}w`).join(', ');
  const $=load(u.html);
  for(const el of $('a[href]').toArray()) {
    const href=$(el).attr('href');let url;try{url=new URL(href,origin);}catch{continue;}
    if(url.origin!==origin)continue;
    if(url.pathname.startsWith('/wp-content/uploads/')&&url.pathname.endsWith('.pdf')) {
      const file=await asset(url.href,'Bestaand document gelinkt vanuit '+u.sourceUrl,media.find(m=>m.source_url===url.href));
      $(el).attr('href',file);
    } else if(destinationByPath[url.pathname])$(el).attr('href',destinationByPath[url.pathname]+url.hash);
  }
  u.html=clean($.html());u.importHash=hash({...u,importHash:undefined});
}
await fs.writeFile('content/asset-manifest.json',JSON.stringify(assets,null,2));
await fs.writeFile('content/source-manifest.json',JSON.stringify({fetchedAt,origin,units},null,2));
const snapshot={fetchedAt,units:units.filter(u=>u.publicationStatus==='publish'),logo:'/assets/rsz_1rsz_logorwa.png'};
await fs.writeFile('content/snapshot.json',JSON.stringify(snapshot,null,2));
const destinations={'home':'/','de-medewerkers':'/over-ons/team','werken-bij':'/vrijwilliger-worden','anbi':'/over-ons/verantwoording','jaarverslagen':'/over-ons/verantwoording','svra':'/over-ons/svra','svra-2':'/en/about/svra','home-english':'/en','privacyverklaring':'/privacyverklaring','algemene-voorwaarden':'/algemene-voorwaarden'};
const redirects=pages.filter(p=>destinations[p.slug] && new URL(p.link).pathname!=='/' && new URL(p.link).pathname.replace(/\/$/,'')!==destinations[p.slug]).map(p=>({source:new URL(p.link).pathname.replace(/\/$/,''),destination:destinations[p.slug],permanent:true}));
await fs.writeFile('content/redirects.json',JSON.stringify(redirects,null,2));
await fs.writeFile('docs/content-inventory.md',`# Broninventaris\n\nOpgehaald: ${fetchedAt}. Alle imports zijn ongekeurd.\n\n| Bestaande URL | Titel | Taal | Onderwerp | Status | Bestemming | Migratieactie |\n|---|---|---|---|---|---|---|\n`+[...pages,...blog].map(p=>`| ${p.link} | ${text(p.title.rendered)} | ${p.link.includes('/en/')?'en':'nl'} | ${p.slug} | ${destinations[p.slug]?'source_imported':'niet gepubliceerd'} | ${destinations[p.slug]||'—'} | ${p.id===19?'Alleen niet-gepubliceerde kandidaten':destinations[p.slug]?'Opschonen; bron en reviewstatus behouden':p.id===738?'Kandidaatartikel; inhoudelijke review vereist':'Themavoorbeeld; niet migreren'} |`).join('\n')+`\n\n${questions.length} huidige juridische vragen; ${oldQuestions.length} historische vragen onderzocht. ${assets.length} bestaande assets lokaal opgeslagen. Geen voorbeeldportretten gebruikt.\n`);
console.log(`Built ${units.length} units, ${questions.length} current legal articles, ${assets.length} assets`);
