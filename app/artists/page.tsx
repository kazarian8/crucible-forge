"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { MessageCircle, Search, UserRound } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type Artist = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
};

export default function ArtistsPage() {
  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Search Crucible by username.");

  async function search(event?: FormEvent) {
    event?.preventDefault();
    const value = query.trim();
    if (!value) return;
    setLoading(true);
    const sb = createClient();
    const { data, error } = await sb.rpc("search_crucible_users", { p_query: value, p_limit: 30 });
    setLoading(false);
    if (error) {
      setMessage("User search is unavailable right now.");
      return;
    }
    const rows = (data ?? []) as Artist[];
    setArtists(rows);
    setMessage(rows.length ? `${rows.length} artist${rows.length === 1 ? "" : "s"} found.` : "No matching Crucible users.");
  }

  return (
    <main className="min-h-screen bg-[#070503] px-4 pb-28 pt-7 text-white">
      <section className="mx-auto max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[.24em] text-orange-300">Crucible network</p>
        <h1 className="mt-2 text-3xl font-black">Find artists</h1>
        <p className="mt-2 text-sm text-white/45">Search by Crucible username, view profiles, message artists, or start a collaboration.</p>

        <form onSubmit={search} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search @username" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 outline-none focus:border-orange-300/50" />
          </div>
          <button disabled={loading || !query.trim()} className="rounded-2xl bg-orange-500 px-5 font-black text-black disabled:opacity-50">{loading ? "..." : "Search"}</button>
        </form>

        <p className="mt-3 text-xs text-white/35">{message}</p>
        <div className="mt-5 space-y-3">
          {artists.map((artist) => (
            <article key={artist.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="size-12 rounded-full object-cover" /> : <div className="grid size-12 place-items-center rounded-full bg-white/5"><UserRound size={20} className="text-white/35" /></div>}
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${encodeURIComponent(artist.username)}`} className="font-black hover:text-orange-300">@{artist.username}</Link>
                <p className="truncate text-xs text-white/45">{artist.is_public ? (artist.bio || artist.display_name || "Public Crucible profile") : "Private profile"}</p>
              </div>
              <Link href={`/messages?user=${artist.id}`} aria-label={`Message ${artist.username}`} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-orange-200"><MessageCircle size={18} /></Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
