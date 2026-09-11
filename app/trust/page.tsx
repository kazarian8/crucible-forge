import Link from "next/link";

export const metadata = {
  title: "Trust Center",
  description: "How Crucible approaches creator ownership, billing, privacy, verification, security, and promotion transparency.",
};

const trustItems = [
  {
    title: "Creator ownership",
    body: "Artists keep ownership of the work they own. Uploading a track gives Crucible only the permissions needed to provide the feature the artist requested. Crucible does not claim ownership merely because it mastered, analyzed, hosted, or promoted a track.",
  },
  {
    title: "Transparent pricing",
    body: "Paid actions should show their price before execution. Failed processing should not leave a permanent charge, and retries must not create duplicate charges or duplicate credit grants.",
  },
  {
    title: "Honest CrucibleStar results",
    body: "Star scores, DNA reports, mastering measurements, and recommendations describe technical or editorial analysis. They are not guarantees of artistic quality, streams, royalties, label acceptance, or commercial success.",
  },
  {
    title: "Promotion without fake promises",
    body: "Crucible promotion is limited to the service shown at checkout. Crucible does not promise streams, followers, chart positions, label interest, or placement on playlists it does not own or control.",
  },
  {
    title: "Privacy by design",
    body: "Crucible should collect only information reasonably needed to operate, secure, bill, improve, and support the service. Privileged credentials stay server-side, and access to user data should follow least-privilege controls.",
  },
  {
    title: "Security is continuous",
    body: "Authentication protections, dependency scanning, access controls, rate limits, backups, vendor advisories, and incident response are ongoing product responsibilities rather than one-time launch tasks.",
  },
  {
    title: "No dark patterns",
    body: "Crucible should not rely on hidden recurring charges, fake urgency, preselected paid upgrades, confusing cancellation, intentionally difficult deletion, or deceptive consent controls.",
  },
  {
    title: "Make customers whole",
    body: "When Crucible causes a billing, credit, or processing error, the goal is to stop repeated harm, restore the affected value when appropriate, preserve an audit trail, and fix the underlying defect.",
  },
];

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen bg-[#070605] px-5 py-12 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-orange-300">← Crucible Forge</Link>

        <div className="mt-10 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Trust Center</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Built to earn creator trust.</h1>
          <p className="mt-5 text-base leading-7 text-white/65 sm:text-lg">
            These are the standards Crucible is building around ownership, billing, privacy, security, verification, promotion, and recovery when something goes wrong.
          </p>
        </div>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          {trustItems.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-black">{item.title}</h2>
              <p className="mt-3 leading-7 text-white/65">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-orange-400/25 bg-orange-400/[0.07] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Legal and creator-rights policies</h2>
          <p className="mt-3 max-w-3xl leading-7 text-white/65">
            The public policies below explain the rules in more detail. They are part of the launch legal package and should receive qualified legal review before unrestricted public launch.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/legal/terms" className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10">Terms of Service</Link>
            <Link href="/legal/privacy" className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10">Privacy Policy</Link>
            <Link href="/legal/community" className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10">Community Guidelines</Link>
            <Link href="/legal/copyright" className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10">Copyright / DMCA</Link>
            <Link href="/disclaimer" className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10">Audio & AI Disclaimer</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
