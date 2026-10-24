import {spawn} from 'node:child_process';
try{process.loadEnvFile('.env');}catch{throw Error('Voer eerst npm run secrets:init uit.');}
const bootstrap=spawn('docker',['compose','run','--rm','bootstrap'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let out='',err='';bootstrap.stdout.on('data',d=>out+=d);bootstrap.stderr.on('data',d=>err+=d);
const code=await new Promise(resolve=>{bootstrap.on('error',()=>resolve(-1));bootstrap.on('exit',resolve);});
if(code!==0)throw Error('Docker-bootstrap mislukt. Controleer Docker en de WordPress-service. '+err.slice(0,500));
const match=/RWA_IMPORT_CREDENTIALS:(\{[^\n]+\})/.exec(out);
if(!match)throw Error('Geen importgegevens ontvangen van WordPress.');
const credential=JSON.parse(match[1]);
try{
  const child=spawn(process.execPath,['scripts/cms-import.mjs'],{windowsHide:true,stdio:'inherit',env:{...process.env,WORDPRESS_URL:'http://localhost:8080',WORDPRESS_USER:credential.user,WORDPRESS_APP_PASSWORD:credential.password}});
  process.exitCode=await new Promise(resolve=>child.on('exit',resolve));
}finally{
  await fetch(`http://localhost:8080/wp-json/wp/v2/users/${credential.userId}/application-passwords/${credential.uuid}`,{method:'DELETE',headers:{Authorization:'Basic '+Buffer.from(credential.user+':'+credential.password).toString('base64')},signal:AbortSignal.timeout(10000)});
}
