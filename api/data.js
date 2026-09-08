const json=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};

async function redis(command){
  const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url||!token) throw new Error('DATABASE_NOT_CONFIGURED');
  const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command)});
  if(!r.ok) throw new Error(`REDIS_${r.status}`);
  const data=await r.json();
  if(data.error) throw new Error(data.error);
  return data.result;
}

function safeLead(body={}){
  const text=v=>String(v??'').trim().slice(0,500);
  const intent=['Learn more','Book a demo','Buy now'].includes(body.intent)?body.intent:'Learn more';
  return {
    id:crypto.randomUUID(),
    name:text(body.name).slice(0,120),
    email:text(body.email).slice(0,180),
    phone:text(body.phone).slice(0,80),
    intent,
    source:text(body.source||'Webinar Room').slice(0,120),
    createdAt:new Date().toISOString()
  };
}

function safeEvent(body={}){
  const type=String(body.type??'').trim().slice(0,80);
  const meta=body.meta&&typeof body.meta==='object'?body.meta:{};
  return {id:crypto.randomUUID(),type,meta,at:new Date().toISOString()};
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method==='GET'){
      const type=req.query?.type||'all';
      if(type==='leads'){
        const rows=await redis(['LRANGE','webinarpilot:leads','0','499']);
        return json(res,200,{ok:true,mode:'shared',leads:(rows||[]).map(x=>JSON.parse(x))});
      }
      if(type==='events'){
        const rows=await redis(['LRANGE','webinarpilot:events','0','999']);
        return json(res,200,{ok:true,mode:'shared',events:(rows||[]).map(x=>JSON.parse(x))});
      }
      const [leads,events]=await Promise.all([
        redis(['LRANGE','webinarpilot:leads','0','499']),
        redis(['LRANGE','webinarpilot:events','0','999'])
      ]);
      return json(res,200,{ok:true,mode:'shared',leads:(leads||[]).map(x=>JSON.parse(x)),events:(events||[]).map(x=>JSON.parse(x))});
    }

    if(req.method==='POST'){
      const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      if(body.action==='lead'){
        const lead=safeLead(body.lead);
        if(!lead.name||!lead.email) return json(res,400,{ok:false,error:'Name and email are required.'});
        await redis(['LPUSH','webinarpilot:leads',JSON.stringify(lead)]);
        await redis(['LTRIM','webinarpilot:leads','0','499']);
        return json(res,200,{ok:true,mode:'shared',lead});
      }
      if(body.action==='event'){
        const event=safeEvent(body.event);
        if(!event.type) return json(res,400,{ok:false,error:'Event type is required.'});
        await redis(['LPUSH','webinarpilot:events',JSON.stringify(event)]);
        await redis(['LTRIM','webinarpilot:events','0','999']);
        return json(res,200,{ok:true,mode:'shared',event});
      }
      return json(res,400,{ok:false,error:'Unsupported action.'});
    }

    res.setHeader('Allow','GET, POST');
    return json(res,405,{ok:false,error:'Method not allowed.'});
  }catch(err){
    const unconfigured=err?.message==='DATABASE_NOT_CONFIGURED';
    return json(res,unconfigured?503:500,{ok:false,mode:unconfigured?'local-fallback':'error',error:unconfigured?'Shared database is not configured yet.':'Shared data service error.'});
  }
}
