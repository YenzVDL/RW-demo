export type Unit = {
  key:string; sourceId:number; sourceUrl:string; fetchedAt:string; sourceModifiedAt:string;
  originalText:string; title:string; route:string; language:string; html:string;
  editorialStatus:'source_imported'|'needs_confirmation'|'proposed'|'approved';
  publicationStatus:string; kind:string; essential:boolean; importHash:string;
  phone?:string; address?:string; email?:string; category?:string; channel?:string;
  image?:string; fileUrl?:string; year?:number; documentType?:string; role?:string;
  imageSrcSet?:string; requirements?:string; commitment?:string; startMoment?:string; applicationUrl?:string;
  active?:boolean; period?:string; translationKey?:string; link?:string;
  group?:string;
  startsAt?:string; endsAt?:string; deadline?:string; recruitmentStatus?:string;
  schedule?:string; purpose?:string; appointmentRule?:string; contactKey?:string;
  appliesTo?:string;
  approvedBy?:string; approvedAt?:string; navigationLabel?:string;
};
export type SiteData={fetchedAt:string; units:Unit[]; logo:string; mode:'wordpress'|'offline'; unavailable?:boolean;blocked?:boolean};
