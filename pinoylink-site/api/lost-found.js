const ENDPOINT='https://api.3minapi.com/api/v1/data/szaxixwya7fckx6dpu48x';
function clean(v,n=180){return String(v||'').trim().slice(0,n)}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_LOST_FOUND_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Lost & Found intake is not configured yet.'});
  const b=req.body||{};
  const email=clean(b.contact_email,160).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid contact email.'});
  const reportType=['lost','found'].includes(b.report_type)?b.report_type:'lost';
  const caseId='LF-'+Date.now().toString(36).toUpperCase();
  const payload={case_id:caseId,report_type:reportType,item_category:clean(b.item_category,80),item_title:clean(b.item_title,100),description:clean(b.description,900),island:clean(b.island,60),city_area:clean(b.city_area,100),location_detail:clean(b.location_detail,180),event_date:clean(b.event_date,40),contact_name:clean(b.contact_name,100),contact_email:email,contact_phone:clean(b.contact_phone,40),preferred_contact:clean(b.preferred_contact,30),image_url:'',proof_prompt:clean(b.proof_prompt,180),review_status:'pending',public_status:'draft',submitted_at:new Date().toISOString(),published_at:'',status:'active'};
  try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});if(!r.ok)return res.status(r.status>=500?502:400).json({error:'Lost & Found report could not be submitted.'});return res.status(200).json({ok:true,case_id:caseId})}catch(e){console.error(e);return res.status(502).json({error:'Lost & Found service is temporarily unavailable.'})}
}