import { isAdminRequest } from './_admin-session.js';

const ENDPOINT='https://api.3minapi.com/api/v1/data/asjcr1qjg0xuze3ng2q3q';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const readKey=process.env.THREEMIN_AD_PIPELINE_READ_KEY;
  if(!readKey)return res.status(503).json({error:'Admin pipeline is not configured yet.'});
  if(!isAdminRequest(req))return res.status(401).json({error:'Admin sign-in required.'});
  const cursor=String(req.query.cursor||'').trim();
  const url=new URL(ENDPOINT);
  url.searchParams.set('limit','30');
  if(cursor)url.searchParams.set('cursor',cursor);
  try{
    const upstream=await fetch(url,{headers:{authorization:`Bearer ${readKey}`}});
    const text=await upstream.text();
    if(!upstream.ok)return res.status(502).json({error:'Pipeline data could not be loaded.'});
    const data=JSON.parse(text);
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json(data);
  }catch(error){
    console.error('PinoyLink admin advertiser pipeline error',error);
    return res.status(502).json({error:'Pipeline service is temporarily unavailable.'});
  }
}
