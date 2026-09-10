import { sessionFromRequest } from './_admin-session.js';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const session=sessionFromRequest(req);
  if(!session)return res.status(401).json({authenticated:false});
  return res.status(200).json({authenticated:true,email:session.email,expires_at:new Date(session.exp).toISOString()});
}
