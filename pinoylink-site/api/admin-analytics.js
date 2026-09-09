const ENDPOINT='https://api.3minapi.com/api/v1/data/z28zivht4w2c5eia587eq';

function rowsFrom(data){
  if(Array.isArray(data))return data;
  if(Array.isArray(data?.records))return data.records;
  if(Array.isArray(data?.data))return data.data;
  if(Array.isArray(data?.items))return data.items;
  return [];
}
function payloadOf(r){return r?.payload||r?.data||r||{}}
function bump(map,key){if(!key)return;map[key]=(map[key]||0)+1}
function top(map,n=8){return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([name,count])=>({name,count}))}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const token=String(req.headers['x-admin-token']||'');
  if(!process.env.PINOYLINK_ADMIN_TOKEN||token!==process.env.PINOYLINK_ADMIN_TOKEN)return res.status(401).json({error:'Unauthorized'});
  const key=process.env.THREEMIN_ANALYTICS_READ_KEY;
  if(!key)return res.status(503).json({error:'Analytics read key is not configured.'});
  try{
    let all=[],cursor='';
    for(let i=0;i<10;i++){
      const url=new URL(ENDPOINT);url.searchParams.set('limit','30');if(cursor)url.searchParams.set('cursor',cursor);
      const r=await fetch(url,{headers:{authorization:`Bearer ${key}`}});if(!r.ok)throw new Error('analytics '+r.status);
      const data=await r.json();all.push(...rowsFrom(data));cursor=data?.pagination?.next_cursor||data?.next_cursor||'';if(!cursor)break;
    }
    const now=Date.now(),day=86400000;
    const events=all.map(payloadOf).filter(Boolean);
    const in7=events.filter(e=>{const t=Date.parse(e.occurred_at||'');return Number.isFinite(t)&&now-t<=7*day});
    const in30=events.filter(e=>{const t=Date.parse(e.occurred_at||'');return Number.isFinite(t)&&now-t<=30*day});
    const pages={},stories={},referrers={},devices={},ctas={},types={},sessions7=new Set(),sessions30=new Set();
    for(const e of in30){bump(pages,e.page_path);bump(stories,e.story_slug);bump(referrers,e.referrer_host||'Direct / Unknown');bump(devices,e.device_type||'unknown');bump(ctas,e.cta);bump(types,e.event_type);if(e.session_id)sessions30.add(e.session_id)}
    for(const e of in7)if(e.session_id)sessions7.add(e.session_id);
    return res.status(200).json({ok:true,generated_at:new Date().toISOString(),sample_size:events.length,seven_day:{events:in7.length,sessions:sessions7.size},thirty_day:{events:in30.length,sessions:sessions30.size},event_types:types,top_pages:top(pages),top_stories:top(stories),top_referrers:top(referrers),devices:top(devices),top_ctas:top(ctas)});
  }catch(error){console.error('PinoyLink admin analytics error',error);return res.status(502).json({error:'Analytics data is temporarily unavailable.'});}
}
