(()=>{
  if(location.pathname.startsWith('/admin')||location.pathname.startsWith('/api/'))return;
  const KEY='pinoylink_session_id';
  let sid='';
  try{sid=sessionStorage.getItem(KEY)||'';if(!sid){sid='PLS-'+Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem(KEY,sid)}}catch{sid='PLS-'+Date.now().toString(36)}
  const device=matchMedia('(max-width: 700px)').matches?'mobile':matchMedia('(max-width: 1100px)').matches?'tablet':'desktop';
  const slug=location.pathname.startsWith('/news/')?decodeURIComponent(location.pathname.split('/')[2]||''):'';
  const ref=(()=>{try{return document.referrer?new URL(document.referrer).hostname:''}catch{return''}})();
  function send(event_type,extra={}){
    const payload={event_id:'PLAE-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),event_type,page_path:location.pathname+location.search,page_title:document.title,story_slug:slug,desk:document.getElementById('article-desk')?.textContent||'',cta:'',referrer_host:ref,device_type:device,session_id:sid,...extra};
    try{fetch('/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{})}catch{}
  }
  send(slug?'story_view':'page_view');
  document.addEventListener('click',e=>{const a=e.target.closest('a,button');if(!a)return;const text=(a.textContent||'').trim().replace(/\s+/g,' ').slice(0,120);if(!text)return;send('cta_click',{cta:text})},{passive:true});
  document.addEventListener('submit',e=>{const id=e.target?.id||e.target?.getAttribute?.('name')||'form';send('form_submit',{cta:String(id).slice(0,120)})},true);
  window.PinoyLinkAnalytics={track:(type,data)=>send(type,data||{})};
})();
