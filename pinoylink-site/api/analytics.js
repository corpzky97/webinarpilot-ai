const ENDPOINT='https://api.3minapi.com/api/v1/data/z28zivht4w2c5eia587eq';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_ANALYTICS_WRITE_KEY;
  if(!key)return res.status(204).end();
  const b=req.body||{};
  const clean=(v,max=300)=>String(v??'').trim().slice(0,max);
  const allowed=new Set(['page_view','story_view','cta_click','form_submit','form_success']);
  const eventType=allowed.has(clean(b.event_type,40))?clean(b.event_type,40):'page_view';
  const payload={
    event_id:clean(b.event_id,120)||('PLAE-'+Date.now().toString(36).toUpperCase()),
    event_type:eventType,
    page_path:clean(b.page_path,300),
    page_title:clean(b.page_title,220),
    story_slug:clean(b.story_slug,180),
    desk:clean(b.desk,80),
    cta:clean(b.cta,180),
    referrer_host:clean(b.referrer_host,180),
    device_type:clean(b.device_type,40),
    session_id:clean(b.session_id,120),
    campaign_id:clean(b.campaign_id,120),
    placement:clean(b.placement,120),
    advertiser:clean(b.advertiser,160),
    outbound_url:clean(b.outbound_url,500),
    occurred_at:new Date().toISOString(),
    status:'accepted'
  };
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});
    if(!upstream.ok)console.error('PinoyLink analytics upstream',upstream.status,await upstream.text());
    return res.status(204).end();
  }catch(error){console.error('PinoyLink analytics error',error);return res.status(204).end();}
}
