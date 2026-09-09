const LOST_FOUND='https://api.3minapi.com/api/v1/data/szaxixwya7fckx6dpu48x';
const MEMORIALS='https://api.3minapi.com/api/v1/data/pu1500ylpx74kqrjq6af9';

function auth(req){const expected=process.env.PINOYLINK_ADMIN_TOKEN||'';const got=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');return !!expected&&got===expected}
function cfg(type){if(type==='lost_found')return {url:LOST_FOUND,key:process.env.THREEMIN_LOST_FOUND_ADMIN_KEY};if(type==='memorial')return {url:MEMORIALS,key:process.env.THREEMIN_MEMORIALS_ADMIN_KEY};return null}
async function json(r){return r.json().catch(()=>({}))}
async function getRecord(c,id){const r=await fetch(`${c.url}/${encodeURIComponent(id)}`,{headers:{authorization:`Bearer ${c.key}`},cache:'no-store'});return {r,data:await json(r)}}
function now(){return new Date().toISOString()}
function mutate(type,row,action,reason=''){
  const t=now();
  if(type==='lost_found'){
    if(action==='approve'){row.review_status='approved';row.public_status='active';row.status='active';row.published_at=row.published_at||t;row.archived_at='';row.archive_reason=''}
    if(action==='needs_changes'){row.review_status='needs_changes';row.public_status='pending'}
    if(action==='reject'){row.review_status='rejected';row.public_status='archived';row.status='archived';row.archived_at=t;row.archive_reason=reason||'rejected'}
    if(action==='matched'){row.review_status='matched';row.public_status='matched';row.resolved_at=t}
    if(action==='returned'||action==='archive'){row.review_status='closed';row.public_status='archived';row.status='archived';row.resolved_at=row.resolved_at||t;row.archived_at=t;row.archive_reason=reason||(action==='returned'?'returned':'other')}
  }else{
    if(action==='verify'){row.review_status='verified';row.public_status='draft';row.status='active'}
    if(action==='publish'){row.review_status='published';row.public_status='active';row.status='active';row.published_at=row.published_at||t;row.archived_at='';row.archive_reason=''}
    if(action==='needs_changes'){row.review_status='needs_changes';row.public_status='draft'}
    if(action==='reject'){row.review_status='rejected';row.public_status='archived';row.status='archived';row.archived_at=t;row.archive_reason=reason||'other'}
    if(action==='archive'){row.review_status='archived';row.public_status='archived';row.status='archived';row.archived_at=t;row.archive_reason=reason||'service_complete'}
  }
  return row
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(!auth(req))return res.status(401).json({error:'Unauthorized'});
  const type=String(req.query?.type||req.body?.type||'');const c=cfg(type);
  if(!c)return res.status(400).json({error:'Invalid community type'});
  if(!c.key)return res.status(503).json({error:'Community moderation key is not configured.'});
  if(req.method==='GET'){
    const cursor=String(req.query?.cursor||'');const u=new URL(c.url);u.searchParams.set('limit','30');if(cursor)u.searchParams.set('cursor',cursor);
    const r=await fetch(u,{headers:{authorization:`Bearer ${c.key}`},cache:'no-store'});const data=await json(r);return res.status(r.ok?200:502).json(data)
  }
  if(req.method==='PUT'){
    const id=String(req.body?.record_id||'');const action=String(req.body?.action||'');const reason=String(req.body?.reason||'').slice(0,80);if(!id||!action)return res.status(400).json({error:'record_id and action are required'});
    const allowed=type==='lost_found'?new Set(['approve','needs_changes','reject','matched','returned','archive']):new Set(['verify','publish','needs_changes','reject','archive']);if(!allowed.has(action))return res.status(400).json({error:'Unsupported action'});
    const current=await getRecord(c,id);if(!current.r.ok)return res.status(502).json({error:'Unable to load record'});
    const row=current.data?.data||current.data?.payload||current.data;mutate(type,row,action,reason);
    const r=await fetch(`${c.url}/${encodeURIComponent(id)}`,{method:'PUT',headers:{'content-type':'application/json',authorization:`Bearer ${c.key}`},body:JSON.stringify(row)});const data=await json(r);return res.status(r.ok?200:502).json({ok:r.ok,action,data})
  }
  if(req.method==='DELETE'){
    const id=String(req.body?.record_id||'');const confirmation=String(req.body?.confirmation||'');if(!id||confirmation!=='DELETE PERMANENTLY')return res.status(400).json({error:'Explicit permanent-delete confirmation required'});
    const r=await fetch(`${c.url}/${encodeURIComponent(id)}`,{method:'DELETE',headers:{authorization:`Bearer ${c.key}`}});const data=await json(r);return res.status(r.ok?200:502).json({ok:r.ok,data})
  }
  return res.status(405).json({error:'Method not allowed'});
}
