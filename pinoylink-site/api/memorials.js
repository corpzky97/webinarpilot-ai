const ENDPOINT='https://api.3minapi.com/api/v1/data/pu1500ylpx74kqrjq6af9';
function clean(v,n=220){return String(v||'').trim().slice(0,n)}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_MEMORIALS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Memorial submission service is not configured yet.'});
  const b=req.body||{};
  const email=clean(b.family_contact_email,180).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid family/contact email.'});
  if(!clean(b.full_name,140)||!clean(b.death_date,40)||!clean(b.life_tribute,2500))return res.status(400).json({error:'Name, date of death, and tribute are required.'});
  const memorialId='MEM-'+Date.now().toString(36).toUpperCase();
  const payload={memorial_id:memorialId,full_name:clean(b.full_name,140),birth_date:clean(b.birth_date,40),death_date:clean(b.death_date,40),photo_url:'',life_tribute:clean(b.life_tribute,2500),service_details:clean(b.service_details,1000),service_location:clean(b.service_location,220),family_contact_name:clean(b.family_contact_name,120),family_contact_email:email,family_contact_phone:clean(b.family_contact_phone,50),public_contact:clean(b.public_contact,220),donation_flower_url:clean(b.donation_flower_url,400),source_type:clean(b.source_type,50),verification_note:'',review_status:'pending',public_status:'draft',submitted_at:new Date().toISOString(),published_at:'',service_end_date:clean(b.service_end_date,40),archived_at:'',archive_reason:'',status:'active'};
  try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});if(!r.ok)return res.status(r.status>=500?502:400).json({error:'Memorial could not be submitted.'});return res.status(200).json({ok:true,memorial_id:memorialId})}catch(e){console.error(e);return res.status(502).json({error:'Memorial service is temporarily unavailable.'})}
}