import sanitize from 'sanitize-html';
export function richtext(value:string) {
  return sanitize(value.replace(/\[[^\]]*\]/g,''),{
    allowedTags:['p','h2','h3','h4','ul','ol','li','strong','em','br','a','blockquote','table','thead','tbody','tr','th','td'],
    allowedAttributes:{a:['href']},allowedSchemes:['https','http','tel','mailto'],
    transformTags:{a:(_tag,attrs)=>({tagName:'a',attribs:{...attrs,...(attrs.href?.startsWith('http')?{rel:'noopener noreferrer'}:{})}})},
  });
}
