import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE='pinoylink_admin_session';
const PENDING_COOKIE='pinoylink_admin_pending';

function secret(){return process.env.PINOYLINK_ADMIN_SESSION_SECRET||''}
function b64url(value){return Buffer.from(value).toString('base64url')}
function from64(value){return Buffer.from(value,'base64url').toString('utf8')}
function sign(value){return createHmac('sha256',secret()).update(value).digest('base64url')}
function safeEq(a,b){try{const A=Buffer.from(a);const B=Buffer.from(b);return A.length===B.length&&timingSafeEqual(A,B)}catch{return false}}
export function allowedEmails(){return String(process.env.PINOYLINK_ADMIN_EMAILS||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean)}
export function isAllowedEmail(email){return allowedEmails().includes(String(email||'').trim().toLowerCase())}
export function parseCookies(req){const raw=String(req.headers.cookie||'');return Object.fromEntries(raw.split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return i<0?[v,'']:[v.slice(0,i),decodeURIComponent(v.slice(i+1))]}))}
export function makeSignedPayload(payload){if(!secret())throw new Error('PINOYLINK_ADMIN_SESSION_SECRET is not configured');const body=b64url(JSON.stringify(payload));return `${body}.${sign(body)}`}
export function readSignedPayload(value){if(!value||!secret())return null;const [body,sig]=String(value).split('.');if(!body||!sig||!safeEq(sig,sign(body)))return null;try{return JSON.parse(from64(body))}catch{return null}}
export function setCookie(res,name,value,maxAge){res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`)}
export function clearCookie(res,name){res.setHeader('Set-Cookie',`${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`)}
export function sessionFromRequest(req){const c=parseCookies(req);const p=readSignedPayload(c[SESSION_COOKIE]);if(!p||!p.email||!p.exp||Date.now()>p.exp||!isAllowedEmail(p.email))return null;return p}
export function isAdminRequest(req){const session=sessionFromRequest(req);if(session)return true;const expected=process.env.PINOYLINK_ADMIN_TOKEN;const supplied=String(req.headers['x-admin-token']||'');return Boolean(expected&&supplied&&supplied===expected)}
export {SESSION_COOKIE,PENDING_COOKIE};
