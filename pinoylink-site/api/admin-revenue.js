const SOURCES={
  pipeline:{url:'https://api.3minapi.com/api/v1/data/asjcr1qjg0xuze3ng2q3q',env:'THREEMIN_AD_PIPELINE_READ_KEY'},
  bookings:{url:'https://api.3minapi.com/api/v1/data/afmf9zu771p4xlq8xvrta',env:'THREEMIN_AD_BOOKINGS_READ_KEY'},
  payments:{url:'https://api.3minapi.com/api/v1/data/z03ytndjfni4cq9c5xvfy',env:'THREEMIN_PAYMENT_EVENTS_READ_KEY'}
};
function rowsFrom(d){if(Array.isArray(d))return d;if(Array.isArray(d?.data?.data))return d.data.data;if(Array.isArray(d?.data))return d.data;if(Array.isArray(d?.records))return d.records;return []}
function payload(r){return r?.payload||r?.data||r||{}}
async function getList(source){const key=process.env[source.env];if(!key)return {configured:false,rows:[]};const u=new URL(source.url);u.searchParams.set('limit','30');const r=await fetch(u,{headers:{authorization:`Bearer ${key}`}});if(!r.ok)throw new Error(`${source.env} upstream ${r.status}`);const d=await r.json();return {configured:true,rows:rowsFrom(d).map(x=>({...payload(x),_record_id:x?.id||x?.record_id||payload(x)?.id||''}))}}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const expected=process.env.PINOYLINK_ADMIN_TOKEN;const supplied=String(req.headers['x-admin-token']||'');
  if(!expected||supplied!==expected)return res.status(401).json({error:'Unauthorized'});
  try{
    const [pipeline,bookings,payments]=await Promise.all(Object.values(SOURCES).map(getList));
    const active=pipeline.rows.filter(r=>String(r.status||'').toLowerCase()!=='inactive');
    const hot=active.filter(r=>String(r.priority||'').toUpperCase()==='HOT');
    const openBookings=bookings.rows.filter(r=>!['completed','cancelled','rejected'].includes(String(r.campaign_status||'').toLowerCase()));
    const paid=bookings.rows.filter(r=>String(r.payment_status||'').toLowerCase()==='paid');
    const fulfillment=bookings.rows.filter(r=>['awaiting_destination','awaiting_schedule','payment_required','review_required'].includes(String(r.placement_status||'').toLowerCase()));
    const scheduled=bookings.rows.filter(r=>['scheduled','active'].includes(String(r.placement_status||'').toLowerCase()));
    const reportReady=bookings.rows.filter(r=>String(r.report_status||'').toLowerCase()==='ready');
    const failed=payments.rows.filter(r=>String(r.event_type||'').includes('failed'));
    const refunds=payments.rows.filter(r=>String(r.event_type||'').includes('refund'));
    return res.status(200).json({ok:true,generated_at:new Date().toISOString(),configured:{pipeline:pipeline.configured,bookings:bookings.configured,payments:payments.configured},metrics:{active_leads:active.length,hot_leads:hot.length,open_bookings:openBookings.length,paid_bookings:paid.length,fulfillment_actions:fulfillment.length,scheduled_campaigns:scheduled.length,reports_ready:reportReady.length,failed_payments:failed.length,refund_events:refunds.length},pipeline:pipeline.rows,bookings:bookings.rows,payments:payments.rows});
  }catch(error){console.error('PinoyLink admin revenue error',error);return res.status(502).json({error:'Revenue data is temporarily unavailable.'});}
}
