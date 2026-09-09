(()=>{
  if(document.querySelector('.site-history-nav'))return;
  const wrap=document.createElement('nav');
  wrap.className='site-history-nav';
  wrap.setAttribute('aria-label','Page navigation');
  wrap.innerHTML='<button type="button" data-site-back aria-label="Go back">← Back</button><a href="/" aria-label="Go to PinoyLink home">Home</a><button type="button" data-site-forward aria-label="Go forward">Forward →</button>';
  document.body.appendChild(wrap);
  const back=wrap.querySelector('[data-site-back]');
  const forward=wrap.querySelector('[data-site-forward]');
  back.addEventListener('click',()=>{if(history.length>1)history.back();else location.href='/';});
  forward.addEventListener('click',()=>history.forward());
  const style=document.createElement('style');
  style.textContent='.site-history-nav{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:120;display:flex;gap:8px;align-items:center;padding:8px;border:1px solid #ffffff24;border-radius:999px;background:#04101aee;backdrop-filter:blur(14px);box-shadow:0 14px 40px #0008}.site-history-nav button,.site-history-nav a{min-height:42px;border-radius:999px;border:1px solid #ffffff22;background:#0d2638;color:#f7fbff;padding:10px 14px;font:700 14px Manrope,sans-serif;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.site-history-nav a{background:linear-gradient(135deg,#ffe398,#f5b936);color:#06131f;border:0}.site-history-nav button:focus-visible,.site-history-nav a:focus-visible{outline:3px solid #9ff3ff;outline-offset:2px}@media(min-width:900px){.site-history-nav{bottom:18px}}';
  document.head.appendChild(style);
})();
