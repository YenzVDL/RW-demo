import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
if(process.platform!=='win32')throw Error('Windows-helper; gebruik Docker Compose op andere platformen.');
await fs.mkdir('.runtime',{recursive:true});
const releases=await(await fetch('https://windows.php.net/downloads/releases/releases.json')).json();
const php=releases['8.4'];
if(php.version!=='8.4.27')throw Error('Vastgezette PHP-versie verschilt van de actuele download. Gebruik de officiële PHP-archieven of Docker; wijzig de pin bewust.');
const pkg=Object.entries(php).find(([key])=>key.startsWith('nts-')&&key.endsWith('x64'))[1].zip;
const artifacts=[
  ['php','https://windows.php.net/downloads/releases/'+pkg.path,pkg.sha256],
  ['mariadb','https://downloads.mariadb.org/rest-api/mariadb/11.4.10/mariadb-11.4.10-winx64.zip','fb7c76f0804321ee373daa49145f2056d2d88f321b614130adeb05a1644ea003'],
  ['wordpress','https://downloads.wordpress.org/release/wordpress-7.1.3.zip',null],
];
for(const [name,url,sha] of artifacts){
  const zip=path.resolve('.runtime',name+'.zip');let bytes;
  try{bytes=await fs.readFile(zip);}catch{const r=await fetch(url,{signal:AbortSignal.timeout(180000)});if(!r.ok)throw Error(name+': '+r.status);bytes=Buffer.from(await r.arrayBuffer());}
  if(sha&&createHash('sha256').update(bytes).digest('hex')!==sha)throw Error(name+': checksum mismatch');
  await fs.writeFile(zip,bytes);
  const destination=path.resolve('.runtime',name==='wordpress'?'wp':name);
  // Literal paths are constructed only from this fixed workspace-owned list.
  const quote=s=>"'"+s.replaceAll("'","''")+"'";
  execFileSync('powershell.exe',['-NoProfile','-Command',`Expand-Archive -LiteralPath ${quote(zip)} -DestinationPath ${quote(destination)} -Force`],{windowsHide:true,stdio:'inherit'});
  console.log(name+': officiële bron gedownload en uitgepakt'+(sha?'; SHA-256 gecontroleerd':''));
}
