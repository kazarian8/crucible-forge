"use client";

import Link from "next/link";

export default function MasteringPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-orange-300/20 bg-black/70 p-8 text-center shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
          Crucible Sound Furnace
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          Welcome to the Forge
        </h1>

        <p className="mt-4 leading-7 text-white/60">
          Your account is active. The secure track-upload furnace is ready to
          be built here.
        </p>

        <button
          type="button"
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 font-bold text-black"
        >
          Upload Your Track
        </button>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-orange-300 hover:text-orange-200"
        >
          Return to Crucible Forge
        </Link>
      </section>
    </main>
  );
}
