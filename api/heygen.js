const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{ok:false,error:'Method not allowed'});}
  try{
    const key=process.env.HEYGEN_API_KEY;
    if(!key)return send(res,503,{ok:false,error:'HEYGEN_API_KEY is not configured.'});
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const avatarId=String(body.avatarId||process.env.HEYGEN_AVATAR_ID||'').trim();
    const voiceId=String(body.voiceId||process.env.HEYGEN_VOICE_ID||'').trim();
    const script=String(body.script||'').trim().slice(0,5000);
    const title=String(body.title||'WebinarPilot Presenter Video').trim().slice(0,160);
    if(!avatarId||!voiceId||!script)return send(res,400,{ok:false,error:'avatarId, voiceId and script are required.'});
    const payload={video_inputs:[{character:{type:'avatar',avatar_id:avatarId,avatar_style:'normal'},voice:{type:'text',voice_id:voiceId,input_text:script},background:{type:'color',value:'#090a0f'}}],dimension:{width:1280,height:720},title};
    const r=await fetch('https://api.heygen.com/v2/video/generate',{method:'POST',headers:{'X-Api-Key':key,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok)return send(res,r.status,{ok:false,error:data?.message||data?.error||'HeyGen request failed.'});
    const videoId=data?.data?.video_id||data?.video_id||null;
    return send(res,200,{ok:true,videoId,raw:data});
  }catch(e){return send(res,500,{ok:false,error:'HeyGen service error.'});}
}
