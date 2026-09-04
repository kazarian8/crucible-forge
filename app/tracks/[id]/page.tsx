"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, ExternalLink, Globe2, History, LockKeyhole, MoreHorizontal, Music2, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Track = {
  id: string;
  title: string;
  artwork_url: string | null;
  storage_path: string;
  original_filename: string;
  size_bytes: number;
  verification_status: string;
  created_at: string;
};

type TrackVersion = {
  id: string;
  version_number: number;
  status: "saved" | "mastered";
  version_label: string;
  storage_path: string;
  artwork_url: string | null;
  original_filename: string;
  size_bytes: number;
  created_by_name: string;
  edit_commands: string[];
  created_at: string;
};

const DISTROKID_URL =
  process.env.NEXT_PUBLIC_DISTROKID_AFFILIATE_URL?.trim() || "https://distrokid.com/";

function displayDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TrackProjectPage() {
  const params = useParams<{ id: string }>();
  const trackId = params.id;
  const [track, setTrack] = useState<Track | null>(null);
  const [versions, setVersions] = useState<TrackVersion[]>([]);
  const [tab, setTab] = useState<"versions" | "distribution">("versions");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!trackId) return;
    setLoading(true);
    const supabase = createClient();
    const [{ data: trackData, error: trackError }, { data: versionData, error: versionError }] = await Promise.all([
      supabase
        .from("star_music_files")
        .select("id,title,artwork_url,storage_path,original_filename,size_bytes,verification_status,created_at")
        .eq("id", trackId)
        .single(),
      supabase
        .from("star_track_versions")
        .select("id,version_number,status,version_label,storage_path,artwork_url,original_filename,size_bytes,created_by_name,edit_commands,created_at")
        .eq("track_id", trackId)
        .order("version_number", { ascending: false }),
    ]);

    if (trackError || !trackData) {
      setTrack(null);
      setVersions([]);
      setMessage("This private track could not be opened.");
    } else {
      setTrack(trackData as Track);
      setVersions((versionData ?? []) as TrackVersion[]);
      setMessage(versionError ? "The track opened, but its version history could not be loaded." : "");
    }
    setLoading(false);
  }, [trackId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadVersion(version: Pick<TrackVersion, "storage_path" | "original_filename">) {
    setMessage("Preparing private download…");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage.from("star-music").download(version.storage_path);
      if (error || !data) throw error ?? new Error("The audio could not be downloaded.");
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = version.original_filename;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setMessage("Download ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The audio could not be downloaded.");
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#f7f7f5] p-8 text-zinc-900"><p>Opening project…</p></main>;
  }

  if (!track) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] p-8 text-zinc-900">
        <Link href="/local-library" className="font-bold">← Track list</Link>
        <p className="mt-8">{message || "Track not found."}</p>
      </main>
    );
  }

  const current = versions[0] ?? {
    id: track.id,
    version_number: 1,
    status: track.verification_status === "verified" ? "mastered" as const : "saved" as const,
    version_label: track.verification_status === "verified" ? "Mastered" : "Saved",
    storage_path: track.storage_path,
    artwork_url: track.artwork_url,
    original_filename: track.original_filename,
    size_bytes: track.size_bytes,
    created_by_name: "Artist",
    edit_commands: [],
    created_at: track.created_at,
  };
  const history = versions.slice(1);

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-28 text-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <Link href="/local-library" className="text-3xl leading-none" aria-label="Back to track list">‹</Link>
          <div className="min-w-0 flex-1 px-4">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-zinc-400">Project</p>
            <h1 className="truncate text-2xl font-black">{track.title}</h1>
          </div>
          <MoreHorizontal size={28} className="text-zinc-700" />
        </header>

        <nav className="mt-6 grid grid-cols-2 rounded-2xl bg-zinc-200/70 p-1" aria-label="Project sections">
          <button
            type="button"
            onClick={() => setTab("versions")}
            className={`rounded-xl px-3 py-3 text-sm font-black ${tab === "versions" ? "bg-white shadow-sm" : "text-zinc-500"}`}
          >
            <History className="mr-2 inline" size={16} />Versions
          </button>
          <button
            type="button"
            onClick={() => setTab("distribution")}
            className={`rounded-xl px-3 py-3 text-sm font-black ${tab === "distribution" ? "bg-white shadow-sm" : "text-zinc-500"}`}
          >
            <Globe2 className="mr-2 inline" size={16} />Distribute to 40+ Platforms
          </button>
        </nav>

        {tab === "versions" ? (
          <>
            <section className="mt-7">
              <h2 className="text-xl font-black">Current Version</h2>
              <VersionRow
                version={current}
                current
                title={track.title}
                onDownload={() => void downloadVersion(current)}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/sound-furnace" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff2d19] px-5 py-3 font-black text-white">
                  <SlidersHorizontal size={18} />Studio
                </Link>
                <button type="button" onClick={() => void downloadVersion(current)} className="inline-flex items-center gap-2 rounded-2xl bg-zinc-200 px-5 py-3 font-black">
                  <Download size={18} />Download
                </button>
                <button type="button" onClick={() => setTab("distribution")} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white">
                  <Globe2 size={18} />Distribute
                </button>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-black">Version History</h2>
              <div className="mt-3 divide-y divide-zinc-200">
                {history.map((version) => (
                  <VersionRow
                    key={version.id}
                    version={version}
                    title={track.title}
                    onDownload={() => void downloadVersion(version)}
                  />
                ))}
                {history.length === 0 ? (
                  <p className="rounded-2xl bg-white p-5 text-sm text-zinc-500">Your next saved or mastered session will appear here. The current version is already protected.</p>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-7 rounded-3xl bg-white p-6 shadow-sm">
            <div className="grid size-14 place-items-center rounded-2xl bg-emerald-500 text-white"><Globe2 size={26} /></div>
            <h2 className="mt-5 text-2xl font-black">Distribute to 40+ Platforms</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Send this finished track to DistroKid to manage delivery to Spotify, Apple Music, TikTok, YouTube Music, and other supported stores.
            </p>
            <a
              href={DISTROKID_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#ff2d19] px-5 py-3 font-black text-white"
            >
              Continue to DistroKid <ExternalLink size={17} />
            </a>
            <p className="mt-4 text-xs leading-5 text-zinc-400">
              Distribution is completed on DistroKid. Crucible does not mark a release distributed until a distributor confirms it.
            </p>
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-4 text-sm font-bold text-zinc-400">More distribution options coming later.</div>
          </section>
        )}

        {message ? <p className="mt-5 rounded-2xl bg-white p-4 text-sm text-zinc-600" aria-live="polite">{message}</p> : null}
      </div>
    </main>
  );
}

function VersionRow({
  version,
  current = false,
  title,
  onDownload,
}: {
  version: TrackVersion;
  current?: boolean;
  title: string;
  onDownload: () => void;
}) {
  return (
    <article className={`mt-3 flex items-center gap-3 rounded-2xl p-3 ${current ? "bg-white shadow-sm" : ""}`}>
      <div
        className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-zinc-900 bg-cover bg-center text-white"
        style={version.artwork_url ? { backgroundImage: `url(${version.artwork_url})` } : undefined}
      >
        {!version.artwork_url ? <Music2 size={24} /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black">{displayDate(version.created_at)}</p>
          <LockKeyhole size={16} className="text-[#ff2d19]" aria-label="Private locked version" />
          <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-black">{version.version_label}</span>
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">{version.created_by_name}</p>
        {version.edit_commands.length > 0 ? <p className="mt-1 truncate text-xs text-zinc-400">{version.edit_commands.join(" · ")}</p> : null}
        <p className="sr-only">{title}, version {version.version_number}</p>
      </div>
      <details className="relative">
        <summary className="list-none cursor-pointer rounded-full p-2 text-zinc-500" aria-label={`Version ${version.version_number} menu`}>
          <MoreHorizontal size={22} />
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl">
          <button type="button" onClick={onDownload} className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-zinc-100">Download</button>
        </div>
      </details>
    </article>
  );
}
