const ENDPOINT='https://api.3minapi.com/api/v1/data/hkhjcuyt7fctp8kwax815';
function clean(v,n=300){return String(v||'').trim().slice(0,n)}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_LOST_FOUND_CLAIMS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Lost & Found claim intake is not configured yet.'});
  const b=req.body||{};const email=clean(b.claimant_email,180).toLowerCase();
  if(!clean(b.case_id,80))return res.status(400).json({error:'Case reference is required.'});
  if(!clean(b.claimant_name,120))return res.status(400).json({error:'Your name is required.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  if(!clean(b.proof_answer,1200))return res.status(400).json({error:'Please provide ownership proof details.'});
  const claimId='CLM-'+Date.now().toString(36).toUpperCase();
  const payload={claim_id:claimId,case_id:clean(b.case_id,80),claimant_name:clean(b.claimant_name,120),claimant_email:email,claimant_phone:clean(b.claimant_phone,50),claimant_message:clean(b.claimant_message,1200),proof_answer:clean(b.proof_answer,1200),preferred_contact:['email','phone'].includes(b.preferred_contact)?b.preferred_contact:'email',review_status:'pending',submitted_at:new Date().toISOString(),reviewed_at:'',status:'active'};
  try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify(payload)});if(!r.ok)return res.status(r.status>=500?502:400).json({error:'Claim request could not be submitted.'});return res.status(200).json({ok:true,claim_id:claimId})}catch(e){console.error(e);return res.status(502).json({error:'Claim service is temporarily unavailable.'})}
}
