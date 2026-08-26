import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { adminRequest } from "../../../../lib/billing/admin";
import { getBillingConfig,getStripeClient } from "../../../../lib/billing/stripe";

export const runtime="nodejs";
export async function GET(request:Request){
 const url=new URL(request.url); const sessionId=url.searchParams.get("session_id"); if(!sessionId)return NextResponse.redirect(new URL("/sound-library?purchase=missing",url.origin));
 const sb=await createClient(); const {data:{user}}=await sb.auth.getUser(); if(!user)return NextResponse.redirect(new URL("/login",url.origin)); const {secretKey}=getBillingConfig(); if(!secretKey)return NextResponse.redirect(new URL("/sound-library?purchase=error",url.origin));
 const session=await getStripeClient(secretKey).checkout.sessions.retrieve(sessionId); const purchaseId=session.metadata?.marketplace_purchase_id; const buyerId=session.metadata?.buyer_id; if(!purchaseId||buyerId!==user.id||session.payment_status!=="paid")return NextResponse.redirect(new URL("/sound-library?purchase=unverified",url.origin)); await adminRequest(`marketplace_purchases?id=eq.${encodeURIComponent(purchaseId)}&buyer_id=eq.${encodeURIComponent(user.id)}`,{method:"PATCH",body:JSON.stringify({payment_status:"paid"})}); const itemId=session.metadata?.item_id; return NextResponse.redirect(new URL(`/sound-library?purchase=success${itemId?`&item=${encodeURIComponent(itemId)}`:""}`,url.origin));
}
