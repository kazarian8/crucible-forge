"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#080604] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
            Crucible Forge
          </p>

          <p className="text-[10px] text-white/35">
            Contact Justice
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/studio")}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Back to studio
        </button>
      </header>

      <section className="px-5 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
              Book Justice
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
              Start a project
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
              Tell me what you need help creating, refining, designing, or
              producing.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href="tel:+14154841799"
              className="flex items-center justify-center rounded-full border border-orange-300/25 bg-orange-400/10 px-6 py-4 font-semibold text-orange-100 transition hover:bg-orange-400/15"
            >
              Call Justice
            </a>

            <a
              href="sms:+14154841799"
              className="flex items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 font-semibold text-black transition hover:brightness-110"
            >
              Text Justice
            </a>
          </div>

          <p className="mt-3 text-center text-xs text-white/30">
            Your phone may show the business number after you tap.
          </p>

          <div className="mt-8 rounded-[2rem] border border-orange-300/20 bg-black/35 p-5 shadow-[0_30px_100px_rgba(0,0,0,.5)] md:p-8">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Your name
                  </label>

                  <input
                    required
                    name="name"
                    type="text"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-orange-300/40"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Email
                  </label>

                  <input
                    required
                    name="email"
                    type="email"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-orange-300/40"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Service
                  </label>

                  <select
                    name="service"
                    className="w-full rounded-2xl border border-white/10 bg-[#120c08] px-4 py-3 text-white outline-none focus:border-orange-300/40"
                    defaultValue="Mastering"
                  >
                    <option>Mastering</option>
                    <option>Custom Production</option>
                    <option>AI Music Video</option>
                    <option>Artwork</option>
                    <option>Rap Training</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Project details
                  </label>

                  <textarea
                    required
                    name="message"
                    rows={6}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-orange-300/40"
                    placeholder="Tell Justice what you want to create..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 font-semibold text-black transition hover:brightness-110"
                >
                  Prepare inquiry
                </button>

                <p className="text-center text-xs leading-5 text-white/35">
                  This form does not send yet. Call and text are working now.
                  We can connect the written form to Formspree next.
                </p>
              </form>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-orange-300/20 bg-orange-400/10 text-3xl text-orange-100">
                  ✓
                </div>

                <h2 className="mt-6 text-3xl font-semibold">
                  Inquiry prepared
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/50">
                  The form is working visually, but it is not connected to send
                  messages yet. Use the call or text buttons to reach Justice
                  directly.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-7 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Start another inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
