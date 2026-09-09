const ENDPOINT='https://api.3minapi.com/api/v1/data/szaxixwya7fckx6dpu48x';

function clean(v,n=220){return String(v||'').trim().slice(0,n)}
function rows(data){return data?.data?.data||data?.data||[]}
function cursor(data){return data?.data?.pagination?.next_cursor||data?.pagination?.next_cursor||''}
function safeRow(r){return {
  case_id:clean(r.case_id,80),
  report_type:clean(r.report_type,20),
  item_category:clean(r.item_category,80),
  item_title:clean(r.item_title,120),
  description:clean(r.description,900),
  island:clean(r.island,60),
  city_area:clean(r.city_area,100),
  location_detail:clean(r.location_detail,180),
  event_date:clean(r.event_date,40),
  image_url:clean(r.image_url,500),
  published_at:clean(r.published_at,50),
  public_status:clean(r.public_status,30)
}}

export default async function handler(req,res){
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=120, stale-while-revalidate=300');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_LOST_FOUND_PUBLIC_READ_KEY;
  if(!key)return res.status(503).json({error:'Lost & Found public listings are not configured yet.'});
  const q=clean(req.query?.q,120).toLowerCase();
  const island=clean(req.query?.island,60).toLowerCase();
  const reportType=clean(req.query?.type,20).toLowerCase();
  const category=clean(req.query?.category,80).toLowerCase();
  const pageCursor=clean(req.query?.cursor,500);
  try{
    const u=new URL(ENDPOINT);u.searchParams.set('limit','30');if(pageCursor)u.searchParams.set('cursor',pageCursor);
    const r=await fetch(u,{headers:{authorization:`Bearer ${key}`},cache:'no-store'});const data=await r.json().catch(()=>({}));
    if(!r.ok)return res.status(502).json({error:'Unable to load Lost & Found listings.'});
    const active=rows(data).filter(x=>x&&x.review_status==='approved'&&x.public_status==='active'&&x.status==='active');
    const filtered=active.filter(x=>{
      if(reportType&&reportType!=='all'&&String(x.report_type||'').toLowerCase()!==reportType)return false;
      if(island&&island!=='all'&&String(x.island||'').toLowerCase()!==island)return false;
      if(category&&category!=='all'&&!String(x.item_category||'').toLowerCase().includes(category))return false;
      if(q){const hay=[x.case_id,x.item_title,x.description,x.city_area,x.location_detail,x.island,x.item_category].join(' ').toLowerCase();if(!hay.includes(q))return false;}
      return true;
    }).map(safeRow);
    return res.status(200).json({ok:true,items:filtered,next_cursor:cursor(data)});
  }catch(e){console.error('Lost & Found public list error',e);return res.status(502).json({error:'Lost & Found listings are temporarily unavailable.'})}
}
