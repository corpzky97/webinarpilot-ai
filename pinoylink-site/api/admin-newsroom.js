const ENDPOINT='https://api.3minapi.com/api/v1/data/7bery6as68e75y5qez33a';

function authorized(req){
  const adminToken=process.env.PINOYLINK_ADMIN_TOKEN;
  const auth=String(req.headers.authorization||'');
  return Boolean(adminToken&&auth===`Bearer ${adminToken}`);
}
function parse(text){try{return JSON.parse(text)}catch{return {}}}
function payloadOf(data){return data?.payload||data?.data?.payload||data?.data||data||{}}
function n(v,fallback=0){const x=Number(v);return Number.isFinite(x)?Math.max(0,Math.min(100,x)):fallback}
function editorialQuality(item){
  const flags=[];
  const confidence=n(item.confidence_score),freshness=n(item.freshness_score),relevance=n(item.relevance_score);
  const completeness=[item.headline,item.summary,item.source_name,item.source_url,item.why_it_matters].filter(v=>String(v||'').trim()).length/5*100;
  if(!String(item.source_url||'').trim())flags.push('missing_source');
  if(confidence<70)flags.push('low_confidence');
  if(freshness<60)flags.push('stale');
  if(relevance<60)flags.push('low_relevance');
  if(String(item.duplicate_of||'').trim())flags.push('duplicate');
  if(String(item.correction_of||'').trim())flags.push('correction');
  if(['orange','red','black'].includes(String(item.sensitivity||'').toLowerCase()))flags.push('sensitive');
  let score=confidence*.35+freshness*.25+relevance*.25+completeness*.15;
  if(flags.includes('missing_source'))score-=25;
  if(flags.includes('duplicate'))score-=35;
  if(flags.includes('sensitive'))score-=5;
  return {score:Math.max(0,Math.min(100,Math.round(score))),flags:[...new Set(flags)]};
}
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
    const referenceId=String(req.body?.reference_id||'').trim().slice(0,200);
    const allowed=new Set(['approve','hold','needs_correction','reject','publish_ready','mark_duplicate','clear_duplicate','mark_correction','clear_correction','recalc_quality']);
    if(!recordId||!allowed.has(action))return res.status(400).json({error:'Invalid newsroom action.'});
    if(['mark_duplicate','mark_correction'].includes(action)&&!referenceId)return res.status(400).json({error:'A reference story ID is required.'});
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
      }else if(action==='mark_duplicate'){
        next.duplicate_of=referenceId;
        next.review_status='needs_review';
        next.status='draft';
      }else if(action==='clear_duplicate'){
        next.duplicate_of='';
      }else if(action==='mark_correction'){
        next.correction_of=referenceId;
        next.correction_note=note||'Material correction/update linked by editor.';
        next.review_status='manual_approval';
        if(!next.status||next.status==='draft')next.status='queued';
      }else if(action==='clear_correction'){
        next.correction_of='';
        next.correction_note='';
      }
      const q=editorialQuality(next);
      next.quality_score=q.score;
      next.quality_flags=q.flags;
      if(action==='publish_ready'){
        if(String(next.duplicate_of||'').trim())return res.status(409).json({error:'Duplicate stories cannot be marked publish-ready. Clear the duplicate link or publish the original story.'});
        if(!String(next.source_url||'').trim())return res.status(409).json({error:'A verified source URL is required before publish-ready.'});
        if(q.score<65)return res.status(409).json({error:`Editorial quality score ${q.score}/100 is below the 65 publish-ready threshold.`});
        next.review_status='approved';
        next.status='approved';
      }
      if(note&&!['mark_correction'].includes(action)){
        const stamp=new Date().toISOString();
        const existing=String(next.why_it_matters||'').trim();
        next.why_it_matters=(existing?existing+'\n\n':'')+`Editorial note (${stamp}): ${note}`;
      }
      await upstream(`${ENDPOINT}/${encodeURIComponent(recordId)}`,writeKey,{method:'PUT',body:JSON.stringify(next)});
      return res.status(200).json({ok:true,record_id:recordId,action,review_status:next.review_status,status:next.status,quality_score:next.quality_score,quality_flags:next.quality_flags,duplicate_of:next.duplicate_of||'',correction_of:next.correction_of||''});
    }catch(error){
      console.error('PinoyLink admin newsroom PUT error',error);
      return res.status(error?.status===409?409:502).json({error:'Newsroom update could not be saved.'});
    }
  }
  return res.status(405).json({error:'Method not allowed'});
}
