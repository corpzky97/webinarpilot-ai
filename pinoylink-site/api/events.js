const ENDPOINT='https://api.3minapi.com/api/v1/data/1tcjl4qt6xmqfs9hmxnb0';
function clean(v,n=220){return String(v||'').trim().slice(0,n)}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_EVENTS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Event submission service is not configured yet.'});
  const b=req.body||{};const email=clean(b.submitter_email,180).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid contact email.'});
  if(!clean(b.title,140)||!clean(b.description,1800)||!clean(b.start_at,60))return res.status(400).json({error:'Event title, description, and start date/time are required.'});
  const id='EVT-'+Date.now().toString(36).toUpperCase();const t=new Date().toISOString();
  const payload={event_id:id,title:clean(b.title,140),description:clean(b.description,1800),category:clean(b.category,60),organizer:clean(b.organizer,140),island:clean(b.island,60),city:clean(b.city,100),venue:clean(b.venue,160),public_address:clean(b.public_address,220),start_at:clean(b.start_at,60),end_at:clean(b.end_at,60),cost_text:clean(b.cost_text,100),registration_url:clean(b.registration_url,400),public_contact:clean(b.public_contact,220),submitter_name:clean(b.submitter_name,120),submitter_email:email,submitter_phone:clean(b.submitter_phone,50),source_type:clean(b.source_type,50),review_status:'pending',public_status:'draft',submitted_at:t,published_at:'',archived_at:'',archive_reason:'',status:'active'};
  try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify(payload)});if(!r.ok)return res.status(r.status>=500?502:400).json({error:'Event could not be submitted.'});return res.status(200).json({ok:true,event_id:id})}catch(e){console.error(e);return res.status(502).json({error:'Event service is temporarily unavailable.'})}
}