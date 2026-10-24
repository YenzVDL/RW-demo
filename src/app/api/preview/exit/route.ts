import {draftMode,cookies} from 'next/headers';
export async function GET(){(await draftMode()).disable();(await cookies()).delete('rwa-preview-id');return new Response(null,{status:307,headers:{Location:'/','Cache-Control':'private, no-store'}});}
