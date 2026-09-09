const ENDPOINT='https://api.3minapi.com/api/v1/data/7bery6as68e75y5qez33a';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const adminToken=process.env.PINOYLINK_ADMIN_TOKEN;
  const readKey=process.env.THREEMIN_NEWSROOM_READ_KEY;
  if(!adminToken||!readKey)return res.status(503).json({error:'Newsroom admin is not configured yet.'});
  const auth=String(req.headers.authorization||'');
  if(auth!==`Bearer ${adminToken}`)return res.status(401).json({error:'Invalid admin token.'});
  const cursor=String(req.query.cursor||'').trim();
  const url=new URL(ENDPOINT);
  url.searchParams.set('limit','30');
  if(cursor)url.searchParams.set('cursor',cursor);
  try{
    const upstream=await fetch(url,{headers:{authorization:`Bearer ${readKey}`}});
    const text=await upstream.text();
    if(!upstream.ok)return res.status(502).json({error:'Newsroom data could not be loaded.'});
    const data=JSON.parse(text);
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json(data);
  }catch(error){
    console.error('PinoyLink admin newsroom error',error);
    return res.status(502).json({error:'Newsroom service is temporarily unavailable.'});
  }
}
