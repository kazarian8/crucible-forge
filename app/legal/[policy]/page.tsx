import { notFound } from "next/navigation";
import { LEGAL_EFFECTIVE_DATE, legalPolicies } from "@/lib/legal/launch-policies";

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(legalPolicies).map((policy) => ({ policy }));
}

type PolicyKey = keyof typeof legalPolicies;

export default async function LegalPolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  if (!(policy in legalPolicies)) notFound();
  const item = legalPolicies[policy as PolicyKey];

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12 sm:px-8">
      <a href="/" className="text-sm font-semibold opacity-70 hover:opacity-100">← Crucible</a>
      <h1 className="mt-8 text-3xl font-black tracking-tight sm:text-4xl">{item.title}</h1>
      <p className="mt-2 text-sm opacity-60">Effective {LEGAL_EFFECTIVE_DATE}</p>
      <div className="mt-10 space-y-8">
        {item.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-lg font-bold">{heading}</h2>
            <p className="mt-2 leading-7 opacity-80">{body}</p>
          </section>
        ))}
      </div>
      <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t pt-6 text-sm opacity-70" aria-label="Legal policies">
        <a href="/legal/terms">Terms</a>
        <a href="/legal/privacy">Privacy</a>
        <a href="/legal/community">Community Guidelines</a>
        <a href="/legal/copyright">Copyright / DMCA</a>
      </nav>
    </main>
  );
}
