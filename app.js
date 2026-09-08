window.WebinarPilot={
  getLeads(){try{return JSON.parse(localStorage.getItem('webinarpilot:leads')||'[]')}catch{return[]}},
  saveLead(lead){const leads=this.getLeads();leads.unshift({...lead,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),createdAt:new Date().toISOString()});localStorage.setItem('webinarpilot:leads',JSON.stringify(leads));this.track('registration');return leads[0]},
  getEvents(){try{return JSON.parse(localStorage.getItem('webinarpilot:events')||'[]')}catch{return[]}},
  track(type,meta={}){const events=this.getEvents();events.push({type,meta,at:new Date().toISOString()});localStorage.setItem('webinarpilot:events',JSON.stringify(events));},
  score(lead){let s=40;if(lead.intent==='Book a demo')s+=30;if(lead.intent==='Buy now')s+=40;if(lead.intent==='Learn more')s+=15;if(lead.phone)s+=5;return Math.min(100,s)},
  esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
};
