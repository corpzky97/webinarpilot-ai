const ENDPOINT='https://api.3minapi.com/api/v1/data/3y6fllsfrees1bwcbjac3';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_ADVERTISERS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Advertising inquiry service is not configured yet.'});
  const body=req.body||{};
  const email=String(body.email||'').trim().toLowerCase();
  const businessName=String(body.business_name||'').trim();
  const contactName=String(body.contact_name||'').trim();
  const interest=String(body.interest||'').trim();
  if(!businessName||!contactName||!interest)return res.status(400).json({error:'Please complete the required fields.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const clean=(v,max=500)=>String(v||'').trim().slice(0,max);
  const payload={
    business_name:clean(businessName,120),
    contact_name:clean(contactName,120),
    email,
    phone:clean(body.phone,60),
    business_type:clean(body.business_type,120),
    island:clean(body.island,80),
    website:clean(body.website,300),
    interest:clean(interest,120),
    budget_range:clean(body.budget_range,80),
    message:clean(body.message,2500),
    consent_source:'pinoylinkhawaii.com advertiser inquiry',
    submitted_at:new Date().toISOString(),
    status:'new'
  };
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});
    const text=await upstream.text();
    if(!upstream.ok){console.error('PinoyLink advertise upstream error',upstream.status,text);return res.status(upstream.status>=500?502:400).json({error:'Advertising inquiry could not be submitted.'});}
    return res.status(200).json({ok:true});
  }catch(error){
    console.error('PinoyLink advertise error',error);
    return res.status(502).json({error:'Advertising inquiry service is temporarily unavailable.'});
  }
}