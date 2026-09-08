window.WebinarPilot={
  getLeads(){try{return JSON.parse(localStorage.getItem('webinarpilot:leads')||'[]')}catch{return[]}},
  setLeads(leads){localStorage.setItem('webinarpilot:leads',JSON.stringify(leads||[]));},
  getEvents(){try{return JSON.parse(localStorage.getItem('webinarpilot:events')||'[]')}catch{return[]}},
  setEvents(events){localStorage.setItem('webinarpilot:events',JSON.stringify(events||[]));},
  async remote(type='all'){
    try{
      const r=await fetch('/api/data?type='+encodeURIComponent(type),{headers:{Accept:'application/json'}});
      if(!r.ok) throw new Error('remote unavailable');
      const data=await r.json();
      if(data.leads)this.setLeads(data.leads);
      if(data.events)this.setEvents(data.events);
      return data;
    }catch{return null}
  },
  async loadLeads(){const data=await this.remote('leads');return data?.leads||this.getLeads()},
  async loadEvents(){const data=await this.remote('events');return data?.events||this.getEvents()},
  async saveLead(lead){
    const local={...lead,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),createdAt:new Date().toISOString()};
    const leads=this.getLeads();leads.unshift(local);this.setLeads(leads);
    let saved=local;
    try{
      const r=await fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lead',lead})});
      if(r.ok){const data=await r.json();if(data.lead){saved=data.lead;this.setLeads([saved,...leads.filter(x=>x.id!==local.id)])}}
    }catch{}
    this.track('registration',{leadId:saved.id});
    return saved;
  },
  async track(type,meta={}){
    const event={type,meta,at:new Date().toISOString(),id:crypto.randomUUID?crypto.randomUUID():String(Date.now())};
    const events=this.getEvents();events.unshift(event);this.setEvents(events.slice(0,1000));
    try{await fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'event',event:{type,meta}})})}catch{}
    return event;
  },
  score(lead){let s=40;if(lead.intent==='Book a demo')s+=30;if(lead.intent==='Buy now')s+=40;if(lead.intent==='Learn more')s+=15;if(lead.phone)s+=5;return Math.min(100,s)},
  esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
};
