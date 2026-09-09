(()=>{
  if(location.pathname.startsWith('/admin')||location.pathname.startsWith('/api/'))return;
  const KEY='pinoylink_session_id';
  let sid='';
  try{sid=sessionStorage.getItem(KEY)||'';if(!sid){sid='PLS-'+Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem(KEY,sid)}}catch{sid='PLS-'+Date.now().toString(36)}
  const device=matchMedia('(max-width: 700px)').matches?'mobile':matchMedia('(max-width: 1100px)').matches?'tablet':'desktop';
  const slug=location.pathname.startsWith('/news/')?decodeURIComponent(location.pathname.split('/')[2]||''):'';
  const ref=(()=>{try{return document.referrer?new URL(document.referrer).hostname:''}catch{return''}})();
  const params=new URLSearchParams(location.search);
  const pageCampaign=(params.get('campaign')||params.get('campaign_id')||params.get('utm_campaign')||'').slice(0,120);
  const pagePlacement=(params.get('placement')||params.get('utm_content')||'').slice(0,120);
  const pageAdvertiser=(params.get('advertiser')||'').slice(0,160);
  function send(event_type,extra={}){
    const payload={event_id:'PLAE-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),event_type,page_path:location.pathname+location.search,page_title:document.title,story_slug:slug,desk:document.getElementById('article-desk')?.textContent||'',cta:'',referrer_host:ref,device_type:device,session_id:sid,campaign_id:pageCampaign,placement:pagePlacement,advertiser:pageAdvertiser,outbound_url:'',...extra};
    try{fetch('/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{})}catch{}
  }
  send(slug?'story_view':'page_view');
  document.addEventListener('click',e=>{const a=e.target.closest('a,button');if(!a)return;const text=(a.textContent||'').trim().replace(/\s+/g,' ').slice(0,120);if(!text)return;const campaign=(a.dataset?.campaignId||pageCampaign||'').slice(0,120);const placement=(a.dataset?.placement||pagePlacement||'').slice(0,120);const advertiser=(a.dataset?.advertiser||pageAdvertiser||'').slice(0,160);const outbound=a.tagName==='A'?(a.href||'').slice(0,500):'';send('cta_click',{cta:text,campaign_id:campaign,placement,advertiser,outbound_url:outbound})},{passive:true});
  document.addEventListener('submit',e=>{const id=e.target?.id||e.target?.getAttribute?.('name')||'form';send('form_submit',{cta:String(id).slice(0,120)})},true);
  window.PinoyLinkAnalytics={track:(type,data)=>send(type,data||{})};
})();
