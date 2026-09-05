"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Lock, MessageCircle, UserRound } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

type ProfileLink = { label: string; url: string };
type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  profile_links: ProfileLink[] | null;
  is_public: boolean;
  dm_mode: "everyone" | "requests" | "nobody";
};

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const sb = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void sb.rpc("get_crucible_profile", { p_username: decodeURIComponent(username) }).then(({ data }) => {
      setProfile(((data ?? [])[0] as Profile | undefined) ?? null);
      setLoading(false);
    });
  }, [sb, username]);

  if (loading) return <main className="min-h-screen bg-[#070503] p-6 text-white">Loading profile…</main>;
  if (!profile) return <main className="min-h-screen bg-[#070503] p-6 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-white/10 p-8 text-center"><h1 className="text-2xl font-black">Profile not found</h1><Link href="/artists" className="mt-4 inline-block text-orange-300">Search Crucible users</Link></div></main>;

  return (
    <main className="min-h-screen bg-[#070503] px-4 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="size-20 rounded-full object-cover" /> : <div className="grid size-20 place-items-center rounded-full bg-white/5"><UserRound size={30} className="text-white/30" /></div>}
            <div className="min-w-0 flex-1"><p className="truncate text-2xl font-black">@{profile.username}</p><p className="mt-1 text-sm text-white/45">{profile.display_name || "Crucible artist"}</p></div>
          </div>

          {!profile.is_public ? <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center"><Lock className="mx-auto text-white/35"/><h2 className="mt-3 text-lg font-black">Private profile</h2><p className="mt-2 text-sm text-white/45">This artist chose to keep their profile details and public activity private.</p></div> : <>
            {profile.bio ? <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-white/70">{profile.bio}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.website ? <a href={profile.website} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-orange-200">Website</a> : null}
              {(profile.profile_links ?? []).map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-orange-200">{link.label}</a>)}
            </div>
          </>}

          <div className="mt-6 flex gap-2">
            {profile.dm_mode !== "nobody" ? <Link href={`/messages?user=${profile.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-black"><MessageCircle size={18}/>Message</Link> : <div className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-white/35">Messages closed</div>}
            <Link href="/artists" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold">Find artists</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
