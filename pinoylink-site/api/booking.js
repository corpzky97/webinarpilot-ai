const ENDPOINT='https://api.3minapi.com/api/v1/data/afmf9zu771p4xlq8xvrta';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_AD_BOOKINGS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Booking service is not configured yet.'});
  const body=req.body||{};
  const clean=(v,max=500)=>String(v??'').trim().slice(0,max);
  const email=clean(body.email,180).toLowerCase();
  if(!clean(body.business_name,120)||!clean(body.contact_name,120)||!clean(body.placement,120))return res.status(400).json({error:'Please complete the required fields.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const bookingId='PL-'+Date.now().toString(36).toUpperCase();
  const payload={booking_id:bookingId,business_name:clean(body.business_name,120),contact_name:clean(body.contact_name,120),email,phone:clean(body.phone,60),island:clean(body.island,80),placement:clean(body.placement,120),preferred_start:clean(body.preferred_start,40),preferred_end:clean(body.preferred_end,40),creative_ready:Boolean(body.creative_ready),notes:clean(body.notes,2500),quote_status:'requested',payment_status:'not_requested',payment_provider:'',payment_link:'',campaign_status:'requested',submitted_at:new Date().toISOString(),status:'active'};
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});
    const text=await upstream.text();
    if(!upstream.ok){console.error('PinoyLink booking upstream error',upstream.status,text);return res.status(upstream.status>=500?502:400).json({error:'Booking request could not be submitted.'});}
    return res.status(200).json({ok:true,booking_id:bookingId});
  }catch(error){console.error('PinoyLink booking error',error);return res.status(502).json({error:'Booking service is temporarily unavailable.'});}
}