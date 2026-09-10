import { parseCookies, readSignedPayload, makeSignedPayload, setCookie, clearCookie, PENDING_COOKIE, SESSION_COOKIE, isAllowedEmail } from './_admin-session.js';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const code=String(req.body?.code||'').trim();
  const cookies=parseCookies(req);const pending=readSignedPayload(cookies[PENDING_COOKIE]);
  if(!pending||!pending.email||!pending.exp||Date.now()>pending.exp||!isAllowedEmail(pending.email)){clearCookie(res,PENDING_COOKIE);return res.status(401).json({error:'Code expired. Request a new sign-in code.'});}
  const proof=readSignedPayload(pending.code_hash);
  if(!proof||proof.email!==pending.email||proof.exp!==pending.exp||proof.code!==code)return res.status(401).json({error:'Invalid sign-in code.'});
  const session=makeSignedPayload({email:pending.email,exp:Date.now()+7*24*60*60*1000});
  res.setHeader('Set-Cookie',[
    `${SESSION_COOKIE}=${encodeURIComponent(session)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`,
    `${PENDING_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  ]);
  return res.status(200).json({ok:true,email:pending.email});
}
