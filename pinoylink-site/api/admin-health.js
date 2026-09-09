const CHECKS=[
  ['Homepage','https://pinoylinkhawaii.com/'],
  ['Archive','https://pinoylinkhawaii.com/archive'],
  ['Directory','https://pinoylinkhawaii.com/directory'],
  ['Directory Submit','https://pinoylinkhawaii.com/directory-submit'],
  ['Advertise','https://pinoylinkhawaii.com/advertise'],
  ['Media Kit','https://pinoylinkhawaii.com/media-kit'],
  ['Booking','https://pinoylinkhawaii.com/booking'],
  ['Preferences','https://pinoylinkhawaii.com/preferences'],
  ['Sitemap','https://pinoylinkhawaii.com/sitemap.xml'],
  ['Admin Revenue','https://pinoylinkhawaii.com/admin-revenue'],
  ['Admin Campaigns','https://pinoylinkhawaii.com/admin-campaigns'],
  ['Admin Campaign Report','https://pinoylinkhawaii.com/admin-campaign-report'],
  ['Admin Backups','https://pinoylinkhawaii.com/admin-backups'],
  ['Feed','https://raw.githubusercontent.com/corpzky97/webinarpilot-ai/main/pinoylink/feed.json'],
  ['Archive JSON','https://raw.githubusercontent.com/corpzky97/webinarpilot-ai/main/pinoylink/archive.json'],
  ['Directory JSON','https://raw.githubusercontent.com/corpzky97/webinarpilot-ai/main/pinoylink/business-directory.json']
];

async function ping(name,url){
  const started=Date.now();
  try{
    const r=await fetch(url,{method:'GET',headers:{'user-agent':'PinoyLink-Health/2.0'},redirect:'follow'});
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
    THREEMIN_NEWSROOM_WRITE_KEY:Boolean(process.env.THREEMIN_NEWSROOM_WRITE_KEY),
    THREEMIN_ADVERTISERS_WRITE_KEY:Boolean(process.env.THREEMIN_ADVERTISERS_WRITE_KEY),
    THREEMIN_AD_PIPELINE_READ_KEY:Boolean(process.env.THREEMIN_AD_PIPELINE_READ_KEY),
    THREEMIN_AD_BOOKINGS_WRITE_KEY:Boolean(process.env.THREEMIN_AD_BOOKINGS_WRITE_KEY),
    THREEMIN_AD_BOOKINGS_READ_KEY:Boolean(process.env.THREEMIN_AD_BOOKINGS_READ_KEY),
    THREEMIN_AD_BOOKINGS_ADMIN_KEY:Boolean(process.env.THREEMIN_AD_BOOKINGS_ADMIN_KEY),
    THREEMIN_PAYMENT_EVENTS_WRITE_KEY:Boolean(process.env.THREEMIN_PAYMENT_EVENTS_WRITE_KEY),
    THREEMIN_PAYMENT_EVENTS_READ_KEY:Boolean(process.env.THREEMIN_PAYMENT_EVENTS_READ_KEY),
    THREEMIN_DIRECTORY_SUBMIT_WRITE_KEY:Boolean(process.env.THREEMIN_DIRECTORY_SUBMIT_WRITE_KEY),
    THREEMIN_DIRECTORY_ADMIN_KEY:Boolean(process.env.THREEMIN_DIRECTORY_ADMIN_KEY),
    THREEMIN_ANALYTICS_WRITE_KEY:Boolean(process.env.THREEMIN_ANALYTICS_WRITE_KEY),
    THREEMIN_ANALYTICS_READ_KEY:Boolean(process.env.THREEMIN_ANALYTICS_READ_KEY),
    STRIPE_WEBHOOK_SECRET:Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    PINOYLINK_ADMIN_TOKEN:Boolean(process.env.PINOYLINK_ADMIN_TOKEN)
  };

  const feature_status={
    subscriptions:env.THREEMIN_SUBSCRIBERS_WRITE_KEY&&env.THREEMIN_SUBSCRIBERS_READ_KEY,
    newsroom_review:env.THREEMIN_NEWSROOM_READ_KEY&&env.THREEMIN_NEWSROOM_WRITE_KEY,
    advertiser_intake:env.THREEMIN_ADVERTISERS_WRITE_KEY,
    advertiser_crm:env.THREEMIN_AD_PIPELINE_READ_KEY,
    booking_intake:env.THREEMIN_AD_BOOKINGS_WRITE_KEY,
    revenue_dashboard:env.THREEMIN_AD_PIPELINE_READ_KEY&&env.THREEMIN_AD_BOOKINGS_READ_KEY&&env.THREEMIN_PAYMENT_EVENTS_READ_KEY,
    campaign_admin:env.THREEMIN_AD_BOOKINGS_ADMIN_KEY,
    stripe_reconciliation:env.STRIPE_WEBHOOK_SECRET&&env.THREEMIN_PAYMENT_EVENTS_WRITE_KEY,
    directory_submission:env.THREEMIN_DIRECTORY_SUBMIT_WRITE_KEY,
    directory_review:env.THREEMIN_DIRECTORY_ADMIN_KEY,
    analytics:env.THREEMIN_ANALYTICS_WRITE_KEY&&env.THREEMIN_ANALYTICS_READ_KEY,
    admin_access:env.PINOYLINK_ADMIN_TOKEN
  };

  const public_ok=checks.every(c=>c.ok);
  const core_required=['THREEMIN_SUBSCRIBERS_WRITE_KEY','THREEMIN_SUBSCRIBERS_READ_KEY','THREEMIN_NEWSROOM_READ_KEY','THREEMIN_ADVERTISERS_WRITE_KEY','THREEMIN_AD_PIPELINE_READ_KEY','PINOYLINK_ADMIN_TOKEN'];
  const config_ok=core_required.every(k=>env[k]);
  const ready_features=Object.entries(feature_status).filter(([,v])=>v).map(([k])=>k);
  const blocked_features=Object.entries(feature_status).filter(([,v])=>!v).map(([k])=>k);

  return res.status(200).json({
    ok:public_ok&&config_ok,
    public_ok,
    config_ok,
    launch_ready:public_ok&&config_ok&&blocked_features.length===0,
    checked_at:new Date().toISOString(),
    checks,
    env,
    feature_status,
    ready_features,
    blocked_features
  });
}