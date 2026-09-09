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
  const style=document.createElement('style');
  style.textContent='.site-history-nav{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:120;display:flex;gap:7px;align-items:center;padding:8px;border:1px solid #ffffff24;border-radius:999px;background:#04101aee;backdrop-filter:blur(14px);box-shadow:0 14px 40px #0008;max-width:calc(100vw - 18px)}.site-history-nav button,.site-history-nav a{min-height:42px;border-radius:999px;border:1px solid #ffffff22;background:#0d2638;color:#f7fbff;padding:10px 13px;font:700 13px Manrope,sans-serif;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;white-space:nowrap}.site-history-nav a[href="/"]{background:#153247}.site-history-nav .site-invite{background:linear-gradient(135deg,#ffe398,#f5b936);color:#06131f;border:0}.site-history-nav button:focus-visible,.site-history-nav a:focus-visible{outline:3px solid #9ff3ff;outline-offset:2px}@media(max-width:520px){.site-history-nav{gap:5px;padding:6px}.site-history-nav button,.site-history-nav a{padding:9px 10px;font-size:12px}.site-history-nav button:last-child{display:none}}@media(min-width:900px){.site-history-nav{bottom:18px}}';
  document.head.appendChild(style);
})();
