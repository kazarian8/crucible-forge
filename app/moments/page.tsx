"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { ImagePlus, Music2, Plus, Radio, X } from "lucide-react";

type Moment = { id:string; user_id:string; body:string; music_url:string|null; artwork_url:string|null; created_at:string };

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_TYPES = ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg"];

export default function MomentsPage(){
  const [moments,setMoments]=useState<Moment[]>([]);
  const [body,setBody]=useState("");
  const [musicUrl,setMusicUrl]=useState("");
  const [picture,setPicture]=useState<File|null>(null);
  const [audioFile,setAudioFile]=useState<File|null>(null);
  const [picturePreview,setPicturePreview]=useState("");
  const [audioPreview,setAudioPreview]=useState("");
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");
  const pictureInput=useRef<HTMLInputElement>(null);
  const audioInput=useRef<HTMLInputElement>(null);

  const load=async()=>{ const sb=createClient(); const {data,error}=await sb.from("artist_moments").select("id,user_id,body,music_url,artwork_url,created_at").eq("is_public",true).order("created_at",{ascending:false}).limit(50); if(error)setMsg(error.message); else setMoments((data??[]) as Moment[]); };
  useEffect(()=>{void load();},[]);

  function choosePicture(file:File|null){
    if(picturePreview) URL.revokeObjectURL(picturePreview);
    if(!file){setPicture(null);setPicturePreview("");return;}
    if(!IMAGE_TYPES.includes(file.type) || file.size > 10*1024*1024){setMsg("Use a JPG, PNG or WebP picture up to 10 MB.");return;}
    setMsg("");setPicture(file);setPicturePreview(URL.createObjectURL(file));
  }

  function chooseAudio(file:File|null){
    if(audioPreview) URL.revokeObjectURL(audioPreview);
    if(!file){setAudioFile(null);setAudioPreview("");return;}
    if(!AUDIO_TYPES.includes(file.type) || file.size > 100*1024*1024){setMsg("Use WAV, MP3, M4A, AAC or OGG audio up to 100 MB.");return;}
    setMsg("");setAudioFile(file);setAudioPreview(URL.createObjectURL(file));
  }

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    if(!body.trim() && !audioFile && !picture && !musicUrl.trim()){setMsg("Add a caption, audio file, picture, or track link before posting.");return;}
    setBusy(true);setMsg("");
    const sb=createClient();
    const {data:{user}}=await sb.auth.getUser();
    if(!user){setMsg("Sign in to post a Moment.");setBusy(false);return;}

    const uploaded:string[]=[];
    try{
      let artworkUrl:string|null=null;
      let finalMusicUrl=musicUrl.trim()||null;

      if(picture){
        const ext=picture.type==="image/jpeg"?"jpg":picture.type.split("/")[1];
        const path=`${user.id}/pictures/${crypto.randomUUID()}.${ext}`;
        const {error}=await sb.storage.from("moment-media").upload(path,picture,{contentType:picture.type,upsert:false});
        if(error) throw error;
        uploaded.push(path);
        artworkUrl=sb.storage.from("moment-media").getPublicUrl(path).data.publicUrl;
      }

      if(audioFile){
        const rawExt=audioFile.name.split(".").pop()?.toLowerCase();
        const ext=rawExt&&rawExt.length<=5?rawExt:(audioFile.type.includes("mpeg")?"mp3":audioFile.type.includes("wav")?"wav":"m4a");
        const path=`${user.id}/audio/${crypto.randomUUID()}.${ext}`;
        const {error}=await sb.storage.from("moment-media").upload(path,audioFile,{contentType:audioFile.type,upsert:false});
        if(error) throw error;
        uploaded.push(path);
        finalMusicUrl=sb.storage.from("moment-media").getPublicUrl(path).data.publicUrl;
      }

      const {error}=await sb.from("artist_moments").insert({user_id:user.id,body:body.trim(),music_url:finalMusicUrl,artwork_url:artworkUrl,is_public:true});
      if(error) throw error;

      if(picturePreview) URL.revokeObjectURL(picturePreview);
      if(audioPreview) URL.revokeObjectURL(audioPreview);
      setBody("");setMusicUrl("");setPicture(null);setAudioFile(null);setPicturePreview("");setAudioPreview("");
      if(pictureInput.current) pictureInput.current.value="";
      if(audioInput.current) audioInput.current.value="";
      await load();
    }catch(error){
      if(uploaded.length) await sb.storage.from("moment-media").remove(uploaded);
      setMsg(error instanceof Error?error.message:"Could not post this Moment.");
    }finally{setBusy(false);}
  };

  return <main className="min-h-screen bg-[#050403] pb-28 text-white"><div className="mx-auto max-w-3xl px-4 py-6"><header><p className="text-[10px] font-black uppercase tracking-[.25em] text-orange-300">Artist network</p><h1 className="mt-2 text-3xl font-black">Moments</h1><p className="mt-2 text-sm text-white/45">Drop updates, tracks, clips and releases to the Crucible community.</p></header>

  <form onSubmit={submit} className="mt-6 rounded-3xl border border-white/10 bg-[#0d0a08] p-4">
    <textarea maxLength={1200} value={body} onChange={e=>setBody(e.target.value)} placeholder="What are you working on?" className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-orange-400/50"/>

    {picturePreview?<div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10"><div className="aspect-square bg-black bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${picturePreview})`}}/><button type="button" onClick={()=>choosePicture(null)} className="absolute right-2 top-2 rounded-full bg-black/75 p-2" aria-label="Remove picture"><X size={16}/></button></div>:null}
    {audioPreview?<div className="relative mt-3 rounded-2xl border border-white/10 bg-black/30 p-3"><audio controls className="w-full" src={audioPreview}/><button type="button" onClick={()=>chooseAudio(null)} className="absolute right-2 top-2 rounded-full bg-black/75 p-2" aria-label="Remove audio"><X size={16}/></button></div>:null}

    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" disabled={busy} onClick={()=>pictureInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold"><ImagePlus size={17}/>Add Picture</button>
      <button type="button" disabled={busy} onClick={()=>audioInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold"><Music2 size={17}/>Upload Audio</button>
    </div>
    <input ref={pictureInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>choosePicture(e.target.files?.[0]??null)}/>
    <input ref={audioInput} type="file" accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg" hidden onChange={e=>chooseAudio(e.target.files?.[0]??null)}/>

    <input value={musicUrl} onChange={e=>setMusicUrl(e.target.value)} placeholder="Or paste an optional audio/track URL" className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"/>
    <button disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-black"><Plus size={16}/>{busy?"Uploading & posting…":"Post Moment"}</button>
    {msg?<p className="mt-2 text-xs text-orange-200">{msg}</p>:null}
  </form>

  <section className="mt-6 space-y-3">{moments.length===0?<div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35"><Radio className="mx-auto mb-2"/>No public Moments yet.</div>:moments.map(m=><article key={m.id} className="rounded-2xl border border-white/10 bg-[#0d0a08] p-4"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/30"><Radio size={13}/>Artist Moment · {new Date(m.created_at).toLocaleDateString()}</div>{m.body?<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">{m.body}</p>:null}{m.artwork_url?<div className="mt-4 aspect-square overflow-hidden rounded-2xl bg-black bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${m.artwork_url})`}}/>:null}{m.music_url?<audio className="mt-4 w-full" controls preload="none" src={m.music_url}/>:null}</article>)}</section></div></main>;
}
