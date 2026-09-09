const ENDPOINT='https://api.3minapi.com/api/v1/data/votr4wja54cfzxpeth3ut';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_PREFERENCES_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Preference service is not configured yet.'});
  const body=req.body||{};
  const email=String(body.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const allowedLanguages=new Set(['english','tagalog','ilocano','bisaya']);
  const allowedIslands=new Set(['Oahu','Maui','Hawaii Island','Kauai','Molokai','Lanai','other']);
  const allowedInterests=new Set(['hawaii','traffic','weather','philippines','immigration','community','jobs','business','consular','markets']);
  const allowedActions=new Set(['update_preferences','unsubscribe']);
  const action=allowedActions.has(body.action)?body.action:'update_preferences';
  const interests=Array.isArray(body.interests)?body.interests.filter(v=>allowedInterests.has(v)).slice(0,10):[];
  const payload={
    email,
    first_name:String(body.first_name||'').trim().slice(0,80),
    language:allowedLanguages.has(body.language)?body.language:'english',
    island:allowedIslands.has(body.island)?body.island:'other',
    philippines_province:String(body.philippines_province||'').trim().slice(0,100),
    interests,
    action,
    submitted_at:new Date().toISOString(),
    consent_source:'pinoylinkhawaii.com preference center',
    status:action==='unsubscribe'?'unsubscribe_requested':'pending_sync'
  };
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});
    if(!upstream.ok)return res.status(upstream.status>=500?502:400).json({error:'Preferences could not be saved.'});
    return res.status(200).json({ok:true,action});
  }catch(error){
    console.error('PinoyLink preferences error',error);
    return res.status(502).json({error:'Preference service is temporarily unavailable.'});
  }
}
