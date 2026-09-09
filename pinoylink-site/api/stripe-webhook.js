import crypto from 'node:crypto';

const ENDPOINT='https://api.3minapi.com/api/v1/data/z03ytndjfni4cq9c5xvfy';

export const config={api:{bodyParser:false}};

async function readRaw(req){
  const chunks=[];
  for await(const chunk of req)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function timingSafeEqualHex(a,b){
  try{
    const aa=Buffer.from(a,'hex');
    const bb=Buffer.from(b,'hex');
    return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
  }catch{return false}
}

function verifyStripeSignature(raw,header,secret,tolerance=300){
  if(!header||!secret)return false;
  const parts=String(header).split(',').map(v=>v.trim());
  const timestamp=parts.find(v=>v.startsWith('t='))?.slice(2);
  const signatures=parts.filter(v=>v.startsWith('v1=')).map(v=>v.slice(3));
  if(!timestamp||!signatures.length)return false;
  const age=Math.abs(Math.floor(Date.now()/1000)-Number(timestamp));
  if(!Number.isFinite(age)||age>tolerance)return false;
  const signedPayload=`${timestamp}.${raw.toString('utf8')}`;
  const expected=crypto.createHmac('sha256',secret).update(signedPayload).digest('hex');
  return signatures.some(sig=>timingSafeEqualHex(expected,sig));
}

function normalizeEvent(event){
  const obj=event?.data?.object||{};
  const type=String(event?.type||'');
  const metadata=obj.metadata||{};
  let invoiceId='';
  let amountPaid=0;
  let paymentStatus='';
  if(type.startsWith('invoice.')){
    invoiceId=String(obj.id||'');
    amountPaid=Number(obj.amount_paid||0);
    paymentStatus=type==='invoice.paid'?'paid':type==='invoice.payment_failed'?'failed':String(obj.status||'');
  }else if(type==='charge.refunded'){
    invoiceId=String(obj.invoice||'');
    amountPaid=Number(obj.amount_refunded||0);
    paymentStatus='refunded';
  }else if(type==='credit_note.created'){
    invoiceId=String(obj.invoice||'');
    amountPaid=Number(obj.amount||0);
    paymentStatus='credit_note';
  }
  return {
    event_id:String(event?.id||''),
    event_type:type,
    invoice_id:invoiceId,
    customer_email:String(obj.customer_email||obj.receipt_email||obj.billing_details?.email||''),
    booking_id:String(metadata.booking_id||metadata.pinoylink_booking_id||''),
    amount_paid:Number.isFinite(amountPaid)?amountPaid:0,
    currency:String(obj.currency||'usd').toLowerCase(),
    payment_status:paymentStatus,
    event_created_at:event?.created?new Date(Number(event.created)*1000).toISOString():'',
    received_at:new Date().toISOString()
  };
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;
  const writeKey=process.env.THREEMIN_PAYMENT_EVENTS_WRITE_KEY;
  if(!webhookSecret||!writeKey)return res.status(503).json({error:'Payment webhook is not configured.'});

  const raw=await readRaw(req);
  if(!verifyStripeSignature(raw,req.headers['stripe-signature'],webhookSecret))return res.status(400).json({error:'Invalid signature'});

  let event;
  try{event=JSON.parse(raw.toString('utf8'))}catch{return res.status(400).json({error:'Invalid JSON'})}
  const allowed=new Set(['invoice.paid','invoice.payment_failed','charge.refunded','credit_note.created']);
  if(!allowed.has(event.type))return res.status(200).json({received:true,ignored:true});

  const payload=normalizeEvent(event);
  try{
    const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${writeKey}`},body:JSON.stringify(payload)});
    const text=await upstream.text();
    if(!upstream.ok){console.error('PinoyLink payment event upstream error',upstream.status,text);return res.status(502).json({error:'Payment event storage failed'});}
    return res.status(200).json({received:true});
  }catch(error){
    console.error('PinoyLink Stripe webhook error',error);
    return res.status(502).json({error:'Payment event storage unavailable'});
  }
}
