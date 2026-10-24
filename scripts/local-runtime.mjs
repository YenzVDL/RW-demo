// Optional Windows development runtime; Docker Compose is the portable deployment path.
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
process.loadEnvFile('.env');
const cwd=process.cwd();const rt=path.join(cwd,'.runtime');
const dbRoot=path.join(rt,'mariadb','mariadb-11.4.10-winx64');const php=path.join(rt,'php','php.exe');
const wp=path.join(rt,'wp','wordpress');const data=path.join(rt,'db');
const env={...process.env,RWA_PREVIEW_SECRET:process.env.PREVIEW_SECRET,RWA_REVALIDATE_SECRET:process.env.REVALIDATE_SECRET,RWA_FRONTEND_URL:'http://localhost:3000',RWA_DB_PORT:'3307'};
const norm=p=>p.replaceAll('\\','/');
await fs.writeFile(path.join(rt,'php','php.ini'),`extension_dir="${norm(path.join(rt,'php','ext'))}"\nextension=mysqli\nextension=mbstring\nextension=openssl\nextension=curl\nextension=fileinfo\nextension=gd\nextension=zip\nmemory_limit=256M\nupload_max_filesize=20M\npost_max_size=24M\nmax_execution_time=120\ndate.timezone=Europe/Amsterdam\ncurl.cainfo="${norm(path.join(wp,'wp-includes','certificates','ca-bundle.crt'))}"\nopenssl.cafile="${norm(path.join(wp,'wp-includes','certificates','ca-bundle.crt'))}"\n`);
try{await fs.access(path.join(data,'mysql'));}catch{execFileSync(path.join(dbRoot,'bin','mariadb-install-db.exe'),[`--datadir=${data}`,'--port=3307','--silent'],{stdio:'inherit',windowsHide:true});}
const db=spawn(path.join(dbRoot,'bin','mariadbd.exe'),['--no-defaults',`--basedir=${dbRoot}`,`--datadir=${data}`,'--port=3307','--bind-address=127.0.0.1','--innodb-buffer-pool-size=64M','--max-connections=30','--console'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
db.stdout.on('data',()=>{});db.stderr.on('data',d=>{if(/ERROR/.test(d.toString()))console.error(d.toString());});
await new Promise((resolve,reject)=>{let n=0;const attempt=()=>{const s=net.createConnection(3307,'127.0.0.1');s.once('connect',()=>{s.end();resolve();});s.once('error',()=>{if(n++>60)reject(Error('MariaDB start timeout'));else setTimeout(attempt,500);});};attempt();});
try{await fs.access(path.join(rt,'db-ready'));}catch{
  const sql=`CREATE DATABASE IF NOT EXISTS rechtswinkel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'rwa'@'127.0.0.1' IDENTIFIED BY '${process.env.DB_PASSWORD}'; GRANT ALL PRIVILEGES ON rechtswinkel.* TO 'rwa'@'127.0.0.1'; ALTER USER 'root'@'localhost' IDENTIFIED BY '${process.env.DB_ROOT_PASSWORD}'; FLUSH PRIVILEGES;`;
  await new Promise((resolve,reject)=>{const p=spawn(path.join(dbRoot,'bin','mariadb.exe'),['--no-defaults','--user=root','--host=127.0.0.1','--port=3307'],{windowsHide:true,stdio:['pipe','ignore','pipe']});let err='';p.stderr.on('data',d=>err+=d);p.on('exit',code=>code?reject(Error(err)):resolve());p.stdin.end(sql);});
  await fs.writeFile(path.join(rt,'db-ready'),'initialized');
}
const salts=['AUTH_KEY','SECURE_AUTH_KEY','LOGGED_IN_KEY','NONCE_KEY','AUTH_SALT','SECURE_AUTH_SALT','LOGGED_IN_SALT','NONCE_SALT'].map(k=>`define('${k}','${randomBytes(48).toString('hex')}');`).join('\n');
try{await fs.access(path.join(wp,'wp-config.php'));}catch{
  await fs.writeFile(path.join(wp,'wp-config.php'),`<?php\ndefine('DB_NAME','rechtswinkel');define('DB_USER','rwa');define('DB_PASSWORD',getenv('DB_PASSWORD'));define('DB_HOST','127.0.0.1:3307');define('DB_CHARSET','utf8mb4');$table_prefix='wp_';\ndefine('WP_HOME','http://localhost:8080');define('WP_SITEURL','http://localhost:8080');define('WP_ENVIRONMENT_TYPE','local');define('DISALLOW_FILE_EDIT',true);define('WP_DEBUG',false);\n${salts}\nif(!defined('ABSPATH'))define('ABSPATH',__DIR__.'/');require_once ABSPATH.'wp-settings.php';\n`);
}
await fs.mkdir(path.join(wp,'wp-content','plugins','rwa-headless'),{recursive:true});
await fs.copyFile('wordpress/plugins/rwa-headless/rwa-headless.php',path.join(wp,'wp-content','plugins','rwa-headless','rwa-headless.php'));
const bootstrap=spawn(php,['-c',path.join(rt,'php','php.ini'),'scripts/wp-bootstrap.php'],{env,windowsHide:true,stdio:['ignore','pipe','inherit']});
let output='';bootstrap.stdout.on('data',d=>output+=d);
await new Promise((resolve,reject)=>bootstrap.on('exit',code=>code?reject(Error('WordPress bootstrap failed')):resolve()));
let info;try{info=JSON.parse(output.slice(output.indexOf('{')));}catch{throw Error('Unexpected bootstrap result: '+output.slice(0,120));}
if(info.password)await fs.writeFile('.env.local',`CONTENT_MODE=wordpress\nSITE_STAGE=staging\nSITE_URL=http://localhost:3000\nWORDPRESS_URL=http://localhost:8080\nWORDPRESS_PUBLIC_URL=http://localhost:8080\nWORDPRESS_USER=${process.env.WP_ADMIN_USER}\nWORDPRESS_APP_PASSWORD=${info.password}\nREVALIDATE_SECRET=${process.env.REVALIDATE_SECRET}\nPREVIEW_SECRET=${process.env.PREVIEW_SECRET}\n`,{mode:0o600});
const server=spawn(php,['-c',path.join(rt,'php','php.ini'),'-S','127.0.0.1:8080','-t',wp,'scripts/wp-router.php'],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
server.stdout.on('data',()=>{});server.stderr.on('data',d=>{if(/Fatal error|Parse error/.test(d.toString()))console.error(d.toString());});
console.log('MariaDB 11.4.10: 127.0.0.1:3307 (private development port)');
console.log('WordPress 7.1.3 / PHP 8.4.27: http://localhost:8080/wp-admin/');
console.log('Local admin credentials: ignored .env; application password: ignored .env.local.');
function stop(){server.kill();db.kill();process.exit();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
server.on('exit',()=>{db.kill();});
