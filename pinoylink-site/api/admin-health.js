const CHECKS=[
  ['Homepage','https://pinoylinkhawaii.com/'],
  ['Archive','https://pinoylinkhawaii.com/archive'],
  ['Directory','https://pinoylinkhawaii.com/directory'],
  ['Advertise','https://pinoylinkhawaii.com/advertise'],
  ['Booking','https://pinoylinkhawaii.com/booking'],
  ['Preferences','https://pinoylinkhawaii.com/preferences'],
  ['Feed','https://raw.githubusercontent.com/corpzky97/webinarpilot-ai/main/pinoylink/feed.json'],
  ['Archive JSON','https://raw.githubusercontent.com/corpzky97/webinarpilot-ai/main/pinoylink/archive.json']
];

async function ping(name,url){
  const started=Date.now();
  try{
    const r=await fetch(url,{method:'GET',headers:{'user-agent':'PinoyLink-Health/1.0'},redirect:'follow'});
    return {name,url,ok:r.ok,status:r.status,latency_ms:Date.now()-started};
  }catch(error){
    return {name,url,ok:false,status:0,latency_ms:Date.now()-started,error:String(error?.message||error)};
  }
}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const expected=process.env.PINOYLINK_ADMIN_TOKEN;
  const supplied=String(req.headers['x-admin-token']||'');
  if(!expected||supplied!==expected)return res.status(401).json({error:'Unauthorized'});
  const checks=await Promise.all(CHECKS.map(([name,url])=>ping(name,url)));
  const env={
    THREEMIN_SUBSCRIBERS_WRITE_KEY:Boolean(process.env.THREEMIN_SUBSCRIBERS_WRITE_KEY),
    THREEMIN_SUBSCRIBERS_READ_KEY:Boolean(process.env.THREEMIN_SUBSCRIBERS_READ_KEY),
    THREEMIN_NEWSROOM_READ_KEY:Boolean(process.env.THREEMIN_NEWSROOM_READ_KEY),
    THREEMIN_ADVERTISERS_WRITE_KEY:Boolean(process.env.THREEMIN_ADVERTISERS_WRITE_KEY),
    THREEMIN_AD_PIPELINE_READ_KEY:Boolean(process.env.THREEMIN_AD_PIPELINE_READ_KEY),
    THREEMIN_AD_BOOKINGS_WRITE_KEY:Boolean(process.env.THREEMIN_AD_BOOKINGS_WRITE_KEY),
    THREEMIN_PAYMENT_EVENTS_WRITE_KEY:Boolean(process.env.THREEMIN_PAYMENT_EVENTS_WRITE_KEY),
    STRIPE_WEBHOOK_SECRET:Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    PINOYLINK_ADMIN_TOKEN:Boolean(process.env.PINOYLINK_ADMIN_TOKEN)
  };
  const public_ok=checks.every(c=>c.ok);
  const config_ok=Object.entries(env).filter(([k])=>!['THREEMIN_AD_BOOKINGS_WRITE_KEY','THREEMIN_PAYMENT_EVENTS_WRITE_KEY','STRIPE_WEBHOOK_SECRET'].includes(k)).every(([,v])=>v);
  return res.status(200).json({ok:public_ok&&config_ok,public_ok,config_ok,checked_at:new Date().toISOString(),checks,env});
}