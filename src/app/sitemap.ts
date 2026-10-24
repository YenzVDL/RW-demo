import type {MetadataRoute} from 'next';
import {getSite,production,siteUrl} from '@/lib/content';
import {isApproved} from '@/lib/policy.mjs';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{if(!production())return [];const site=await getSite();return site.units.filter(u=>u.route&&isApproved(u)).map(u=>({url:siteUrl()+u.route,lastModified:u.sourceModifiedAt}));}
