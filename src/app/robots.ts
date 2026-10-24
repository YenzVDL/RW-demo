import type {MetadataRoute} from 'next';
import {production,siteUrl} from '@/lib/content';
export const dynamic='force-dynamic';
export default function robots():MetadataRoute.Robots{return {rules:production()?{userAgent:'*',allow:'/',disallow:['/api/','/en/translation-unavailable','/translation-unavailable']}:{userAgent:'*',disallow:'/'},sitemap:production()?siteUrl()+'/sitemap.xml':undefined};}
