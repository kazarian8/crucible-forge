import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20 px-5 py-8 text-sm text-white/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Crucible Forge. Creator-first tools with transparent billing, rights, and verification.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal and trust">
          <Link href="/trust" className="hover:text-white">Trust Center</Link>
          <Link href="/legal/terms" className="hover:text-white">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/legal/community" className="hover:text-white">Community</Link>
          <Link href="/legal/copyright" className="hover:text-white">Copyright / DMCA</Link>
          <Link href="/disclaimer" className="hover:text-white">Audio & AI Disclaimer</Link>
        </nav>
      </div>
    </footer>
  );
}
