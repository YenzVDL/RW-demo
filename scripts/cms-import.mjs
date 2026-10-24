import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
try{process.loadEnvFile('.env.local');}catch{}
try{process.loadEnvFile('.env');}catch{}
const base=process.env.WORDPRESS_URL;
if(!base||!process.env.WORDPRESS_USER||!process.env.WORDPRESS_APP_PASSWORD)throw Error('Stel WORDPRESS_URL, WORDPRESS_USER en WORDPRESS_APP_PASSWORD in.');
if(!['localhost','127.0.0.1','wordpress'].includes(new URL(base).hostname)&&process.env.ALLOW_CMS_IMPORT!=='1')throw Error('Import is standaard beperkt tot het lokale CMS.');
if(new URL(base).hostname==='rechtswinkelamsterdam.nl')throw Error('De bronwebsite mag nooit worden gewijzigd.');
const auth='Basic '+Buffer.from(process.env.WORDPRESS_USER+':'+process.env.WORDPRESS_APP_PASSWORD).toString('base64');
async function request(path,body){
  const r=await fetch(base.replace(/\/$/,'')+'/wp-json/rwa/v1'+path,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:auth},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
  if(!r.ok)throw Error(`${path}: ${r.status} ${(await r.text()).slice(0,250)}`);
  return r.json();
}
const report={date:new Date().toISOString(),assets:[],units:[]};
const media=JSON.parse(await fs.readFile('content/asset-manifest.json','utf8'));const mapping=new Map();
for(const a of media){const b=await fs.readFile('public'+a.localPath);const result=await request('/asset',{...a,data:b.toString('base64')});mapping.set(a.localPath,result);report.assets.push({sourceUrl:a.sourceUrl,...result});}
const {units}=JSON.parse(await fs.readFile('content/source-manifest.json','utf8'));
for(const u of units){
  const data={...u};
  for(const [local,m] of mapping){data.html=data.html.split(local).join(m.url);if(data.image===local){data.image=m.url;data.imageId=m.id;}if(data.fileUrl===local){data.fileUrl=m.url;data.fileId=m.id;}}
  // Include media rewrites in the import hash, but never deployment-specific timestamps.
  data.importHash=createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const result=await request('/import',data);report.units.push(result);
}
await fs.mkdir('content/import-reports',{recursive:true});
const filename='content/import-reports/'+report.date.replace(/[:.]/g,'-')+'.json';
await fs.writeFile(filename,JSON.stringify(report,null,2));
const counts={};for(const u of report.units)counts[u.action]=(counts[u.action]||0)+1;
console.log(JSON.stringify({report:filename,assets:report.assets.length,units:counts},null,2));
if(report.units.some(x=>x.action==='conflict_preserved'))process.exitCode=2;
