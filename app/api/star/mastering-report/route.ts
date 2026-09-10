import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { authorizePaidProvider } from "../../../../lib/auth/provider-access";
import { validReport, reportEmailHtml, explainMastering, reportRows } from "../../../../lib/star/mastering-report";
export const runtime = "nodejs";
export const maxDuration = 30;
const response = (body: object, status=200) => NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request: Request) {
  try {
    const access = await authorizePaidProvider("mastering-report-email", 3);
    if(access.response) return access.response;
    // Recipient is always the verified account performing this mastering session.
    // No recipient, user ID, sender, subject or HTML is accepted from the browser.
    const recipient = access.user?.email;
    if(!recipient || !access.user?.email_confirmed_at) return response({error:"A verified account email is required."},403);
    const key=process.env.RESEND_API_KEY, from=process.env.CRUCIBLE_REPORT_EMAIL_FROM;
    if(!key || !from) return response({error:"Report email delivery is not configured yet. Your master and downloadable reports are ready."},503);
    if(Number(request.headers.get("content-length"))>4_000_000) return response({error:"Report request is too large."},413);
    const raw=await request.text();
    if(raw.length>4_000_000) return response({error:"Report request is too large."},413);
    let body;
    try {body=JSON.parse(raw);} catch {return response({error:"Invalid report request."},400);}
    if(body.uploaderId !== access.user.id) return response({error:"Sign back into the account that mastered this file before emailing its reports."},403);
    if(!validReport(body.report)) return response({error:"The before-and-after measurements are incomplete."},400);
    const images=[body.beforeImage,body.afterImage];
    if(!images.every(image=>typeof image==="string" && image.length<1_800_000 && /^[A-Za-z0-9+/]+={0,2}$/.test(image) && Buffer.from(image,"base64").subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))) return response({error:"Both full-page PNG reports are required."},400);
    const report=body.report;
    // Stable payload key prevents duplicate deliveries when the exact request is retried.
    const payload={from,to:[recipient],subject:`CrucibleStar before & after: ${report.title.replace(/[\r\n]/g," ")}`,
      html:reportEmailHtml(report),text:[report.title,...reportRows(report.before).map(([label,v],i)=>`${label}: ${v} → ${reportRows(report.after)[i][1]}`),...explainMastering(report)].join("\n\n"),
      attachments:images.map((content,i)=>({filename:`crucible-star-${i===0?"before":"after"}.png`,content,content_type:"image/png"}))};
    const idempotency=createHash("sha256").update(access.user.id).update(JSON.stringify(payload)).digest("hex");
    const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json","Idempotency-Key":`mastering-${idempotency}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    const result=await sent.json().catch(()=>null);
    if(!sent.ok || typeof result?.id!=="string") return response({error:"The email provider did not accept your report. Download it here or retry sending."},502);
    return response({status:"accepted",messageId:result.id,recipient});
  } catch {return response({error:"Report email could not be confirmed. Your audio is safe; retry sending the report."},503);}
}
