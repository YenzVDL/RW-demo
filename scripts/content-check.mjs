import fs from 'node:fs/promises';
import {releaseIssues} from '../src/lib/policy.mjs';
try{process.loadEnvFile('.env.local');}catch{}
try{process.loadEnvFile('.env');}catch{}
const production=process.argv.includes('--production');
let units;
if(process.env.WORDPRESS_URL && process.env.CONTENT_MODE!=='offline') {
  const r=await fetch(process.env.WORDPRESS_URL+'/wp-json/rwa/v1/site',{signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!r.ok)throw Error('CMS niet bereikbaar: '+r.status);
  units=(await r.json()).units;
} else {
  units=JSON.parse(await fs.readFile('content/source-manifest.json','utf8')).units;
  if(production)console.log('Bronmanifestcontrole; voer ook uit tegen het productie-CMS.');
}
const issues=releaseIssues(units);
console.log(`${units.length} eenheden; ${issues.length} blokkerende punten.`);
issues.forEach(s=>console.log('- '+s));
if(production && (process.env.CONTENT_MODE==='offline'||!process.env.WORDPRESS_URL)) issues.push('Productie vereist een bereikbaar WordPress CMS');
process.exitCode=production&&issues.length?1:0;
