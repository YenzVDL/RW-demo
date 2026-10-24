export const statuses = ['source_imported','needs_confirmation','proposed','approved'];
export function isApproved(unit) {
  return unit.editorialStatus==='approved' && !!unit.approvedBy && !!unit.approvedAt;
}
export function isVisible(unit, production=false) {
  return unit.publicationStatus==='publish' && (!production || isApproved(unit));
}
export function activeAt(unit, now=Date.now()) {
  const t=typeof now==='number'?now:Date.parse(now);
  if(unit.kind==='notice' && (!unit.startsAt||!unit.endsAt)) return false;
  for(const value of [unit.startsAt,unit.endsAt,unit.deadline].filter(Boolean)) {
    if(!/T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  }
  if(unit.startsAt && Date.parse(unit.startsAt)>t) return false;
  if(unit.endsAt && Date.parse(unit.endsAt)<=t) return false;
  if(unit.kind==='recruitment' && unit.deadline && Date.parse(unit.deadline)<=t) return false;
  return true;
}
export function releaseIssues(units) {
  const errors=[];
  for(const key of ['home-intro','contact','phone','walkin','appointment','recruitment','privacy','terms','accountability']) {
    const u=units.find(x=>x.key===key);
    if(!u||!isVisible(u,true)) errors.push(`Essentiële inhoud niet goedgekeurd/gepubliceerd: ${key}`);
  }
  for(const u of units.filter(x=>x.publicationStatus==='publish')) {
    if(u.essential&&!isApproved(u)) errors.push(`${u.key}: ${u.editorialStatus}; inhoudelijke controle vereist`);
    if(u.editorialStatus==='approved'&&!isApproved(u)) errors.push(`${u.key}: goedkeurder/datum ontbreekt`);
    if(u.kind==='notice'&&(!u.startsAt||!u.endsAt)) errors.push(`${u.key}: melding mist begin/einde met jaartal en tijdzone`);
  }
  const contact=units.find(x=>x.key==='contact');
  if(contact&&(!/^\+?[\d\s–-]{8,20}$/.test(contact.phone||'')||!contact.address))errors.push('Centrale contactgegevens missen telefoonnummer of adres');
  for(const channel of units.filter(x=>x.kind==='channel'))if(!channel.schedule)errors.push(`${channel.key}: actuele tijden ontbreken`);
  if(!units.some(u=>u.kind==='person'&&u.group==='board'&&u.active&&isApproved(u)&&u.publicationStatus==='publish'))errors.push('Actueel bestuur nog niet bevestigd in het gedeelde bestuursmodel');
  return [...new Set(errors)];
}
export function amsterdamTime(value) {
  return new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',dateStyle:'long',timeStyle:'short'}).format(new Date(value));
}
