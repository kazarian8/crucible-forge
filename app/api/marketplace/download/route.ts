import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { adminRequest } from "../../../../lib/billing/admin";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime="nodejs";

async function downloadableUrl(reference:string){
 if(!reference.startsWith("star-music:"))return reference;
 const path=reference.slice("star-music:".length);
 if(!path||path.startsWith("/")||path.includes(".."))throw new Error("Invalid private audio reference.");
 const admin=createAdminClient();
 const {data,error}=await admin.storage.from("star-music").createSignedUrl(path,60);
 if(error||!data?.signedUrl)throw error??new Error("Could not authorize this download.");
 return data.signedUrl;
}

async function previewResponse(reference:string,request:Request){
 if(!reference.startsWith("star-music:"))return NextResponse.redirect(reference);
 const signedUrl=await downloadableUrl(reference);
 const requestHeaders=new Headers();
 const range=request.headers.get("range");
 if(range)requestHeaders.set("range",range);
 const upstream=await fetch(signedUrl,{headers:requestHeaders,cache:"no-store"});
 if(!upstream.ok||!upstream.body)return NextResponse.json({error:"Preview unavailable."},{status:upstream.status||502});
 const responseHeaders=new Headers({"Cache-Control":"private, no-store","Content-Type":upstream.headers.get("content-type")||"audio/mpeg"});
 for(const name of ["accept-ranges","content-length","content-range","etag","last-modified"]){
  const value=upstream.headers.get(name); if(value)responseHeaders.set(name,value);
 }
 return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
}

export async function GET(request:Request){
 try{
  const url=new URL(request.url); const id=url.searchParams.get("id"); const preview=url.searchParams.get("preview")==="1"; if(!id)return NextResponse.json({error:"Missing item."},{status:400});
  const rows=await adminRequest<Array<{id:string;user_id:string|null;file_url:string;preview_url:string|null;price_cents:number;free_download:boolean;is_published:boolean}>>(`sound_library_items?id=eq.${encodeURIComponent(id)}&select=id,user_id,file_url,preview_url,price_cents,free_download,is_published&limit=1`); const item=rows[0]; if(!item?.is_published)return NextResponse.json({error:"Item unavailable."},{status:404});
  if(preview){
   const reference=item.price_cents>0?item.preview_url:item.file_url;
   if(!reference)return NextResponse.json({error:"Preview unavailable."},{status:404});
   return previewResponse(reference,request);
  }
  if(item.free_download||item.price_cents<=0)return NextResponse.redirect(await downloadableUrl(item.file_url));
  const sb=await createClient(); const {data:{user}}=await sb.auth.getUser(); if(!user)return NextResponse.json({error:"Sign in to download purchases."},{status:401}); if(user.id===item.user_id)return NextResponse.redirect(await downloadableUrl(item.file_url));
  const purchases=await adminRequest<Array<{id:string}>>(`marketplace_purchases?buyer_id=eq.${user.id}&item_id=eq.${encodeURIComponent(id)}&payment_status=eq.paid&select=id&limit=1`); if(!purchases[0])return NextResponse.json({error:"Purchase required."},{status:403}); return NextResponse.redirect(await downloadableUrl(item.file_url));
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Download failed."},{status:500});}
}
