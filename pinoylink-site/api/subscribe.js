const ENDPOINT='https://api.3minapi.com/api/v1/data/1ab2x5w26lthxsswkogmp';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_SUBSCRIBERS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Subscription service is not configured yet.'});
  const body=req.body||{};
  const email=String(body.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const allowedLanguages=new Set(['english','tagalog','ilocano','bisaya']);
  const allowedIslands=new Set(['Oahu','Maui','Hawaii Island','Kauai','Molokai','Lanai','other']);
  const payload={
    email,
    first_name:String(body.first_name||'').trim().slice(0,80),
    language:allowedLanguages.has(body.language)?body.language:'english',
    island:allowedIslands.has(body.island)?body.island:'other',
    philippines_province:'',
    plan:'free',
    interests:['hawaii','traffic','weather','philippines','immigration','community','jobs','business'],
    consent_source:'pinoylinkhawaii.com native signup',
    subscribed_at:new Date().toISOString(),
    status:'active'
  };
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});
    const text=await upstream.text();
    if(!upstream.ok)return res.status(upstream.status>=500?502:400).json({error:'Subscription could not be completed.'});
    return res.status(200).json({ok:true});
  }catch(error){
    console.error('PinoyLink subscribe error',error);
    return res.status(502).json({error:'Subscription service is temporarily unavailable.'});
  }
}
