(()=>{
  if(document.querySelector('.site-history-nav'))return;
  const q=new URLSearchParams(location.search);
  const source=(q.get('utm_source')||q.get('source')||'site_nav').replace(/[^a-zA-Z0-9._-]/g,'').slice(0,50)||'site_nav';
  const invite=`/join?utm_source=${encodeURIComponent(source)}&utm_medium=site_nav&utm_campaign=pinoylink_referral`;
  const wrap=document.createElement('nav');
  wrap.className='site-history-nav';
  wrap.setAttribute('aria-label','Page navigation');
  wrap.innerHTML=`<button type="button" data-site-back aria-label="Go back">← Back</button><a href="/" aria-label="Go to PinoyLink home">Home</a><a class="site-invite" href="${invite}" aria-label="Join or invite someone to PinoyLink">Join / Invite</a><button type="button" data-site-forward aria-label="Go forward">Forward →</button>`;
  document.body.appendChild(wrap);
  const back=wrap.querySelector('[data-site-back]');
  const forward=wrap.querySelector('[data-site-forward]');
  back.addEventListener('click',()=>{if(history.length>1)history.back();else location.href='/';});
  forward.addEventListener('click',()=>history.forward());

  const shareUrl=()=>`${location.origin}/join?ref=reader-share&utm_source=subscriber_share&utm_medium=referral&utm_campaign=pinoylink_reader_referral`;
  const shareText='Join me on PinoyLink Hawaiʻi for useful Hawaiʻi, Philippines, traffic, community, jobs and family updates.';
  async function shareInvite(){
    const url=shareUrl();
    if(navigator.share){
      try{await navigator.share({title:'PinoyLink Hawaiʻi',text:shareText,url});return 'shared'}catch(e){if(e&&e.name==='AbortError')return 'cancelled'}
    }
    try{await navigator.clipboard.writeText(url);return 'copied'}catch{location.href=url;return 'opened'}
  }
  function addPostSignupInvite(){
    const status=document.getElementById('subscribeStatus');
    if(!status||status.dataset.inviteReady==='1')return;
    const text=(status.textContent||'').toLowerCase();
    if(!text.includes('subscribed')&&!text.includes('welcome'))return;
    status.dataset.inviteReady='1';
    const box=document.createElement('div');
    box.className='post-signup-invite';
    box.innerHTML='<strong>Help another Filipino family stay connected.</strong><span>Invite family, church friends, coworkers or community members to PinoyLink.</span><div><button type="button" data-share-invite>Share invite</button><button type="button" data-copy-invite>Copy invite link</button><a href="/join?ref=reader-share&utm_source=subscriber_share&utm_medium=referral&utm_campaign=pinoylink_reader_referral">Open invite page</a></div><small data-invite-result aria-live="polite"></small>';
    status.insertAdjacentElement('afterend',box);
    const result=box.querySelector('[data-invite-result]');
    box.querySelector('[data-share-invite]').addEventListener('click',async()=>{const r=await shareInvite();result.textContent=r==='shared'?'Invite shared. Thank you!':r==='copied'?'Invite link copied.':'Invite ready.';window.PinoyLinkAnalytics?.track?.('referral_share',{cta:'post_signup_share',campaign_id:'reader-share',placement:'subscriber_success'});});
    box.querySelector('[data-copy-invite]').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(shareUrl());result.textContent='Invite link copied.'}catch{result.textContent='Open the invite page to share.'}window.PinoyLinkAnalytics?.track?.('referral_copy',{cta:'post_signup_copy',campaign_id:'reader-share',placement:'subscriber_success'});});
  }
  const status=document.getElementById('subscribeStatus');
  if(status){new MutationObserver(addPostSignupInvite).observe(status,{childList:true,subtree:true,characterData:true});addPostSignupInvite()}

  const style=document.createElement('style');
  style.textContent='.site-history-nav{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:120;display:flex;gap:7px;align-items:center;padding:8px;border:1px solid #ffffff24;border-radius:999px;background:#04101aee;backdrop-filter:blur(14px);box-shadow:0 14px 40px #0008;max-width:calc(100vw - 18px)}.site-history-nav button,.site-history-nav a{min-height:42px;border-radius:999px;border:1px solid #ffffff22;background:#0d2638;color:#f7fbff;padding:10px 13px;font:700 13px Manrope,sans-serif;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;white-space:nowrap}.site-history-nav a[href="/"]{background:#153247}.site-history-nav .site-invite{background:linear-gradient(135deg,#ffe398,#f5b936);color:#06131f;border:0}.site-history-nav button:focus-visible,.site-history-nav a:focus-visible{outline:3px solid #9ff3ff;outline-offset:2px}.post-signup-invite{margin:14px 0 4px;padding:16px;border:1px solid #f5c85a66;border-radius:16px;background:linear-gradient(135deg,#f5c85a12,#54d8e718);display:grid;gap:8px}.post-signup-invite strong{color:#ffe398;font-size:1rem}.post-signup-invite span{color:#d7e8ee}.post-signup-invite>div{display:flex;gap:8px;flex-wrap:wrap}.post-signup-invite button,.post-signup-invite a{min-height:42px;border-radius:999px;border:1px solid #ffffff20;padding:9px 13px;font:800 13px Manrope,sans-serif;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.post-signup-invite button:first-child{background:linear-gradient(135deg,#ffe398,#f5b936);color:#06131f;border:0}.post-signup-invite button:nth-child(2),.post-signup-invite a{background:#123247;color:#f4fbff}.post-signup-invite small{color:#9ed8df}@media(max-width:520px){.site-history-nav{gap:5px;padding:6px}.site-history-nav button,.site-history-nav a{padding:9px 10px;font-size:12px}.site-history-nav button:last-child{display:none}.post-signup-invite>div>*{flex:1 1 130px}}@media(min-width:900px){.site-history-nav{bottom:18px}}';
  document.head.appendChild(style);
})();
