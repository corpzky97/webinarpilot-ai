import { randomInt } from 'node:crypto';
import { isAllowedEmail, makeSignedPayload, setCookie, PENDING_COOKIE } from './_admin-session.js';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const email=String(req.body?.email||'').trim().toLowerCase();
  const generic={ok:true,message:'If this email is authorized, a sign-in code has been sent.'};
  if(!email||!isAllowedEmail(email))return res.status(200).json(generic);
  if(!process.env.RESEND_API_KEY)return res.status(503).json({error:'Admin email delivery is not configured.'});
  if(!process.env.PINOYLINK_ADMIN_SESSION_SECRET)return res.status(503).json({error:'Admin session security is not configured.'});
  const code=String(randomInt(100000,1000000));
  const exp=Date.now()+10*60*1000;
  const pending=makeSignedPayload({email,code_hash:makeSignedPayload({email,code,exp}),exp});
  setCookie(res,PENDING_COOKIE,pending,600);
  try{
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${process.env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from:process.env.PINOYLINK_ADMIN_FROM||'PinoyLink Hawaiʻi <news@revivalinkministry.org>',to:[email],subject:'Your PinoyLink Admin sign-in code',html:`<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>PinoyLink Hawaiʻi Admin</h2><p>Your one-time sign-in code is:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px;padding:18px 0">${code}</div><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p></div>`})});
    if(!r.ok)throw new Error(`Resend ${r.status}`);
    return res.status(200).json(generic);
  }catch(e){console.error('admin auth email failed',e);return res.status(502).json({error:'Unable to send admin sign-in code right now.'});}
}
