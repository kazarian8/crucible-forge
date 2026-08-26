import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { adminRequest } from "../../../../lib/billing/admin";

export const runtime="nodejs";
export async function GET(request:Request){
 const url=new URL(request.url); const id=url.searchParams.get("id"); const preview=url.searchParams.get("preview")==="1"; if(!id)return NextResponse.json({error:"Missing item."},{status:400});
 const rows=await adminRequest<Array<{id:string;user_id:string|null;file_url:string;preview_url:string|null;price_cents:number;free_download:boolean;is_published:boolean}>>(`sound_library_items?id=eq.${encodeURIComponent(id)}&select=id,user_id,file_url,preview_url,price_cents,free_download,is_published&limit=1`); const item=rows[0]; if(!item?.is_published)return NextResponse.json({error:"Item unavailable."},{status:404});
 if(preview&&item.price_cents>0){ if(!item.preview_url)return NextResponse.json({error:"Preview unavailable."},{status:404}); return NextResponse.redirect(item.preview_url); }
 if(item.free_download||item.price_cents<=0)return NextResponse.redirect(item.file_url);
 const sb=await createClient(); const {data:{user}}=await sb.auth.getUser(); if(!user)return NextResponse.json({error:"Sign in to download purchases."},{status:401}); if(user.id===item.user_id)return NextResponse.redirect(item.file_url);
 const purchases=await adminRequest<Array<{id:string}>>(`marketplace_purchases?buyer_id=eq.${user.id}&item_id=eq.${encodeURIComponent(id)}&payment_status=eq.paid&select=id&limit=1`); if(!purchases[0])return NextResponse.json({error:"Purchase required."},{status:403}); return NextResponse.redirect(item.file_url);
}
