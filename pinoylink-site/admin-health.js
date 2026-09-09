const $=id=>document.getElementById(id);
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','\"':'&quot;'}[c]))}
function saveToken(v){sessionStorage.setItem('pinoylink_admin_token',v)}
function loadToken(){return sessionStorage.getItem('pinoylink_admin_token')||''}
function pretty(k){return String(k||'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
async function run(){
  const token=$('token').value.trim();const status=$('gateStatus');status.textContent='';
  if(!token){status.textContent='Enter your admin token.';return}
  const btn=$('loadHealth');btn.disabled=true;btn.textContent='Checking…';
  try{
    const r=await fetch('/api/admin-health',{headers:{'x-admin-token':token},cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(r.status===401){sessionStorage.removeItem('pinoylink_admin_token');throw new Error('Invalid admin token.')}
    if(!r.ok)throw new Error(data.error||'Health check failed.');
    saveToken(token);$('gate').hidden=true;$('health').hidden=false;
    $('overall').textContent=data.launch_ready?'Launch ready':data.ok?'Core healthy • setup remains':'Attention required';
    $('overallNote').textContent=data.launch_ready?'All checked public routes and configured feature dependencies are ready.':data.ok?'Core systems are healthy, but one or more optional production features still need configuration.':'One or more core routes or required production settings need attention.';
    $('checkedAt').textContent=data.checked_at?new Date(data.checked_at).toLocaleString():'';
    $('cards').innerHTML=(data.checks||[]).map(c=>`<article class="health-card ${c.ok?'ok':'bad'}"><h3><span class="status-dot"></span>${esc(c.name)}</h3><div class="tiny muted">${esc(c.url)}</div><div class="kv"><div>Status</div><div>${c.ok?'OK':'FAIL'} ${esc(c.status||'')}</div><div>Latency</div><div>${esc(c.latency_ms)} ms</div>${c.error?`<div>Error</div><div>${esc(c.error)}</div>`:''}</div></article>`).join('');
    $('env').innerHTML=Object.entries(data.env||{}).map(([k,v])=>`<div class="env-item">${esc(k)}<b class="${v?'yes':'no'}">${v?'SET':'MISSING'}</b></div>`).join('');
    $('features').innerHTML=Object.entries(data.feature_status||{}).map(([k,v])=>`<div class="env-item">${esc(pretty(k))}<b class="${v?'yes':'no'}">${v?'READY':'BLOCKED'}</b></div>`).join('');
    const blocked=data.blocked_features||[];
    $('blockedSummary').textContent=blocked.length?`Setup remaining: ${blocked.map(pretty).join(', ')}.`:'No feature blockers detected.';
  }catch(err){status.textContent=err.message||'Health check failed.'}
  finally{btn.disabled=false;btn.textContent='Run health check'}
}
$('loadHealth').addEventListener('click',run);$('token').value=loadToken();if($('token').value)run();