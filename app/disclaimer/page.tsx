import Link from "next/link";

export const metadata = { title: "Audio and AI Disclaimer" };

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#070605] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-orange-300">← Crucible Forge</Link>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-orange-400">Know what the tool can—and cannot—do</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Audio &amp; AI Disclaimer</h1>
        <div className="mt-8 space-y-8 text-sm leading-7 text-white/62 sm:text-base">
          <section><h2 className="text-xl font-black text-white">“Remastered” means processed, not magically repaired.</h2><p className="mt-2">The Quick Forge applies automated tonal balancing, dynamics control, level adjustment, peak protection, and a new 24-bit WAV export. It cannot recover clipped transients, separated stems, lost detail, room acoustics, or performance quality that is absent from the source.</p></section>
          <section><h2 className="text-xl font-black text-white">Results are subjective.</h2><p className="mt-2">A louder waveform is not automatically a better master. Compare at similar listening levels, use trusted headphones or speakers, and check the result on multiple systems before distribution.</p></section>
          <section><h2 className="text-xl font-black text-white">Platform acceptance is not guaranteed.</h2><p className="mt-2">Streaming services, distributors, labels, broadcasters, and manufacturers maintain their own specifications. Crucible Forge does not certify compliance or guarantee approval.</p></section>
          <section><h2 className="text-xl font-black text-white">Keep your original.</h2><p className="mt-2">The browser tool creates a separate file and does not intentionally overwrite your source. You remain responsible for backups, rights clearance, metadata, credits, and final quality control.</p></section>
          <section><h2 className="text-xl font-black text-white">Not professional advice.</h2><p className="mt-2">Product descriptions and automated analysis are not legal, medical, financial, copyright, engineering, or hearing-health advice. Protect your hearing and monitor at safe levels.</p></section>
        </div>
      </article>
    </main>
  );
}
