import { clearCookie, SESSION_COOKIE, PENDING_COOKIE } from './_admin-session.js';
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Set-Cookie',[
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    `${PENDING_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  ]);
  return res.status(200).json({ok:true});
}
