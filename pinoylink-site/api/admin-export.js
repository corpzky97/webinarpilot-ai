import { isAdminRequest } from './_admin-session.js';
const DATASETS={
  subscribers:{url:'https://api.3minapi.com/api/v1/data/1ab2x5w26lthxsswkogmp',env:'THREEMIN_SUBSCRIBERS_READ_KEY'},
  newsroom:{url:'https://api.3minapi.com/api/v1/data/7bery6as68e75y5qez33a',env:'THREEMIN_NEWSROOM_READ_KEY'},
  advertisers:{url:'https://api.3minapi.com/api/v1/data/asjcr1qjg0xuze3ng2q3q',env:'THREEMIN_AD_PIPELINE_READ_KEY'},
  directory:{url:'https://api.3minapi.com/api/v1/data/cjamk6moj92tplgfs0uko',env:'THREEMIN_DIRECTORY_ADMIN_KEY'},
  analytics:{url:'https://api.3minapi.com/api/v1/data/z28zivht4w2c5eia587eq',env:'THREEMIN_ANALYTICS_READ_KEY'}
};
function rowsFrom(data){if(Array.isArray(data))return data;if(Array.isArray(data?.records))return data.records;if(Array.isArray(data?.data))return data.data;if(Array.isArray(data?.items))return data.items;return []}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!isAdminRequest(req))return res.status(401).json({error:'Unauthorized'});
  const name=String(req.query?.dataset||'').toLowerCase();const cfg=DATASETS[name];
  if(!cfg)return res.status(400).json({error:'Unknown dataset'});
  const key=process.env[cfg.env];if(!key)return res.status(503).json({error:`${cfg.env} is not configured.`});
  try{
    let all=[],cursor='';
    for(let i=0;i<100;i++){
      const url=new URL(cfg.url);url.searchParams.set('limit','30');if(cursor)url.searchParams.set('cursor',cursor);
      const r=await fetch(url,{headers:{authorization:`Bearer ${key}`},cache:'no-store'});if(!r.ok)throw new Error(`${name} ${r.status}`);
      const data=await r.json();all.push(...rowsFrom(data));cursor=data?.pagination?.next_cursor||data?.next_cursor||'';if(!cursor)break;
    }
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('content-disposition',`attachment; filename="pinoylink-${name}-${stamp}.json"`);
    return res.status(200).send(JSON.stringify({brand:'PinoyLink Hawaiʻi',dataset:name,exported_at:new Date().toISOString(),record_count:all.length,records:all},null,2));
  }catch(error){console.error('PinoyLink export error',name,error);return res.status(502).json({error:'Export is temporarily unavailable.'});}
}
