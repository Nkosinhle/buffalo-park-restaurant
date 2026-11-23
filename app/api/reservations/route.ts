import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RequestData = {
  name:string;email:string;phone:string;date:string;time:string;guests:number;notes:string;website:string;consent:boolean;
};

const allowedTimes = new Set(['12:00','13:00','14:00','17:00','18:00','19:00','20:00','21:00']);
const ipAttempts = new Map<string,number[]>();
const WINDOW_MS=15*60*1000;
const MAX_ATTEMPTS=5;

function localDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function error(message:string,status=400){return NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});}
function safeString(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
function isValidDate(s:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(`${s}T12:00:00Z`);
  if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==s)return false;
  const diff=(Date.parse(s+'T00:00:00Z')-Date.parse(localDay()+'T00:00:00Z'))/86400000;
  return diff>=0&&diff<=120;
}
function rateLimit(request:NextRequest){
  // Per-instance rate limiter: a useful early guard, not a distributed anti-abuse solution.
  // In production, enable TURNSTILE_SECRET_KEY for CAPTCHA protection.
  const ip=request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const now=Date.now();
  if(ipAttempts.size>5000)ipAttempts.clear();
  const valid=(ipAttempts.get(ip)||[]).filter(t=>now-t<WINDOW_MS);
  if(valid.length>=MAX_ATTEMPTS)return false;
  valid.push(now);ipAttempts.set(ip,valid);
  return true;
}
async function verifyTurnstile(token:string,ip:string){
  const secret=process.env.TURNSTILE_SECRET_KEY;
  if(!secret)return process.env.NODE_ENV!=='production' && process.env.ALLOW_UNPROTECTED_BOOKINGS==='true';
  const payload=new URLSearchParams({secret,response:token,remoteip:ip});
  const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:payload,cache:'no-store',signal:AbortSignal.timeout(7000)});
  if(!res.ok)return false;
  const result=await res.json() as {success?:boolean,hostname?:string};
  if(result.success!==true)return false;
  const expected=process.env.PUBLIC_SITE_HOSTNAME;
  return !expected || result.hostname===expected;
}
async function emailRestaurant(input:RequestData,reference:string){
  const key=process.env.RESEND_API_KEY;
  const to=process.env.RESTAURANT_BOOKINGS_EMAIL;
  const from=process.env.BOOKING_FROM_EMAIL;
  if(!key||!to||!from)return;
  const subject=`New Buffalo Park reservation request — ${reference}`;
  const text=[subject,'','Name: '+input.name,'Email: '+input.email,'Phone: '+input.phone,'Date: '+input.date,'Preferred time: '+input.time,'Guests: '+input.guests,'Notes: '+(input.notes||'None'),'','Request received. Please contact the guest to confirm or decline.'].join('\n');
  const resp=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':reference},body:JSON.stringify({from,to:[to],reply_to:input.email,subject,text}),signal:AbortSignal.timeout(8000)});
  if(!resp.ok)console.error('Restaurant notification failed, reservation remains stored',resp.status);
  if(!resp.ok)return;
  // Customer gets an acknowledgement, never an automatic booking confirmation.
  const confirmation=[
    'Hello '+input.name+',','',
    'Thank you for requesting a table at Buffalo Park Restaurant.',
    'Your request reference: '+reference,
    'Preferred date: '+input.date,
    'Preferred time: '+input.time,
    'Guests: '+input.guests,'',
    'Please note: your reservation is NOT confirmed yet. Our team must check availability and contact you.',
    '', 'Buffalo Park Restaurant · 59 Molopo Road, Mahikeng'
  ].join('\n');
  try{
    const receipt=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':reference+'-customer'},body:JSON.stringify({from,to:[input.email],subject:'We received your Buffalo Park reservation request — '+reference,text:confirmation}),signal:AbortSignal.timeout(8000)});
    if(!receipt.ok)console.error('Guest acknowledgement failed; reservation remains stored',receipt.status);
  }catch{console.error('Guest email could not be sent; reservation remains stored');}
}

export async function POST(request:NextRequest){
  if(!rateLimit(request))return error('Too many requests. Please try again later.',429);
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return error('Online reservations are temporarily unavailable. Please contact the restaurant directly.',503);
  const contentType=request.headers.get('content-type')||'';
  if(!contentType.includes('application/json'))return error('Please send JSON data.',415);
  if(Number(request.headers.get('content-length')||0)>12000)return error('Request is too large.',413);
  let raw:Record<string,unknown>;
  try{raw=await request.json() as Record<string,unknown>;}catch{return error('Invalid request data.');}
  const input:RequestData={
    name:safeString(raw.name,100),email:safeString(raw.email,254),phone:safeString(raw.phone,35),
    date:safeString(raw.date,10),time:safeString(raw.time,5),guests:Number(raw.guests),
    notes:safeString(raw.notes,1000),website:safeString(raw.website,150),consent:raw.consent===true,
  };
  if(input.website)return NextResponse.json({reference:'REQUEST-RECEIVED',status:'pending'},{status:202}); // honeypot
  if(input.consent!==true || input.name.length<2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
    || input.phone.replace(/\D/g,'').length<9 || !isValidDate(input.date)
    || !allowedTimes.has(input.time)||!Number.isInteger(input.guests)||input.guests<1||input.guests>12){
      return error('Please check your name, contact information, date, time and guest count.');
  }
  const ip=request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'';
  try{
    const verified=await verifyTurnstile(safeString(raw.turnstileToken,4096),ip);
    if(!verified)return error('Please complete the security check and try again.',403);
  }catch{return error('Security verification is temporarily unavailable. Try again shortly.',503);}
  const id=randomUUID();
  const reference=`BP-${id.slice(0,8).toUpperCase()}`;
  try{
    const endpoint=`${url.replace(/\/$/,'')}/rest/v1/reservation_requests`;
    const headers:Record<string,string>={apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'};
    if(!key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
    const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({
      id,reference,name:input.name,email:input.email.toLowerCase(),phone:input.phone,
      preferred_date:input.date,preferred_time:input.time,guest_count:input.guests,
      special_requests:input.notes,status:'pending',consent_recorded_at:new Date().toISOString()
    }),cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok){console.error('Reservation storage failed',response.status);return error('We could not save your reservation request. Please try again.',503);}
    try{await emailRestaurant(input,reference);}catch{console.error('Restaurant notification encountered an error; request was saved');}
    return NextResponse.json({reference,status:'pending',message:'Your reservation request has been received. The restaurant will contact you after checking availability.'},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch{
    return error('Reservation requests are temporarily unavailable. Please try again later.',503);
  }
}

export async function GET(){return error('Method not allowed',405);}
