import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHmac} from 'node:crypto';
process.loadEnvFile('.env.local');
const base=process.env.WORDPRESS_URL;
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Deze mutatietest mag alleen tegen een lokaal test-CMS draaien.');
const auth='Basic '+Buffer.from(process.env.WORDPRESS_USER+':'+process.env.WORDPRESS_APP_PASSWORD).toString('base64');
const front='http://127.0.0.1:3000';
async function api(path,body,authorization=auth,method=body?'POST':'GET'){
  const r=await fetch(base+'/wp-json'+path,{method,headers:{'Content-Type':'application/json',...(authorization?{Authorization:authorization}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
  const data=await r.json();return {r,data};
}
test('real CMS changes, protected drafts, signatures and import conflicts',{timeout:120000},async()=>{
  const token=randomBytes(6).toString('hex');let candidateId,userId;
  const admin=(await api('/wp/v2/users/me')).data.id;
  const contact=(await api('/wp/v2/rwa_contact?context=edit&per_page=100')).data.find(p=>p.meta.rwa_key==='contact');
  const savedPhone=contact.meta.rwa_phone;
  try{
    const changed=await api('/wp/v2/rwa_contact/'+contact.id,{meta:{rwa_phone:'020-6731311'}});assert.equal(changed.r.status,200);
    const html=await(await fetch(front+'/')).text();
    assert.ok(html.includes('020-6731311'),'CMS change reaches SSR');
    assert.ok((html.match(/020-6731311/g)||[]).length>=3,'Shared header, hero and footer use central phone');
    assert.equal((await api('/wp/v2/rwa_contact/'+contact.id,{meta:{rwa_phone:'000'}},null)).r.status,401);
    const source={key:'integration-'+token,kind:'candidate',title:'Importcontrole',html:'<p>Controle van de bronimport.</p>',originalText:'Controle van de bronimport.',route:'/controle-'+token,language:'nl',publicationStatus:'draft',editorialStatus:'source_imported',importHash:'source-a-'+token,sourceUrl:'https://rechtswinkelamsterdam.nl/',fetchedAt:new Date().toISOString()};
    let res=await api('/rwa/v1/import',source);assert.equal(res.data.action,'created');candidateId=res.data.id;
    assert.equal((await api('/rwa/v1/import',source)).data.action,'unchanged');
    assert.equal((await api('/wp/v2/rwa_candidate/'+candidateId,null,null)).r.status,401);
    await api('/wp/v2/rwa_candidate/'+candidateId,{content:'<p>Lokale redactionele wijziging.</p>'});
    res=await api('/rwa/v1/import',{...source,html:'<p>Andere bronversie.</p>',importHash:'source-b-'+token});
    assert.equal(res.data.action,'conflict_preserved');
    assert.match((await api('/wp/v2/rwa_candidate/'+candidateId+'?context=edit')).data.content.raw,/Lokale redactionele wijziging/);
    assert.ok(!(await api('/rwa/v1/site',null,null)).data.units.some(u=>u.key===source.key),'Public API excludes drafts');
    assert.ok(!(await api('/rwa/v1/site',null,null)).data.units.some(u=>'notes'in u||'approvedUserId'in u),'Private review metadata omitted');
    const timestamp=Math.floor(Date.now()/1000).toString();
    const sig=createHmac('sha256',process.env.PREVIEW_SECRET).update(`${timestamp}:${candidateId}`).digest('hex');
    const preview=await fetch(`${front}/api/preview?id=${candidateId}&ts=${timestamp}&sig=${sig}`,{redirect:'manual'});
    assert.equal(preview.status,307);assert.match(preview.headers.get('cache-control'),/no-store/);
    const cookie=preview.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
    const draft=await fetch(front+source.route,{headers:{cookie}});
    assert.match(await draft.text(),/Lokale redactionele wijziging/);
    assert.match(draft.headers.get('cache-control'),/private|no-store/);
    assert.equal((await fetch(base+'/wp-json/rwa/v1/preview/'+candidateId)).status,401);
    assert.equal((await fetch(`${front}/api/preview?id=${candidateId}&ts=1&sig=${sig}`)).status,401);
    const raw=JSON.stringify({event:'integration-check',nonce:token});
    const signature=createHmac('sha256',process.env.REVALIDATE_SECRET).update(timestamp+'.'+raw).digest('hex');
    const options={method:'POST',headers:{'Content-Type':'application/json','x-rwa-timestamp':timestamp,'x-rwa-signature':signature},body:raw};
    assert.equal((await fetch(front+'/api/revalidate',options)).status,200);
    assert.equal((await fetch(front+'/api/revalidate',options)).status,409);
    const user=await api('/wp/v2/users',{username:'controle-'+token,email:`controle-${token}@example.invalid`,password:randomBytes(32).toString('hex'),roles:['rwa_editor']});
    assert.equal(user.r.status,201);userId=user.data.id;
    const password=(await api('/wp/v2/users/'+userId+'/application-passwords',{name:'Integratiecontrole'})).data.password;
    const editor='Basic '+Buffer.from('controle-'+token+':'+password).toString('base64');
    assert.equal((await api('/wp/v2/rwa_candidate/'+candidateId,{meta:{rwa_editorialStatus:'approved'}},editor)).r.status,403);
    assert.equal((await api('/rwa/v1/import',source,editor)).r.status,403);
  }finally{
    await api('/wp/v2/rwa_contact/'+contact.id,{meta:{rwa_phone:savedPhone}});
    if(candidateId)await api('/wp/v2/rwa_candidate/'+candidateId,null,auth,'DELETE');
    if(userId)await api('/wp/v2/users/'+userId+'?force=true&reassign='+admin,null,auth,'DELETE');
  }
});
