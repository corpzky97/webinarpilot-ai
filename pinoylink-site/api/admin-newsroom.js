const ENDPOINT='https://api.3minapi.com/api/v1/data/7bery6as68e75y5qez33a';

function authorized(req){
  const adminToken=process.env.PINOYLINK_ADMIN_TOKEN;
  const auth=String(req.headers.authorization||'');
  return Boolean(adminToken&&auth===`Bearer ${adminToken}`);
}
function parse(text){try{return JSON.parse(text)}catch{return {}}}
function payloadOf(data){return data?.payload||data?.data?.payload||data?.data||data||{}}
async function upstream(url,key,options={}){
  const r=await fetch(url,{...options,headers:{authorization:`Bearer ${key}`,'content-type':'application/json',...(options.headers||{})}});
  const text=await r.text();
  const data=parse(text);
  if(!r.ok)throw Object.assign(new Error(`newsroom upstream ${r.status}`),{status:r.status,data});
  return data;
}

export default async function handler(req,res){
  if(!authorized(req))return res.status(401).json({error:'Invalid admin token.'});
  const readKey=process.env.THREEMIN_NEWSROOM_READ_KEY;
  if(req.method==='GET'){
    if(!readKey)return res.status(503).json({error:'Newsroom admin is not configured yet.'});
    const cursor=String(req.query.cursor||'').trim();
    const url=new URL(ENDPOINT);
    url.searchParams.set('limit','30');
    if(cursor)url.searchParams.set('cursor',cursor);
    try{
      const data=await upstream(url,readKey,{method:'GET'});
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json(data);
    }catch(error){
      console.error('PinoyLink admin newsroom GET error',error);
      return res.status(502).json({error:'Newsroom data could not be loaded.'});
    }
  }
  if(req.method==='PUT'){
    const writeKey=process.env.THREEMIN_NEWSROOM_WRITE_KEY;
    if(!writeKey)return res.status(503).json({error:'Newsroom write access is not configured yet.'});
    const recordId=String(req.body?.record_id||'').trim();
    const action=String(req.body?.action||'').trim();
    const note=String(req.body?.note||'').trim().slice(0,1000);
    const allowed=new Set(['approve','hold','needs_correction','reject','publish_ready']);
    if(!recordId||!allowed.has(action))return res.status(400).json({error:'Invalid newsroom action.'});
    try{
      const currentRaw=await upstream(`${ENDPOINT}/${encodeURIComponent(recordId)}`,writeKey,{method:'GET'});
      const current=payloadOf(currentRaw);
      const next={...current};
      if(action==='approve'){
        next.review_status='approved';
        if(next.status==='draft'||!next.status)next.status='queued';
      }else if(action==='hold'){
        next.review_status='manual_approval';
        next.status='queued';
      }else if(action==='needs_correction'){
        next.review_status='needs_review';
        next.status='draft';
      }else if(action==='reject'){
        next.review_status='rejected';
        next.status='archived';
      }else if(action==='publish_ready'){
        next.review_status='approved';
        next.status='approved';
      }
      if(note){
        const stamp=new Date().toISOString();
        const existing=String(next.why_it_matters||'').trim();
        next.why_it_matters=(existing?existing+'\n\n':'')+`Editorial note (${stamp}): ${note}`;
      }
      await upstream(`${ENDPOINT}/${encodeURIComponent(recordId)}`,writeKey,{method:'PUT',body:JSON.stringify(next)});
      return res.status(200).json({ok:true,record_id:recordId,action,review_status:next.review_status,status:next.status});
    }catch(error){
      console.error('PinoyLink admin newsroom PUT error',error);
      return res.status(502).json({error:'Newsroom update could not be saved.'});
    }
  }
  return res.status(405).json({error:'Method not allowed'});
}
