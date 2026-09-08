const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{ok:false,error:'Method not allowed'});}
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const question=String(body.question||'').trim().slice(0,1200);
    const offer=String(body.offer||'WebinarPilot.AI Growth').trim().slice(0,2500);
    const context=String(body.context||'AI webinar platform with AI presenter, CRM, SMS reminders, dynamic offers and analytics.').trim().slice(0,5000);
    if(!question)return send(res,400,{ok:false,error:'Question is required.'});
    const key=process.env.OPENAI_API_KEY;
    if(!key)return send(res,503,{ok:false,error:'OPENAI_API_KEY is not configured.'});
    const model=process.env.OPENAI_MODEL||'gpt-5.6-terra';
    const prompt=`You are the WebinarPilot.AI Sales Agent. Answer only from approved offer knowledge. Be concise, accurate, helpful and conversion-aware without pressure. Never invent pricing, guarantees, legal terms, refund policies or features. If the answer is not in the approved context, say you need a human to confirm.\n\nOffer: ${offer}\nApproved context: ${context}\nBuyer question: ${question}\n\nReturn a short answer plus one next-best CTA chosen from: Learn more, Book a demo, Buy now, Human follow-up.`;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,input:prompt})});
    const data=await r.json();
    if(!r.ok)return send(res,r.status,{ok:false,error:data?.error?.message||'AI request failed.'});
    const text=data.output_text||data.output?.flatMap?.(x=>x.content||[]).map?.(x=>x.text||'').join('')||'I can help with that. Please choose the next best step.';
    return send(res,200,{ok:true,answer:text});
  }catch(e){return send(res,500,{ok:false,error:'Sales agent service error.'});}
}
