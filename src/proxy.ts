import {NextResponse,type NextRequest} from 'next/server';
export function proxy(request:NextRequest){
  if(['/sample-page','/service','/team-profile','/home-oud'].includes(request.nextUrl.pathname.replace(/\/$/,'')))return new NextResponse('<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Pagina vervallen</title><main style="max-width:700px;margin:80px auto;padding:24px;font:18px/1.7 Arial"><h1>Deze pagina is vervallen.</h1><p>Deze oude pagina is niet opgenomen in de nieuwe website.</p><a href="/juridische-hulp">Juridische hulp</a></main></html>',{status:410,headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'}});
  const h=new Headers(request.headers);h.set('x-rwa-lang',request.nextUrl.pathname.startsWith('/en')?'en':'nl');return NextResponse.next({request:{headers:h}});
}
export const config={matcher:['/((?!api|_next|assets|favicon.ico).*)']};
