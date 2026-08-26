import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { adminRequest } from "../../../../lib/billing/admin";
import { getBillingConfig, getStripeClient } from "../../../../lib/billing/stripe";

export const runtime = "nodejs";
export async function POST(request:Request){
 const sb=await createClient(); const {data:{user}}=await sb.auth.getUser(); if(!user)return NextResponse.json({error:"Sign in to become a seller."},{status:401});
 const {secretKey}=getBillingConfig(); if(!secretKey)return NextResponse.json({error:"Stripe is not configured."},{status:503});
 const stripe=getStripeClient(secretKey); const rows=await adminRequest<Array<{stripe_account_id:string|null;display_name:string}>>(`marketplace_sellers?user_id=eq.${user.id}&select=stripe_account_id,display_name&limit=1`);
 let accountId=rows[0]?.stripe_account_id??null;
 if(!accountId){const account=await stripe.accounts.create({type:"express",email:user.email??undefined,capabilities:{transfers:{requested:true}},metadata:{crucible_user_id:user.id}});accountId=account.id;await adminRequest("marketplace_sellers?on_conflict=user_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:user.id,display_name:rows[0]?.display_name??user.email?.split("@")[0]??"Crucible Artist",stripe_account_id:accountId,updated_at:new Date().toISOString()})});}
 const origin=new URL(request.url).origin; const link=await stripe.accountLinks.create({account:accountId,refresh_url:`${origin}/sound-library`,return_url:`${origin}/sound-library`,type:"account_onboarding"}); return NextResponse.json({url:link.url});
}
