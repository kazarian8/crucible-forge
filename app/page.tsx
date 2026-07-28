"use client";

const creatorTools = [
  { icon: "♫", label: "Music\nMastering" },
  { icon: "▣", label: "AI Video\nTools" },
  { icon: "</>", label: "Code\nFurnace" },
  { icon: "◉", label: "Artwork\nForge" },
  { icon: "◍", label: "Song\nStarter" },
];

const platforms = [
  { name: "Spotify", slug: "spotify", href: "https://open.spotify.com/" },
  { name: "Apple Music", slug: "applemusic", href: "https://music.apple.com/" },
  { name: "YouTube", slug: "youtube", href: "https://www.youtube.com/" },
  { name: "TikTok", slug: "tiktok", href: "https://www.tiktok.com/" },
  { name: "Instagram", slug: "instagram", href: "https://www.instagram.com/" },
  { name: "Facebook", slug: "facebook", href: "https://www.facebook.com/" },
  { name: "Amazon Music", slug: "amazonmusic", href: "https://music.amazon.com/" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070707] text-white">
      <style jsx global>{`
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          background: #070707;
        }

        body {
          margin: 0;
          background:
            radial-gradient(circle at 50% 8%, rgba(255, 77, 0, 0.08), transparent 24rem),
            #070707;
          color: white;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .display-font {
          font-family: Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Narrow", sans-serif;
          letter-spacing: 0.01em;
        }

        @keyframes offerGlow {
          0%, 100% {
            box-shadow: 0 0 0 rgba(255, 78, 0, 0);
          }
          50% {
            box-shadow: 0 0 36px rgba(255, 78, 0, 0.16);
          }
        }

        @keyframes distroGlow {
          0%, 100% {
            box-shadow: 0 0 0 1px rgba(174, 255, 36, 0.4), 0 0 20px rgba(174, 255, 36, 0.08);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(174, 255, 36, 0.9), 0 0 34px rgba(174, 255, 36, 0.2);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[820px] px-4 pb-12 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-3">
          <a href="/" className="flex min-w-0 items-center gap-3" aria-label="Crucible home">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center text-4xl">
              🔥⚒
            </div>

            <div className="min-w-0">
              <div className="text-[1.9rem] font-black tracking-[0.08em] text-white sm:text-[2.15rem]">
                CRUCIBLE
              </div>
              <div className="mt-0.5 text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#ff4b00] sm:text-xs">
                Refine. Repair. Reforge.
              </div>
            </div>
          </a>

          <a
            href="/login"
            className="shrink-0 rounded-full border border-white/45 px-5 py-3 text-sm font-black text-white transition hover:border-[#ff4b00] hover:text-[#ff4b00]"
          >
            Log in
          </a>
        </header>

        <section
          className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/85 px-5 py-7 sm:px-8 sm:py-9"
          style={{ animation: "offerGlow 2.2s ease-in-out infinite" }}
        >
          <div className="text-center">
            <span className="inline-flex rounded-full border border-[#ff4b00] bg-[#ff4b00]/10 px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.12em] text-[#ff4b00]">
              Limited Time Offer
            </span>

            <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl">
              Sign Up &amp; Get
              <span className="display-font mt-2 block text-[3.3rem] uppercase leading-none text-[#ff4b00] sm:text-[5.2rem]">
                1 Month Free
              </span>
            </h1>

            <div className="mx-auto mt-5 h-[3px] w-4/5 bg-gradient-to-r from-transparent via-[#ff4b00] to-transparent" />
          </div>

          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-stretch gap-4">
            <div className="text-center">
              <div className="text-3xl">🎁</div>
              <div className="display-font mt-2 text-4xl uppercase leading-none sm:text-5xl">
                5,000
              </div>
              <div className="mt-1 text-2xl font-black">Points</div>
              <p className="mx-auto mt-3 max-w-[11rem] text-xs leading-5 text-white/55 sm:text-sm">
                Instantly added to your account
              </p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="h-full w-px bg-white/15" />
              <div className="-my-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-[#111] text-xl text-white/70">
                +
              </div>
              <div className="h-full w-px bg-white/15" />
            </div>

            <div className="text-center">
              <div className="text-3xl">🏆</div>
              <div className="mt-2 text-2xl font-black leading-tight">Enter to Win</div>
              <div className="mt-2 text-base font-black leading-6 text-[#ff4b00] sm:text-lg">
                Full Album Remaster
                <br />
                + Distribution
              </div>
              <p className="mx-auto mt-3 max-w-[12rem] text-xs leading-5 text-white/55 sm:text-sm">
                To 40+ major platforms
                <br />
                Random winner
              </p>
            </div>
          </div>

          <a
            href="/signup?plan=premium-trial"
            className="mt-8 flex min-h-16 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff3d00] via-[#ff5a00] to-[#ff3d00] px-6 text-center text-base font-black uppercase tracking-[0.02em] text-white shadow-[0_16px_38px_rgba(255,77,0,.25)] transition hover:scale-[1.01] hover:brightness-110 sm:text-lg"
          >
            Sign Up — Get 1 Month Free
            <span className="ml-3 text-2xl">→</span>
          </a>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.7rem] font-bold text-white/55 sm:text-xs">
            <span>🛡️ $0 today</span>
            <span className="text-white/20">|</span>
            <span>Then $19.99/month</span>
            <span className="text-white/20">|</span>
            <span>Cancel anytime</span>
          </div>

          <p className="mt-4 text-center text-xs font-semibold text-white/45">
            🔒 Secure. Private. No spam.
          </p>
        </section>

        <section className="mt-4 rounded-[1.75rem] border border-white/15 bg-[#0b0b0b] px-4 py-6 sm:px-7">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-[#ff4b00]">
            Built for creators
          </p>

          <h2 className="mt-3 text-center text-3xl font-black leading-tight sm:text-4xl">
            One Private Furnace.
            <br />
            Everything You Need.
          </h2>

          <div className="mt-7 grid grid-cols-5 divide-x divide-white/10">
            {creatorTools.map((tool) => (
              <div key={tool.label} className="px-1 text-center sm:px-3">
                <div className="display-font text-2xl text-[#ff4b00] sm:text-3xl">{tool.icon}</div>
                <p className="mt-2 whitespace-pre-line text-[0.62rem] font-bold leading-4 text-white/80 sm:text-xs">
                  {tool.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <a
          href="https://distrokid.com/student/12343575"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-4 block overflow-hidden rounded-[1.75rem] border border-[#b6ff2b] bg-gradient-to-br from-[#161616] to-[#090909] p-5 transition hover:-translate-y-0.5 sm:p-7"
          style={{ animation: "distroGlow 1.9s ease-in-out infinite" }}
          aria-label="Release music with DistroKid"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#baff3c] text-3xl">
              🦖
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#baff3c]">
                DistroKid Partner
              </p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
                Get Your Music Everywhere
              </h2>
              <p className="mt-2 text-sm font-semibold text-white/55 sm:text-base">
                Release to 40+ platforms including:
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {platforms.map((platform) => (
              <span
                key={platform.name}
                title={platform.name}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5"
              >
                <img
                  src={`https://cdn.simpleicons.org/${platform.slug}`}
                  alt={platform.name}
                  className="h-7 w-7 object-contain"
                  loading="lazy"
                />
              </span>
            ))}
            <span className="shrink-0 text-sm font-black text-white/60">+ many more</span>
          </div>

          <div className="mt-6 flex min-h-12 items-center justify-center rounded-full border border-[#baff3c] px-5 text-center text-sm font-black uppercase tracking-[0.08em] text-[#baff3c]">
            Get DistroKid Access ↗
          </div>
        </a>

        <section className="mt-4 rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] px-5 py-7 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff4b00]">
            Everything enters raw
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight">
            Everything leaves reforged.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55">
            Private creative tools for music, video prompts, code repair, artwork, release preparation, and direct creator guidance.
          </p>
        </section>
      </div>
    </main>
  );
}
