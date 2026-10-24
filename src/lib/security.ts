import {createHmac,timingSafeEqual} from 'node:crypto';
export function validSignature(secret:string|undefined,message:string,signature:string|null) {
  if(!secret||secret.length<32||!signature||!/^[a-f0-9]{64}$/.test(signature))return false;
  const expected=createHmac('sha256',secret).update(message).digest('hex');
  return timingSafeEqual(Buffer.from(expected),Buffer.from(signature));
}
export function fresh(timestamp:string|null) {
  return !!timestamp&&/^\d+$/.test(timestamp)&&Math.abs(Date.now()/1000-Number(timestamp))<300;
}
