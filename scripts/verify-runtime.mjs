import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
try{process.loadEnvFile('.env.local');}catch{}
try{process.loadEnvFile('.env');}catch{}
async function verify(port,env,check){
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
  try{
    for(let i=0;i<60&&!output.includes('Ready');i++)await new Promise(r=>setTimeout(r,100));
    assert.ok(output.includes('Ready'),'Test server started');
    const response=await fetch(`http://127.0.0.1:${port}/`);
    const html=await response.text();await check(response,html,port);
  }finally{child.kill();await new Promise(resolve=>child.once('exit',resolve));}
}
await verify(3002,{CONTENT_MODE:'wordpress',WORDPRESS_URL:'http://127.0.0.1:9',SITE_STAGE:'staging'},async(r,html)=>{
  assert.equal(r.status,200);assert.ok(html.includes('We kunnen de informatie nu niet ophalen.'));
  assert.ok(!html.includes('tel:0206731311'));assert.ok(!html.includes('10:00 tot 18:00'));
  console.log('PASS: CMS-uitval toont een fouttoestand zonder snapshotcontactgegevens.');
});
await verify(3002,{CONTENT_MODE:'wordpress',SITE_STAGE:'production'},async(r,html,port)=>{
  assert.ok(html.includes('De inhoud van deze website wordt nog gecontroleerd.'));
  assert.ok(!html.includes('tel:0206731311'));assert.ok(html.includes('noindex'));
  assert.ok(!(await(await fetch(`http://127.0.0.1:${port}/sitemap.xml`)).text()).includes('<loc>'));
  console.log('PASS: Productie blokkeert ongekeurde essentiële content; lege sitemap en noindex.');
});
await verify(3002,{CONTENT_MODE:'offline',SITE_STAGE:'staging'},async(r,html)=>{
  assert.equal(r.status,200);assert.ok(html.includes('Offline preview'));assert.ok(html.includes('2026-10-24'));
  console.log('PASS: Offline snapshot is expliciet gemarkeerd en gedateerd.');
});
