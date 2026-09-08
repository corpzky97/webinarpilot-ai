const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{ok:false,error:'Method not allowed'});}
  try{
    const sid=process.env.TWILIO_ACCOUNT_SID;
    const token=process.env.TWILIO_AUTH_TOKEN;
    const from=process.env.TWILIO_FROM_NUMBER;
    if(!sid||!token||!from)return send(res,503,{ok:false,error:'Twilio SMS is not configured.'});
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const to=String(body.to||'').trim().slice(0,40);
    const message=String(body.message||'').trim().slice(0,1500);
    if(!to||!message)return send(res,400,{ok:false,error:'Phone number and message are required.'});
    const form=new URLSearchParams({To:to,From:from,Body:message});
    const auth=Buffer.from(`${sid}:${token}`).toString('base64');
    const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
    const data=await r.json();
    if(!r.ok)return send(res,r.status,{ok:false,error:data?.message||'SMS request failed.'});
    return send(res,200,{ok:true,sid:data.sid,status:data.status,to:data.to});
  }catch(e){return send(res,500,{ok:false,error:'SMS service error.'});}
}
