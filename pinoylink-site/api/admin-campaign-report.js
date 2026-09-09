const ANALYTICS='https://api.3minapi.com/api/v1/data/z28zivht4w2c5eia587eq';
const BOOKINGS='https://api.3minapi.com/api/v1/data/afmf9zu771p4xlq8xvrta';
function rowsFrom(data){if(Array.isArray(data))return data;if(Array.isArray(data?.records))return data.records;if(Array.isArray(data?.data))return data.data;if(Array.isArray(data?.items))return data.items;return []}
function payloadOf(r){const p=r?.payload||r?.data||r||{};return {...p,_record_id:r?.id||r?.record_id||p?._record_id||''}}
async function fetchPages(url,key,pages=12){let all=[],cursor='';for(let i=0;i<pages;i++){const u=new URL(url);u.searchParams.set('limit','30');if(cursor)u.searchParams.set('cursor',cursor);const r=await fetch(u,{headers:{authorization:`Bearer ${key}`}});if(!r.ok)throw new Error('upstream '+r.status);const d=await r.json();all.push(...rowsFrom(d).map(payloadOf));cursor=d?.pagination?.next_cursor||d?.next_cursor||'';if(!cursor)break}return all}
function safeDate(v){const t=Date.parse(v||'');return Number.isFinite(t)?t:null}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const token=String(req.headers['x-admin-token']||'');
  if(!process.env.PINOYLINK_ADMIN_TOKEN||token!==process.env.PINOYLINK_ADMIN_TOKEN)return res.status(401).json({error:'Unauthorized'});
  const analyticsKey=process.env.THREEMIN_ANALYTICS_READ_KEY;
  const bookingKey=process.env.THREEMIN_AD_BOOKINGS_READ_KEY;
  if(!analyticsKey||!bookingKey)return res.status(503).json({error:'Campaign reporting is not fully configured yet.'});
  const campaignId=String(req.query.campaign_id||'').trim().slice(0,120);
  if(!campaignId)return res.status(400).json({error:'campaign_id is required.'});
  try{
    const [events,bookings]=await Promise.all([fetchPages(ANALYTICS,analyticsKey,12),fetchPages(BOOKINGS,bookingKey,5)]);
    const booking=bookings.find(b=>String(b.booking_id||'').trim()===campaignId)||null;
    const matched=events.filter(e=>String(e.campaign_id||'').trim()===campaignId);
    const start=safeDate(booking?.preferred_start),end=safeDate(booking?.preferred_end);
    const within=matched.filter(e=>{const t=safeDate(e.occurred_at);if(!t)return true;if(start&&t<start)return false;if(end&&t>end+86400000-1)return false;return true});
    const impressions=within.filter(e=>['page_view','story_view'].includes(String(e.event_type))).length;
    const clicks=within.filter(e=>String(e.event_type)==='cta_click').length;
    const conversions=within.filter(e=>['form_submit','form_success'].includes(String(e.event_type))).length;
    const sessions=new Set(within.map(e=>e.session_id).filter(Boolean));
    const pages={},devices={},referrers={},ctas={};
    for(const e of within){if(e.page_path)pages[e.page_path]=(pages[e.page_path]||0)+1;if(e.device_type)devices[e.device_type]=(devices[e.device_type]||0)+1;if(e.referrer_host)referrers[e.referrer_host]=(referrers[e.referrer_host]||0)+1;if(e.cta)ctas[e.cta]=(ctas[e.cta]||0)+1}
    const top=m=>Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name,count}));
    return res.status(200).json({ok:true,generated_at:new Date().toISOString(),campaign_id:campaignId,booking,metrics:{impressions,clicks,unique_sessions:sessions.size,conversions,ctr:impressions?Math.round((clicks/impressions)*10000)/100:0},top_pages:top(pages),devices:top(devices),referrers:top(referrers),top_ctas:top(ctas),events:within.slice(0,100)});
  }catch(error){console.error('PinoyLink campaign report error',error);return res.status(502).json({error:'Campaign report is temporarily unavailable.'});}
}
