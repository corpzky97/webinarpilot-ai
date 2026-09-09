const ENDPOINT='https://api.3minapi.com/api/v1/data/cjamk6moj92tplgfs0uko';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_DIRECTORY_SUBMIT_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Directory submission service is not configured yet.'});
  const body=req.body||{};
  const clean=(v,max=500)=>String(v??'').trim().slice(0,max);
  const businessName=clean(body.business_name,140);
  const email=clean(body.email,180).toLowerCase();
  if(!businessName||!clean(body.category,120)||!clean(body.island,80))return res.status(400).json({error:'Please complete business name, category and island.'});
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const submissionId='DIR-'+Date.now().toString(36).toUpperCase();
  const tags=Array.isArray(body.tags)?body.tags.map(v=>clean(v,60)).filter(Boolean).slice(0,12):clean(body.tags,500).split(',').map(v=>v.trim()).filter(Boolean).slice(0,12);
  const payload={
    submission_id:submissionId,
    business_name:businessName,
    category:clean(body.category,120),
    description:clean(body.description,1200),
    island:clean(body.island,80),
    city:clean(body.city,100),
    address:clean(body.address,220),
    phone:clean(body.phone,60),
    email,
    website:clean(body.website,300),
    social_url:clean(body.social_url,300),
    tags,
    listing_type:'standard',
    submitted_at:new Date().toISOString(),
    review_status:'pending',
    review_notes:'',
    published_at:'',
    status:'active'
  };
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});
    const text=await upstream.text();
    if(!upstream.ok){console.error('Directory submit upstream error',upstream.status,text);return res.status(upstream.status>=500?502:400).json({error:'Directory submission could not be completed.'});}
    return res.status(200).json({ok:true,submission_id:submissionId});
  }catch(error){console.error('Directory submit error',error);return res.status(502).json({error:'Directory submission service is temporarily unavailable.'});}
}