"use client";

import { FormEvent, useState } from "react";

export default function GetStartedPage() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/xpqvzanj", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#07090d] px-5 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <a
          href="/"
          className="mb-10 inline-block text-sm text-white/60 transition hover:text-white"
        >
          ← Back to Crucible
        </a>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
          Start a project
        </p>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Build with Crucible
        </h1>

        <p className="mt-6 text-lg leading-8 text-white/65">
          Tell us what you are building, what problem you need solved, and what
          success looks like.
        </p>

        {status === "success" ? (
          <section className="mt-12 rounded-2xl border border-green-400/30 bg-green-400/10 p-8">
            <h2 className="text-2xl font-semibold">Request received.</h2>

            <p className="mt-3 text-white/70">
              Your project request was sent successfully. Crucible will be in
              touch shortly.
            </p>

            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-6 rounded-xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Submit another request
            </button>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-12 space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
          >
            <input
              type="hidden"
              name="_subject"
              value="New Crucible Project Request"
            />

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-[#0d1016] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#0d1016] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Company or project
              </label>

              <input
                id="company"
                name="company"
                type="text"
                placeholder="Optional"
                className="w-full rounded-xl border border-white/10 bg-[#0d1016] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="service"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                What do you need?
              </label>

              <select
                id="service"
                name="service"
                required
                defaultValue=""
                className="w-full rounded-xl border border-white/10 bg-[#0d1016] px-4 py-3 text-white outline-none transition focus:border-orange-400"
              >
                <option value="" disabled>
                  Select a service
                </option>
                <option value="AI integration">AI integration</option>
                <option value="Website or application">
                  Website or application
                </option>
                <option value="Automation">Automation</option>
                <option value="Private data and searchable knowledge">
                  Private data and searchable knowledge
                </option>
                <option value="Custom software">Custom software</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="details"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Project details
              </label>

              <textarea
                id="details"
                name="details"
                required
                rows={6}
                placeholder="Describe your project, goals, problem, and deadline."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1016] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="budget"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Estimated budget
              </label>

              <select
                id="budget"
                name="budget"
                required
                defaultValue=""
                className="w-full rounded-xl border border-white/10 bg-[#0d1016] px-4 py-3 text-white outline-none transition focus:border-orange-400"
              >
                <option value="" disabled>
                  Select a range
                </option>
                <option value="Under $1,000">Under $1,000</option>
                <option value="$1,000–$5,000">$1,000–$5,000</option>
                <option value="$5,000–$15,000">$5,000–$15,000</option>
                <option value="$15,000+">$15,000+</option>
                <option value="Not sure yet">Not sure yet</option>
              </select>
            </div>

            {status === "error" && (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
                The request could not be sent. Check your connection and try
                again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-xl bg-orange-500 px-6 py-4 font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending"
                ? "Sending request..."
                : "Submit project request"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
