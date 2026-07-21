import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  artist_name: string | null;
  role: "entrant" | "winner" | "admin";
};

type WinnerBenefits = {
  mastering_credits: number;
  distribution_credits: number;
  benefit_year: number;
  active: boolean;
};

type TrackSubmission = {
  id: string;
  song_title: string;
  artist_name: string;
  status: string;
  created_at: string;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function WinnerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/winners/login");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("first_name,last_name,artist_name,role")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  if (
    profileError ||
    !profile ||
    (profile.role !== "winner" && profile.role !== "admin")
  ) {
    redirect("/winners/login?error=not-authorized");
  }

  const { data: benefitsData } = await supabase
    .from("winner_benefits")
    .select(
      "mastering_credits,distribution_credits,benefit_year,active",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const benefits = benefitsData as WinnerBenefits | null;

  const { data: submissionsData } = await supabase
    .from("track_submissions")
    .select("id,song_title,artist_name,status,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const submissions = (submissionsData ?? []) as TrackSubmission[];

  const displayName =
    profile.artist_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Founding Artist";

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950/90 px-5 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">
              Crucible Forge
            </p>

            <h1 className="mt-1 text-xl font-black">
              Founding Artist Portal
            </h1>
          </div>

          <a
            href="/auth/signout"
            className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold transition hover:border-orange-500 hover:text-orange-300"
          >
            Sign Out
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_45%)]" />

        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-orange-400">
            Winner Access Confirmed
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            Welcome, {displayName}
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Submit eligible tracks for Justice Full Forge mastering and
            distribution assistance. You can follow each release from
            submission through completion.
          </p>

          {!benefits?.active && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
              Your winner benefits are not currently active. Contact Crucible
              before submitting a track.
            </div>
          )}

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-orange-500/25 bg-zinc-950 p-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
                Mastering Credits
              </p>

              <p className="mt-3 text-5xl font-black text-orange-400">
                {benefits?.mastering_credits ?? 0}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Available Justice Full Forge mastering submissions.
              </p>
            </article>

            <article className="rounded-3xl border border-orange-500/25 bg-zinc-950 p-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
                Distribution Credits
              </p>

              <p className="mt-3 text-5xl font-black text-orange-400">
                {benefits?.distribution_credits ?? 0}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Available eligible distribution-assistance requests.
              </p>
            </article>

            <article className="rounded-3xl border border-orange-500/25 bg-zinc-950 p-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
                Benefit Year
              </p>

              <p className="mt-3 text-5xl font-black text-orange-400">
                {benefits?.benefit_year ?? new Date().getFullYear()}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Credits renew according to the official giveaway terms.
              </p>
            </article>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <a
              href="/winners/submit"
              className="group rounded-3xl border border-orange-500/35 bg-gradient-to-br from-orange-500/15 to-zinc-950 p-8 transition hover:-translate-y-1 hover:border-orange-400"
            >
              <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-400">
                Mastering
              </p>

              <h3 className="mt-3 text-3xl font-black">
                Submit a Track
              </h3>

              <p className="mt-4 leading-7 text-zinc-400">
                Upload your WAV file, artwork, track information and mastering
                notes.
              </p>

              <p className="mt-7 font-black text-orange-300">
                Start submission →
              </p>
            </a>

            <a
              href="/winners/distribution"
              className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-8 transition hover:-translate-y-1 hover:border-orange-500/60"
            >
              <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-400">
                Distribution
              </p>

              <h3 className="mt-3 text-3xl font-black">
                Prepare a Release
              </h3>

              <p className="mt-4 leading-7 text-zinc-400">
                Submit release dates, songwriter credits, producer credits and
                distribution information.
              </p>

              <p className="mt-7 font-black text-orange-300">
                Prepare release →
              </p>
            </a>
          </div>

          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-400">
                  Submission History
                </p>

                <h3 className="mt-2 text-3xl font-black">
                  Your Tracks
                </h3>
              </div>
            </div>

            {submissions.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-zinc-700 bg-zinc-950/60 p-10 text-center">
                <p className="text-xl font-bold">No tracks submitted yet</p>

                <p className="mt-3 text-zinc-500">
                  Your mastering and distribution requests will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {submissions.map((submission) => (
                  <article
                    key={submission.id}
                    className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h4 className="text-xl font-black">
                        {submission.song_title}
                      </h4>

                      <p className="mt-1 text-sm text-zinc-500">
                        {submission.artist_name} ·{" "}
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-300">
                      {formatStatus(submission.status)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="mt-12 text-center text-xs leading-5 text-zinc-600">
            Only original music or properly licensed cover recordings may be
            submitted. The artist remains responsible for all required rights,
            credits and permissions.
          </p>
        </div>
      </section>
    </main>
  );
}
