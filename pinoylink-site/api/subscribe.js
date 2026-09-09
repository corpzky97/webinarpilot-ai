const ENDPOINT='https://api.3minapi.com/api/v1/data/1ab2x5w26lthxsswkogmp';

function cleanToken(v,max=120){return String(v||'').trim().replace(/[^a-zA-Z0-9._~-]/g,'').slice(0,max)}
function cleanPath(v){const s=String(v||'').trim().slice(0,240);return s.startsWith('/')?s:'/'}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.THREEMIN_SUBSCRIBERS_WRITE_KEY;
  if(!key)return res.status(503).json({error:'Subscription service is not configured yet.'});
  const body=req.body||{};
  const email=String(body.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});
  const allowedLanguages=new Set(['english','tagalog','ilocano','bisaya']);
  const allowedIslands=new Set(['Oahu','Maui','Hawaii Island','Kauai','Molokai','Lanai','other']);
  const allowedInterests=new Set(['hawaii','traffic','weather','philippines','immigration','community','jobs','business','consular','markets']);
  const interests=Array.isArray(body.interests)?body.interests.filter(v=>allowedInterests.has(v)).slice(0,10):[];
  const referralCode=cleanToken(body.referral_code,80);
  const referralSource=cleanToken(body.referral_source,80)||'direct';
  const referralCampaign=cleanToken(body.referral_campaign,100);
  const landingPath=cleanPath(body.landing_path);
  const payload={
    email,
    first_name:String(body.first_name||'').trim().slice(0,80),
    language:allowedLanguages.has(body.language)?body.language:'english',
    island:allowedIslands.has(body.island)?body.island:'other',
    philippines_province:String(body.philippines_province||'').trim().slice(0,100),
    plan:'free',
    interests:interests.length?interests:['hawaii','philippines','community'],
    consent_source:'pinoylinkhawaii.com native signup',
    subscribed_at:new Date().toISOString(),
    status:'active',
    referral_code:referralCode,
    referral_source:referralSource,
    referral_campaign:referralCampaign,
    landing_path:landingPath
  };
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(payload)});
    if(!upstream.ok)return res.status(upstream.status>=500?502:400).json({error:'Subscription could not be completed.'});
    return res.status(200).json({ok:true,preferences_url:'/preferences?email='+encodeURIComponent(email),referral_code:referralCode});
  }catch(error){
    console.error('PinoyLink subscribe error',error);
    return res.status(502).json({error:'Subscription service is temporarily unavailable.'});
  }
}
