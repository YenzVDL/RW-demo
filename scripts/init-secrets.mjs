import fs from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
let envFile;
try{envFile=await fs.open('.env','wx',0o600);}catch(e){
  if(e.code==='EEXIST'){console.log('.env bestaat al. Bestaande instellingen en wachtwoorden blijven behouden.');process.exit(0);}
  throw e;
}
const secret=()=>randomBytes(32).toString('hex');
try{await envFile.writeFile(`CONTENT_MODE=wordpress\nSITE_STAGE=staging\nSITE_URL=http://localhost:3000\nWORDPRESS_URL=http://localhost:8080\nWORDPRESS_PUBLIC_URL=http://localhost:8080\nWORDPRESS_USER=\nWORDPRESS_APP_PASSWORD=\nREVALIDATE_SECRET=${secret()}\nPREVIEW_SECRET=${secret()}\nDB_PASSWORD=${secret()}\nDB_ROOT_PASSWORD=${secret()}\nWP_ADMIN_USER=rwa-admin\nWP_ADMIN_PASSWORD=${secret()}\nWP_ADMIN_EMAIL=beheer@example.invalid\n`);}finally{await envFile.close();}
console.log('.env aangemaakt met unieke lokale geheimen. Bewaar deze buiten Git.');
await fs.mkdir('.runtime/bootstrap',{recursive:true,mode:0o777});
