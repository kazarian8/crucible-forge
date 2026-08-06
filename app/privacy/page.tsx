import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#070605] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-orange-300">← Crucible Forge</Link>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-orange-400">Effective August 6, 2026</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Privacy Policy</h1>
        <div className="mt-8 space-y-8 text-sm leading-7 text-white/62 sm:text-base">
          <section><h2 className="text-xl font-black text-white">Plain-language summary</h2><p className="mt-2">The current Quick Forge analyzes and processes audio inside your browser. Crucible Forge does not upload that audio to its servers. Your browser creates the downloadable master locally.</p></section>
          <section><h2 className="text-xl font-black text-white">Information collected</h2><p className="mt-2">Account features may collect your email address, authentication records, account identifiers, and basic service activity. Contact requests contain the information you choose to provide. Hosting and security systems may record IP address, browser details, timestamps, requested routes, and error data.</p></section>
          <section><h2 className="text-xl font-black text-white">How information is used</h2><p className="mt-2">Information is used to authenticate users, provide requested features, prevent abuse, diagnose failures, respond to requests, meet legal obligations, and improve reliability. Crucible Forge does not sell personal information.</p></section>
          <section><h2 className="text-xl font-black text-white">Processors</h2><p className="mt-2">Vercel provides application hosting and security. Supabase provides authentication and database services. If payments are enabled, Stripe processes payment details; Crucible Forge does not receive complete card numbers.</p></section>
          <section><h2 className="text-xl font-black text-white">Retention and security</h2><p className="mt-2">Browser-local audio disappears from the service when you close or refresh the page, although downloaded files remain on your device. Account, transaction, security, and support records are retained only as needed for the service, fraud prevention, accounting, disputes, and legal requirements. Reasonable safeguards are used, but no internet service can guarantee absolute security.</p></section>
          <section><h2 className="text-xl font-black text-white">Your choices</h2><p className="mt-2">You may request access, correction, or deletion of personal information, subject to identity verification and required record retention. Browser and device controls manage locally stored files and cookies.</p></section>
          <section><h2 className="text-xl font-black text-white">Contact</h2><p className="mt-2">Submit privacy questions or requests through the <Link href="/contact" className="text-orange-300 underline">contact page</Link>. The policy will be updated before any materially different audio-storage practice is launched.</p></section>
        </div>
      </article>
    </main>
  );
}
