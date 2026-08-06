import Link from "next/link";

export const metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070605] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-orange-300">← Crucible Forge</Link>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-orange-400">Effective August 6, 2026</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Terms of Use</h1>
        <div className="mt-8 space-y-8 text-sm leading-7 text-white/62 sm:text-base">
          <section><h2 className="text-xl font-black text-white">1. The service</h2><p className="mt-2">Crucible Forge provides browser-based audio analysis and automated mastering tools. Features may change, be limited, or be withdrawn while the service is being improved.</p></section>
          <section><h2 className="text-xl font-black text-white">2. Your content and rights</h2><p className="mt-2">You keep ownership of your recordings. You may only process material you own or have permission to use. Do not submit unlawful, infringing, malicious, or privacy-invasive material.</p></section>
          <section><h2 className="text-xl font-black text-white">3. Automated results</h2><p className="mt-2">Automated mastering is a creative tool, not a promise of commercial acceptance, restoration, chart performance, loudness-platform compliance, or error-free output. Listen critically and keep your original files and backups.</p></section>
          <section><h2 className="text-xl font-black text-white">4. Accounts and security</h2><p className="mt-2">You are responsible for accurate account information and for protecting your sign-in credentials. Do not probe, disrupt, scrape, reverse engineer, or bypass service limits or security controls.</p></section>
          <section><h2 className="text-xl font-black text-white">5. Purchases</h2><p className="mt-2">If paid plans become available, the price, renewal period, trial terms, credit rules, and refund terms shown at checkout control that purchase. Charges are not activated merely by creating an account.</p></section>
          <section><h2 className="text-xl font-black text-white">6. Availability and liability</h2><p className="mt-2">The service is provided “as is” and “as available” to the extent permitted by law. Crucible Forge is not liable for lost source files, lost profits, release delays, or indirect or consequential damages. Nothing here removes rights that cannot legally be waived.</p></section>
          <section><h2 className="text-xl font-black text-white">7. Suspension and changes</h2><p className="mt-2">Access may be suspended for abuse, security risk, nonpayment, or violation of these terms. Material changes will be posted with a new effective date.</p></section>
          <section><h2 className="text-xl font-black text-white">8. Contact</h2><p className="mt-2">Questions or legal notices can be submitted through the <Link href="/contact" className="text-orange-300 underline">contact page</Link>.</p></section>
        </div>
      </article>
    </main>
  );
}
