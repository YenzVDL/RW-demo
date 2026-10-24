import type {NextConfig} from 'next';
import redirects from './content/redirects.json';
const config:NextConfig={
  output:'standalone',poweredByHeader:false,devIndicators:false,
  async redirects(){return redirects;},
  async headers(){const mediaOrigin=process.env.WORDPRESS_PUBLIC_URL?new URL(process.env.WORDPRESS_PUBLIC_URL).origin:'';return [{source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
    {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==='development'?" 'unsafe-eval'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: ${mediaOrigin}; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`},
    ...(process.env.SITE_STAGE!=='production'?[{key:'X-Robots-Tag',value:'noindex, nofollow'}]:[])
  ]}];}
};
export default config;
