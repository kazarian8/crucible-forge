"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

type Vault = {
  id: string;
  vault_number: string;
  legal_name: string;
  legal_name_verified: boolean;
  artist_name: string | null;
  street_address: string | null;
  apartment: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  address_on_file: boolean;
  business_name: string | null;
  business_type: string;
  identity_status: string;
  identity_verified_at: string | null;
  declaration_accepted_at: string | null;
  created_at: string;
  unlocked: boolean;
};

type Defaults = {
  legal_name: string;
  artist_name: string;
  street_address: string;
  apartment: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

const emptyDefaults: Defaults = {
  legal_name: "",
  artist_name: "",
  street_address: "",
  apartment: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
};

export default function OwnerVaultPage() {
  const [vault, setVault] = useState<Vault | null>(null);
  const [form, setForm] = useState<Defaults>(emptyDefaults);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("individual");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [vaultKey, setVaultKey] = useState("");
  const [oneTimeKey, setOneTimeKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/owner-vault", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || "Owner Vault could not be opened."));
      setVault((data.vault ?? null) as Vault | null);
      if (data.defaults) setForm({ ...emptyDefaults, ...(data.defaults as Defaults) });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Owner Vault could not be opened.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateField(field: keyof Defaults, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createVault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Creating your private Owner Vault…");
    try {
      const response = await fetch("/api/owner-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ...form,
          business_name: businessName,
          business_type: businessType,
          declaration_accepted: declarationAccepted,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || "Owner Vault could not be created."));
      setVault(data.vault as Vault);
      setOneTimeKey(String(data.access_secret || ""));
      setMessage(data.created ? "Owner Vault created. Save your vault key before continuing." : "Owner Vault updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Owner Vault could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function startIdentity() {
    setBusy(true);
    setMessage("Starting secure identity verification…");
    try {
      const response = await fetch("/api/owner-vault/identity/start", {
        method: "POST",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || "Identity verification could not be started."));
      if (data.verified) {
        setMessage("Identity is already verified.");
        await load();
        return;
      }
      if (!data.url) throw new Error("Identity verification did not return a secure link.");
      window.location.assign(String(data.url));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Identity verification could not be started.");
      setBusy(false);
    }
  }

  async function unlockVault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Unlocking your Owner Vault…");
    try {
      const response = await fetch("/api/owner-vault/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ key: vaultKey }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || "Owner Vault could not be unlocked."));
      setVaultKey("");
      await load();
      setMessage("Owner Vault unlocked for this secure session.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Owner Vault could not be unlocked.");
    } finally {
      setBusy(false);
    }
  }

  async function lockVault() {
    setBusy(true);
    try {
      await fetch("/api/owner-vault/unlock", { method: "DELETE", cache: "no-store" });
      await load();
      setMessage("Owner Vault locked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] pb-28 text-white">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link href="/star" className="inline-flex items-center gap-2 text-xs font-black text-sky-200/70">
              <ArrowLeft size={14} /> CrucibleStar
            </Link>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">Protect Your Work</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Owner Vault</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Keep ownership records, legal identity details, business information and supporting documents tied to one private CrucibleStar vault.
            </p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
            <ShieldCheck size={27} />
          </div>
        </header>

        {message ? <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70" aria-live="polite">{message}</p> : null}

        {loading ? (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">Opening your secure Owner Vault…</section>
        ) : !vault ? (
          <form onSubmit={createVault} className="mt-6 space-y-5 rounded-3xl border border-sky-300/15 bg-[#091018] p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-black">Create your vault</h2>
              <p className="mt-1 text-sm leading-6 text-white/45">Use your real legal information. Identity verification happens before the vault can be unlocked.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Legal name" value={form.legal_name} onChange={(value) => updateField("legal_name", value)} required />
              <Field label="Artist name" value={form.artist_name} onChange={(value) => updateField("artist_name", value)} />
              <Field label="Street address" value={form.street_address} onChange={(value) => updateField("street_address", value)} required />
              <Field label="Apartment / unit" value={form.apartment} onChange={(value) => updateField("apartment", value)} />
              <Field label="City" value={form.city} onChange={(value) => updateField("city", value)} required />
              <Field label="State / region" value={form.state} onChange={(value) => updateField("state", value)} required />
              <Field label="Postal code" value={form.postal_code} onChange={(value) => updateField("postal_code", value)} required />
              <Field label="Country" value={form.country} onChange={(value) => updateField("country", value)} required />
              <Field label="Business name" value={businessName} onChange={setBusinessName} />
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-white/45">Business type</span>
                <select value={businessType} onChange={(event) => setBusinessType(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-sky-300/40">
                  <option value="individual">Individual</option>
                  <option value="sole_proprietor">Sole proprietor</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/65">
              <input type="checkbox" checked={declarationAccepted} onChange={(event) => setDeclarationAccepted(event.target.checked)} className="mt-1" />
              <span>I confirm this information belongs to me and I am creating this vault to organize and protect records for work I own or am authorized to manage.</span>
            </label>

            <button type="submit" disabled={busy || !declarationAccepted} className="w-full rounded-2xl bg-sky-300 px-5 py-3.5 font-black text-slate-950 disabled:opacity-50">
              {busy ? "Creating secure vault…" : "Create Owner Vault"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <section className="rounded-3xl border border-sky-300/15 bg-[#091018] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">Vault number</p>
                  <h2 className="mt-1 text-2xl font-black">{vault.vault_number}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${vault.unlocked ? "bg-emerald-400/15 text-emerald-200" : "bg-white/5 text-white/55"}`}>
                  {vault.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatusCard label="Identity" value={vault.identity_status === "verified" ? "Verified" : vault.identity_status || "Not started"} good={vault.identity_status === "verified"} />
                <StatusCard label="Legal name" value={vault.legal_name_verified ? "Verified" : "Pending"} good={vault.legal_name_verified} />
                <StatusCard label="Address" value={vault.address_on_file ? "On file" : "Missing"} good={vault.address_on_file} />
              </div>
            </section>

            {oneTimeKey ? (
              <section className="rounded-3xl border border-amber-300/25 bg-amber-300/10 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-amber-200"><KeyRound size={19} /><h3 className="font-black">Save this vault key now</h3></div>
                <p className="mt-2 text-sm leading-6 text-amber-50/65">This key is shown once. Crucible stores only its hash, so keep your copy somewhere secure.</p>
                <code className="mt-4 block break-all rounded-2xl bg-black/40 p-4 text-xs text-amber-100">{oneTimeKey}</code>
              </section>
            ) : null}

            {vault.identity_status !== "verified" || !vault.legal_name_verified ? (
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex items-center gap-2"><BadgeCheck size={19} className="text-sky-300" /><h3 className="font-black">Verify the vault owner</h3></div>
                <p className="mt-2 text-sm leading-6 text-white/50">Complete secure identity verification before this vault can be unlocked.</p>
                <button type="button" onClick={() => void startIdentity()} disabled={busy} className="mt-4 rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">
                  {busy ? "Opening verification…" : "Verify Identity"}
                </button>
              </section>
            ) : vault.unlocked ? (
              <section className="rounded-3xl border border-emerald-300/15 bg-emerald-400/[0.06] p-5 sm:p-6">
                <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-emerald-300" /><h3 className="font-black">Vault unlocked</h3></div>
                <p className="mt-2 text-sm leading-6 text-white/50">Your secure vault session is active. Sensitive owner details are available only during an unlocked session.</p>
                <button type="button" onClick={() => void lockVault()} disabled={busy} className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black">Lock Vault</button>
              </section>
            ) : (
              <form onSubmit={unlockVault} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex items-center gap-2"><LockKeyhole size={19} className="text-sky-300" /><h3 className="font-black">Unlock Owner Vault</h3></div>
                <p className="mt-2 text-sm leading-6 text-white/50">Enter the one-time vault key you saved when this vault was created.</p>
                <input type="password" value={vaultKey} onChange={(event) => setVaultKey(event.target.value)} placeholder="cvv_live_…" autoComplete="off" className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-sky-300/40" />
                <button type="submit" disabled={busy || !vaultKey} className="mt-3 w-full rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Unlock Vault</button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wider text-white/45">{label}</span>
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-sky-300/40" />
    </label>
  );
}

function StatusCard({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/35">{label}</p>
      <p className={`mt-1 text-sm font-black ${good ? "text-emerald-200" : "text-white/65"}`}>{value}</p>
    </div>
  );
}
