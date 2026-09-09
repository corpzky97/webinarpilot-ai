const ARCHIVE_URL='https://raw.githubusercontent.com/corpzky97/webinarpilot-ai/main/pinoylink/archive.json';
const ORIGIN='https://pinoylinkhawaii.com';

function escXml(v){return String(v??'').replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]))}
function isoDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)}
function url(loc,{lastmod='',changefreq='',priority=''}={}){return `  <url><loc>${escXml(loc)}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}${changefreq?`<changefreq>${changefreq}</changefreq>`:''}${priority?`<priority>${priority}</priority>`:''}</url>`}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).send('Method not allowed');
  const fixed=[
    url(`${ORIGIN}/`,{changefreq:'daily',priority:'1.0'}),
    url(`${ORIGIN}/archive`,{changefreq:'daily',priority:'0.9'}),
    url(`${ORIGIN}/directory`,{changefreq:'weekly',priority:'0.8'}),
    url(`${ORIGIN}/directory-submit`,{changefreq:'monthly',priority:'0.5'}),
    url(`${ORIGIN}/advertise`,{changefreq:'monthly',priority:'0.7'}),
    url(`${ORIGIN}/media-kit`,{changefreq:'monthly',priority:'0.7'}),
    url(`${ORIGIN}/booking`,{changefreq:'monthly',priority:'0.6'}),
    url(`${ORIGIN}/preferences`,{changefreq:'monthly',priority:'0.4'})
  ];
  try{
    const r=await fetch(ARCHIVE_URL+'?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw new Error('archive '+r.status);
    const data=await r.json();
    const stories=(Array.isArray(data?.stories)?data.stories:[])
      .filter(s=>s&&s.slug)
      .slice(0,300)
      .map(s=>url(`${ORIGIN}/news/${encodeURIComponent(s.slug)}`,{lastmod:isoDate(s.published_at),changefreq:'monthly',priority:'0.7'}));
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...fixed,...stories].join('\n')}\n</urlset>\n`;
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).send(xml);
  }catch(error){
    console.error('PinoyLink sitemap error',error);
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fixed.join('\n')}\n</urlset>\n`;
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
    return res.status(200).send(xml);
  }
}
