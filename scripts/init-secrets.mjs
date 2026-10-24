import fs from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
try{await fs.access('.env');throw Error('.env bestaat al; wordt niet overschreven.');}catch(e){if(e.code!=='ENOENT')throw e;}
const secret=()=>randomBytes(32).toString('hex');
await fs.writeFile('.env',`CONTENT_MODE=wordpress\nSITE_STAGE=staging\nSITE_URL=http://localhost:3000\nWORDPRESS_URL=http://localhost:8080\nWORDPRESS_PUBLIC_URL=http://localhost:8080\nWORDPRESS_USER=\nWORDPRESS_APP_PASSWORD=\nREVALIDATE_SECRET=${secret()}\nPREVIEW_SECRET=${secret()}\nDB_PASSWORD=${secret()}\nDB_ROOT_PASSWORD=${secret()}\nWP_ADMIN_USER=rwa-admin\nWP_ADMIN_PASSWORD=${secret()}\nWP_ADMIN_EMAIL=beheer@example.invalid\n`,{mode:0o600});
console.log('.env aangemaakt met unieke lokale geheimen. Bewaar deze buiten Git.');
await fs.mkdir('.runtime/bootstrap',{recursive:true,mode:0o777});
