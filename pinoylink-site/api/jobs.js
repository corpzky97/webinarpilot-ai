const ENDPOINT='https://api.3minapi.com/api/v1/data/e8g52rjaw680jivk1dmh8';
function clean(v,n=220){return String(v||'').trim().slice(0,n)}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_JOBS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Jobs submission service is not configured yet.'});
  const b=req.body||{};const email=clean(b.submitter_email,180).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid contact email.'});
  if(!clean(b.title,140)||!clean(b.employer,140)||!clean(b.description,2200))return res.status(400).json({error:'Job title, employer, and description are required.'});
  const id='JOB-'+Date.now().toString(36).toUpperCase();const t=new Date().toISOString();
  const payload={job_id:id,title:clean(b.title,140),employer:clean(b.employer,140),description:clean(b.description,2200),category:clean(b.category,60),employment_type:clean(b.employment_type,50),island:clean(b.island,60),city:clean(b.city,100),work_location:clean(b.work_location,180),pay_range:clean(b.pay_range,100),application_url:clean(b.application_url,400),public_contact:clean(b.public_contact,220),application_deadline:clean(b.application_deadline,60),submitter_name:clean(b.submitter_name,120),submitter_email:email,submitter_phone:clean(b.submitter_phone,50),source_type:clean(b.source_type,50),review_status:'pending',public_status:'draft',submitted_at:t,published_at:'',archived_at:'',archive_reason:'',status:'active'};
  try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify(payload)});if(!r.ok)return res.status(r.status>=500?502:400).json({error:'Job listing could not be submitted.'});return res.status(200).json({ok:true,job_id:id})}catch(e){console.error(e);return res.status(502).json({error:'Jobs service is temporarily unavailable.'})}
}