"use client";

import Image from "next/image";
import Link from "next/link";


const furnaces = [
  {
    icon: "sound",
    title: "Sound Furnace",
    description:
      "Master, enhance, and transform your audio to an industry-ready standard.",
    href: "/app/mastering",
    active: true,
  },
  {
    icon: "prompt",
    title: "Prompt Reforge",
    description:
      "Reverse any video into a production-ready recreation prompt.",
    href: "/studio",
    active: true,
  },
  {
    icon: "code",
    title: "Code Furnace",
    description:
      "Refine, repair, validate, and harden your code. Clean. Validate. Deploy.",
    href: "/studio",
    active: true,
  },
  {
    icon: "image",
    title: "Image Restoration",
    description:
      "Restore, enhance, and bring old or damaged images back to life.",
    href: "#",
    active: false,
  },
  {
    icon: "artifact",
    title: "Antiquities Restoration",
    description:
      "Preserve history. Restore artifacts and ancient treasures.",
    href: "#",
    active: false,
  },
];

function FurnaceIcon({ type }: { type: string }) {
  const common = {
    width: 54,
    height: 54,
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (type === "sound") {
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16 32h5m3-9v18m6-25v32m6-22v12m6-19v26m6-13h5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "prompt") {
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 23l10 9-10 9m15 0h11"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "code") {
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="2" />
        <path
          d="M25 19c-5 0-6 4-6 8v2c0 3-2 4-5 4 3 0 5 2 5 5v1c0 5 1 8 6 8m14-28c5 0 6 4 6 8v2c0 3 2 4 5 4-3 0-5 2-5 5v1c0 5-1 8-6 8"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "image") {
    return (
      <svg {...common}>
        <path
          d="M12 16h40v32H12z"
          stroke="currentColor"
          strokeWidth="2.5"
          rx="4"
        />
        <circle cx="25" cy="27" r="4" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M16 44l12-11 8 7 6-6 8 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        d="M20 18h24l-3 7v25H23V25l-3-7Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M27 25h10M28 50V29m8 21V29" stroke="currentColor" strokeWidth="2.5" />
      <path d="M18 54h28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: "secure" | "fast" | "powerful" | "private" }) {
  if (type === "fast") return <span className="feature-glyph">ϟ</span>;
  if (type === "powerful") return <span className="feature-glyph">✓</span>;
  if (type === "private") return <span className="feature-glyph">▣</span>;
  return <span className="feature-glyph">◈</span>;
}

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="nav-wrap">
          <Link href="/" className="brand" aria-label="Crucible home">
            <Image
              src="/crucible-logo.png"
              alt="Crucible molten logo"
              width={58}
              height={58}
              className="brand-logo"
              priority
            />
            <div>
              <span className="brand-name">CRUCIBLE</span>
              <span className="brand-tag">REFINE. REPAIR. REFORGE.</span>
            </div>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#furnaces">Furnaces</a>
            <a href="#pricing">Pricing</a>
            <a href="#affiliates">Affiliates</a>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>

          <div className="nav-actions">
            <Link href="/login" className="btn btn-ghost">
              Sign In
            </Link>
            <Link href="/signup" className="btn btn-fire small mobile-signup">
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-copy">
          <div className="hero-banner">🔥 AI FOR CREATORS • RESTORE • REPAIR • REFORGE</div>
          <p className="eyebrow">THE AI CREATIVE FURNACE</p>
          <h1>
            Everything
            <br />
            enters <span>raw.</span>
            <br />
            Everything
            <br />
            leaves <span>reforged.</span>
          </h1>

          <p className="hero-subtitle">
            One platform. Infinite AI furnaces. Master music, restore photos,
            repair code, reverse engineer videos, and create faster with AI.
          </p>

          <div className="hero-action-row">
            <Link href="/signup" className="btn btn-fire hero-cta">
              Sign Up — Start Free
            </Link>
            <Link href="/login" className="btn btn-ghost hero-login">
              Already a Member? Sign In
            </Link>
          </div>

          <div className="feature-row" aria-label="Product benefits">
            {[
              ["secure", "Secure"],
              ["fast", "Fast"],
              ["powerful", "Powerful"],
              ["private", "Private"],
            ].map(([type, label]) => (
              <div className="feature" key={label}>
                <FeatureIcon type={type as "secure" | "fast" | "powerful" | "private"} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <p className="pricing-note" id="pricing">
            $0 today • Payment method required
            <br />
            Then <strong>$19.99/month</strong> after 30 days unless canceled.
          </p>

          <div className="trust-block" id="affiliates">
            <p>TRUSTED CREATIVE TOOLS &amp; PARTNERS</p>
            <div className="partner-row">
              <span>CapCut</span>
              <span>Sora</span>
              <span>Veo</span>
              <span>Kling AI</span>
              <span>Runway</span>
              <a
                href="https://distrokid.com/student/12343575"
                target="_blank"
                rel="noopener noreferrer"
              >
                DistroKid ↗
              </a>
            </div>
          </div>
        </div>

        <div className="hero-art" aria-label="Crucible furnace showcase">
          <div className="showcase-glow" />
          <div className="forge-showcase">
            <div className="showcase-topline">
              <span className="live-dot" />
              THE FORGE IS LIT
            </div>

            <div className="showcase-core">
              <div className="showcase-icon">
                <FurnaceIcon type="sound" />
              </div>
              <div>
                <p className="showcase-kicker">NOW FORGING</p>
                <h2>Sound Furnace</h2>
                <p>Turn raw recordings into clean, powerful, release-ready audio.</p>
              </div>
            </div>

            <div className="showcase-list">
              <div className="showcase-item active">
                <FurnaceIcon type="sound" />
                <span>Sound Furnace</span>
              </div>
              <div className="showcase-item">
                <FurnaceIcon type="prompt" />
                <span>Prompt Reforge</span>
              </div>
              <div className="showcase-item">
                <FurnaceIcon type="code" />
                <span>Code Furnace</span>
              </div>
            </div>

            <div className="showcase-output">
              <span>RAW INPUT</span>
              <div className="molten-line" />
              <strong>REFORGED OUTPUT</strong>
            </div>
          </div>
          <div className="ember ember-1" />
          <div className="ember ember-2" />
          <div className="ember ember-3" />
        </div>
      </section>

      <section className="furnace-section" id="furnaces">
        <div className="section-heading">
          <p>ONE CRUCIBLE. MANY POWERFUL FURNACES.</p>
          <h2>Choose Your Furnace</h2>
        </div>

        <div className="furnace-grid">
          {furnaces.map((furnace) => (
            <article
              className={`furnace-card ${furnace.active ? "active" : "inactive"}`}
              key={furnace.title}
            >
              <div className="card-icon">
                <FurnaceIcon type={furnace.icon} />
              </div>
              <h3>{furnace.title}</h3>
              <p>{furnace.description}</p>

              {furnace.active ? (
                <Link href={furnace.href} className="card-button">
                  Launch
                </Link>
              ) : (
                <span className="card-button disabled">Coming Soon</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="workflow">
        <div className="workflow-panel">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-icon">↑</div>
              <strong>1. Input</strong>
              <p>Upload or paste your raw content.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-icon">◆</div>
              <strong>2. Reforge</strong>
              <p>Our AI furnace refines and repairs.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-icon">✓</div>
              <strong>3. Output</strong>
              <p>Download your reforged result.</p>
            </div>
          </div>
        </div>

        <div className="complete-panel">
          <div>
            <p className="complete-kicker">REFORGING COMPLETE</p>
            <h3>Your output is ready.</h3>
            <ul>
              <li>Refined</li>
              <li>Optimized</li>
              <li>Reforged</li>
            </ul>
          </div>
          <div className="pour-art" aria-hidden="true">
            <span className="pour-bowl" />
            <span className="pour-stream" />
            <span className="pour-pool" />
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <p className="closing-title">Built by creators. For creators.</p>
          <div className="closing-features">
            <span>◈ Your data is yours</span>
            <span>▣ We don&apos;t track you</span>
            <span>ϟ Cancel anytime</span>
          </div>
        </div>

        <div className="closing-action">
          <p>READY TO REFORGE?</p>
          <Link href="/signup" className="btn btn-fire">
            Start Your Free Month
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <Image
            src="/crucible-logo.png"
            alt=""
            width={64}
            height={64}
            className="footer-logo"
          />
          <div>
            <div className="brand-name">CRUCIBLE</div>
            <div className="brand-tag">REFINE. REPAIR. REFORGE.</div>
          </div>
        </div>

        <div className="footer-links">
          <div>
            <strong>Company</strong>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/careers">Careers</Link>
          </div>
          <div>
            <strong>Legal</strong>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
          <div>
            <strong>Resources</strong>
            <Link href="/help">Help Center</Link>
            <Link href="/api">API</Link>
            <Link href="/status">Status</Link>
          </div>
          <div>
            <strong>Follow</strong>
            <a href="#" aria-label="YouTube">YouTube</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="TikTok">TikTok</a>
          </div>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} Crucible Forge. All rights reserved.
        </p>
      </footer>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          scroll-behavior: smooth;
          background: #050505;
        }

        :global(body) {
          margin: 0;
          background:
            radial-gradient(circle at 72% 18%, rgba(255, 83, 0, 0.1), transparent 27rem),
            #050505;
          color: #f7f4ee;
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        :global(a) {
          color: inherit;
          text-decoration: none;
        }

        .site-shell {
          min-height: 100vh;
          overflow: hidden;
          background:
            linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(255, 153, 41, 0.22);
          background: rgba(5, 5, 5, 0.92);
          backdrop-filter: blur(16px);
        }

        .nav-wrap {
          width: min(1180px, calc(100% - 32px));
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .brand-logo,
        .footer-logo {
          object-fit: contain;
          filter: drop-shadow(0 0 13px rgba(255, 111, 0, 0.55));
        }

        .brand-name {
          display: block;
          font-weight: 900;
          font-size: clamp(1.25rem, 2vw, 1.8rem);
          line-height: 1;
          letter-spacing: 0.06em;
          color: #e9aa3a;
        }

        .brand-tag {
          display: block;
          margin-top: 5px;
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #c8841d;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 30px;
          margin-left: auto;
        }

        .desktop-nav a {
          position: relative;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ddd8cf;
        }

        .desktop-nav a::after {
          content: "";
          position: absolute;
          left: 0;
          right: 100%;
          bottom: -8px;
          height: 1px;
          background: #ff7a00;
          transition: right 180ms ease;
        }

        .desktop-nav a:hover::after {
          right: 0;
        }

        .nav-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 23px;
          border-radius: 7px;
          text-transform: uppercase;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            border-color 160ms ease;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn.small {
          min-height: 44px;
          padding-inline: 18px;
          font-size: 0.7rem;
        }

        .btn-ghost {
          border: 1px solid #9b5e12;
          background: rgba(8, 8, 8, 0.7);
        }

        .btn-ghost:hover {
          border-color: #ff8a00;
          box-shadow: 0 0 24px rgba(255, 96, 0, 0.25);
        }

        .btn-fire {
          border: 1px solid #ffc14d;
          color: white;
          background: linear-gradient(180deg, #ff9d13 0%, #e65000 62%, #b43100 100%);
          box-shadow:
            0 0 12px rgba(255, 118, 0, 0.75),
            0 0 34px rgba(255, 64, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.55);
        }

        .btn-fire:hover {
          box-shadow:
            0 0 18px rgba(255, 152, 26, 0.9),
            0 0 44px rgba(255, 64, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .hero {
          position: relative;
          isolation: isolate;
          width: min(1180px, calc(100% - 32px));
          min-height: 650px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          align-items: center;
          gap: 24px;
          padding: 60px 0 42px;
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0 -100vw;
          z-index: -3;
          background:
            radial-gradient(circle at 78% 48%, rgba(255, 92, 0, 0.12), transparent 29rem),
            radial-gradient(circle at 50% 120%, rgba(255, 129, 0, 0.07), transparent 34rem),
            linear-gradient(180deg, #070707 0%, #030303 100%);
          border-bottom: 1px solid rgba(255, 155, 42, 0.15);
        }

        .hero-copy {
          position: relative;
          z-index: 3;
          padding: 18px 0;
        }

        .eyebrow {
          margin: 0 0 18px;
          color: #b97722;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.2em;
        }

        h1 {
          margin: 0;
          max-width: 610px;
          font-size: clamp(3rem, 6.2vw, 5.5rem);
          line-height: 0.93;
          letter-spacing: -0.045em;
          text-transform: uppercase;
          text-shadow: 0 8px 34px rgba(0, 0, 0, 0.7);
        }

        h1 span {
          color: transparent;
          background: linear-gradient(180deg, #ffbd42 0%, #e75b00 58%, #8f2900 100%);
          background-clip: text;
          -webkit-background-clip: text;
          filter: drop-shadow(0 0 12px rgba(255, 94, 0, 0.22));
        }

        .hero-subtitle {
          max-width: 520px;
          margin: 24px 0 22px;
          font-size: clamp(1rem, 1.7vw, 1.25rem);
          line-height: 1.5;
          color: #d1cec7;
        }

        .feature-row {
          display: flex;
          flex-wrap: wrap;
          gap: 18px 26px;
          margin: 26px 0 32px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.86rem;
          color: #e8e2d7;
        }

        .feature-glyph {
          color: #ff9a13;
          font-size: 1.35rem;
          text-shadow: 0 0 12px #ff6200;
        }

        .hero-cta {
          width: min(100%, 390px);
          min-height: 60px;
          font-size: 1rem;
        }

        .pricing-note {
          width: min(100%, 390px);
          margin: 17px 0 0;
          text-align: center;
          color: #d3cec5;
          line-height: 1.55;
          font-size: 0.86rem;
        }

        .pricing-note strong {
          color: #ff9d23;
        }

        .trust-block {
          margin-top: 36px;
        }

        .trust-block > p {
          margin: 0 0 14px;
          color: #726e68;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .partner-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 25px;
          align-items: center;
          color: #827f79;
          font-size: 0.98rem;
          font-weight: 800;
        }

        .partner-row a {
          color: #b78a47;
        }

        .partner-row a:hover {
          color: #ffad2f;
        }

        .hero-art {
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          min-height: 520px;
        }

        .showcase-glow {
          position: absolute;
          width: 84%;
          height: 84%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 105, 0, 0.26), rgba(255, 70, 0, 0.08) 42%, transparent 70%);
          filter: blur(24px);
        }

        .forge-showcase {
          position: relative;
          z-index: 2;
          width: min(100%, 560px);
          padding: 26px;
          border: 1px solid rgba(255, 137, 35, 0.5);
          border-radius: 18px;
          background:
            linear-gradient(145deg, rgba(255, 138, 32, 0.08), transparent 34%),
            rgba(9, 9, 9, 0.94);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.02) inset,
            0 0 34px rgba(255, 83, 0, 0.18),
            0 28px 70px rgba(0, 0, 0, 0.72);
          overflow: hidden;
        }

        .forge-showcase::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(110deg, transparent 25%, rgba(255, 190, 85, 0.05) 45%, transparent 65%);
          transform: translateX(-100%);
          animation: sweep 4.8s ease-in-out infinite;
        }

        .showcase-topline {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #ca8a39;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff8f1f;
          box-shadow: 0 0 12px #ff4d00;
          animation: pulse 1.8s ease-in-out infinite;
        }

        .showcase-core {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 20px;
          align-items: center;
          margin: 24px 0;
          padding: 22px;
          border: 1px solid rgba(255, 123, 20, 0.34);
          border-radius: 14px;
          background: radial-gradient(circle at 18% 40%, rgba(255, 108, 0, 0.16), transparent 42%), #080706;
        }

        .showcase-icon {
          width: 94px;
          height: 94px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #ff9d25;
          border: 1px solid #b65e18;
          box-shadow: 0 0 24px rgba(255, 84, 0, 0.3), inset 0 0 24px rgba(255, 114, 0, 0.08);
        }

        .showcase-kicker {
          margin: 0 0 6px !important;
          color: #a06b31 !important;
          font-size: 0.64rem !important;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        .showcase-core h2 {
          margin: 0 0 8px;
          text-transform: uppercase;
          font-size: clamp(1.35rem, 3vw, 2rem);
          color: #f1ede6;
        }

        .showcase-core p {
          margin: 0;
          color: #bdb7ae;
          line-height: 1.5;
          font-size: 0.86rem;
        }

        .showcase-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .showcase-item {
          min-height: 92px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          border: 1px solid #3a2b1c;
          border-radius: 10px;
          color: #8d8174;
          background: #080808;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .showcase-item svg { width: 35px; height: 35px; }

        .showcase-item.active {
          color: #ffc15b;
          border-color: #a55317;
          box-shadow: inset 0 0 20px rgba(255, 94, 0, 0.08);
        }

        .showcase-output {
          margin-top: 18px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          color: #746d65;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.11em;
        }

        .showcase-output strong { color: #ff9b24; }

        .molten-line {
          height: 2px;
          background: linear-gradient(90deg, #5a2a0b, #ff7f10, #ffd06b, #ff5a00, #5a2a0b);
          box-shadow: 0 0 12px rgba(255, 89, 0, 0.55);
        }

        .ember {
          position: absolute;
          z-index: 3;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffb12c;
          box-shadow: 0 0 14px #ff5d00;
          animation: emberFloat 3.6s ease-in-out infinite;
        }

        .ember-1 { right: 5%; top: 18%; }
        .ember-2 { left: 6%; top: 45%; animation-delay: 1.1s; }
        .ember-3 { right: 14%; bottom: 12%; animation-delay: 2.2s; }

        .furnace-section {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 48px 0 28px;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .section-heading p {
          margin: 0 0 9px;
          color: #a07a45;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .section-heading h2,
        .workflow h2 {
          margin: 0;
          text-transform: uppercase;
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          color: transparent;
          background: linear-gradient(180deg, #ffc35a, #cb6711);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .furnace-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        .furnace-card {
          position: relative;
          min-height: 335px;
          padding: 22px 19px 18px;
          border-radius: 12px;
          background:
            linear-gradient(180deg, rgba(28, 24, 19, 0.92), rgba(7, 7, 7, 0.96));
          border: 1px solid #60401e;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }

        .furnace-card::before {
          content: "";
          position: absolute;
          left: 12%;
          right: 12%;
          top: -1px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #ff8b13, transparent);
        }

        .furnace-card.active {
          border-color: #a85214;
          box-shadow:
            inset 0 0 34px rgba(255, 95, 0, 0.04),
            0 0 0 rgba(255, 88, 0, 0);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .furnace-card.active:hover {
          transform: translateY(-6px);
          border-color: #ff8318;
          box-shadow:
            0 0 26px rgba(255, 76, 0, 0.19),
            inset 0 0 34px rgba(255, 95, 0, 0.08);
        }

        .furnace-card.inactive {
          opacity: 0.72;
        }

        .card-icon {
          width: 86px;
          height: 86px;
          display: grid;
          place-items: center;
          margin-bottom: 17px;
          color: #ff901c;
          border: 1px solid #9b4f14;
          border-radius: 50%;
          box-shadow:
            0 0 18px rgba(255, 85, 0, 0.27),
            inset 0 0 20px rgba(255, 111, 0, 0.06);
        }

        .inactive .card-icon {
          color: #b17a36;
          border-color: #5b452a;
          box-shadow: none;
        }

        .furnace-card h3 {
          margin: 0;
          min-height: 38px;
          font-size: 0.94rem;
          text-transform: uppercase;
          letter-spacing: 0.015em;
        }

        .furnace-card p {
          margin: 10px 0 18px;
          color: #bcb6ae;
          font-size: 0.79rem;
          line-height: 1.55;
        }

        .card-button {
          width: 100%;
          min-height: 40px;
          margin-top: auto;
          display: grid;
          place-items: center;
          border-radius: 5px;
          border: 1px solid #e8620b;
          text-transform: uppercase;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          background: #0b0907;
          box-shadow: 0 0 15px rgba(255, 76, 0, 0.18);
        }

        .card-button:hover {
          background: linear-gradient(180deg, #e86b0e, #a63100);
        }

        .card-button.disabled {
          border-color: #4b3a25;
          color: #a57a3e;
          box-shadow: none;
          cursor: not-allowed;
        }

        .workflow {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 14px 0 30px;
          display: grid;
          grid-template-columns: 1.06fr 0.94fr;
          gap: 16px;
        }

        .workflow-panel,
        .complete-panel,
        .closing-cta {
          border: 1px solid #3d3429;
          border-radius: 13px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.025), transparent 32%),
            #090909;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .workflow-panel {
          padding: 25px;
        }

        .workflow h2 {
          font-size: 1.5rem;
          margin-bottom: 24px;
        }

        .steps {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: start;
          gap: 12px;
        }

        .step {
          text-align: center;
        }

        .step-icon {
          width: 62px;
          height: 62px;
          margin: 0 auto 13px;
          display: grid;
          place-items: center;
          border: 1px solid #87551b;
          transform: rotate(45deg);
          color: #ff9d21;
          font-size: 1.6rem;
          box-shadow: 0 0 15px rgba(255, 105, 0, 0.12);
        }

        .step-icon::first-letter {
          transform: rotate(-45deg);
        }

        .step strong {
          display: block;
          color: #e79a31;
          text-transform: uppercase;
          font-size: 0.76rem;
        }

        .step p {
          color: #beb8b0;
          line-height: 1.45;
          font-size: 0.78rem;
        }

        .step-arrow {
          padding-top: 30px;
          color: #b96817;
          font-size: 1.5rem;
        }

        .complete-panel {
          min-height: 260px;
          padding: 26px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          align-items: center;
          overflow: hidden;
        }

        .complete-kicker {
          margin: 0 0 8px;
          color: #ff9c24;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .complete-panel h3 {
          margin: 0 0 15px;
          color: #d9d3ca;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .complete-panel ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 9px;
          color: #ded8ce;
          font-size: 0.86rem;
        }

        .complete-panel li::before {
          content: "✓";
          margin-right: 8px;
          color: #ff8c16;
          text-shadow: 0 0 9px #ff5e00;
        }

        .pour-art {
          position: relative;
          min-height: 190px;
          display: grid;
          place-items: center;
        }

        .pour-bowl {
          position: absolute;
          top: 21px;
          width: 120px;
          height: 34px;
          border: 4px solid #2c2119;
          border-top: none;
          border-radius: 0 0 70px 70px;
          background: linear-gradient(180deg, #2a160c, #090706);
          box-shadow: 0 0 13px rgba(255, 83, 0, 0.22);
        }

        .pour-stream {
          position: absolute;
          top: 49px;
          width: 15px;
          height: 98px;
          border-radius: 999px;
          background: linear-gradient(90deg, #d63a00, #fff1a2, #ff7300, #a42000);
          box-shadow:
            0 0 13px #ff4f00,
            0 0 28px rgba(255, 91, 0, 0.55);
        }

        .pour-pool {
          position: absolute;
          bottom: 20px;
          width: 155px;
          height: 33px;
          border-radius: 50%;
          border: 3px solid #ff6d00;
          background: radial-gradient(ellipse, #ffbc36, #a72500 44%, #120804 72%);
          box-shadow:
            0 0 20px #ff4b00,
            0 0 47px rgba(255, 70, 0, 0.38);
        }

        .closing-cta {
          width: min(1220px, calc(100% - 24px));
          margin: 0 auto 0;
          padding: 22px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border-color: #65421e;
        }

        .closing-title {
          margin: 0 0 15px;
          text-transform: uppercase;
          color: #b9b5ae;
          font-size: 1.1rem;
          font-weight: 900;
        }

        .closing-features {
          display: flex;
          flex-wrap: wrap;
          gap: 18px 30px;
          color: #d2ccc3;
          font-size: 0.83rem;
        }

        .closing-features span::first-letter {
          color: #f29724;
        }

        .closing-action {
          text-align: right;
          flex-shrink: 0;
        }

        .closing-action p {
          margin: 0 0 10px;
          color: #ffad36;
          font-weight: 900;
        }

        .footer {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 38px 0 28px;
          display: grid;
          grid-template-columns: 1.1fr 2fr;
          gap: 40px;
          position: relative;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 25px;
        }

        .footer-links > div {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .footer-links strong {
          margin-bottom: 3px;
          color: #8f8980;
          text-transform: uppercase;
          font-size: 0.67rem;
          letter-spacing: 0.08em;
        }

        .footer-links a {
          color: #b9b4ad;
          font-size: 0.76rem;
        }

        .footer-links a:hover {
          color: #ff9b22;
        }

        .copyright {
          grid-column: 1 / -1;
          margin: 5px 0 0;
          padding-top: 20px;
          border-top: 1px solid #222;
          text-align: center;
          color: #716d67;
          font-size: 0.72rem;
        }

        @keyframes breathe {
          0%,
          100% {
            transform: translateY(0) scale(1);
            filter:
              drop-shadow(0 0 14px rgba(255, 126, 0, 0.3))
              drop-shadow(0 28px 55px rgba(0, 0, 0, 0.8));
          }
          50% {
            transform: translateY(-6px) scale(1.012);
            filter:
              drop-shadow(0 0 24px rgba(255, 126, 0, 0.48))
              drop-shadow(0 31px 58px rgba(0, 0, 0, 0.84));
          }
        }

        @keyframes sweep {
          0%, 18% { transform: translateX(-110%); }
          52%, 100% { transform: translateX(110%); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.45; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes emberFloat {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-25px);
            opacity: 1;
          }
        }

        @media (max-width: 1040px) {
          .desktop-nav {
            display: none;
          }

          .hero {
            grid-template-columns: 1fr 0.95fr;
          }

          .furnace-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .furnace-card:nth-child(4),
          .furnace-card:nth-child(5) {
            min-height: 310px;
          }
        }

        @media (max-width: 780px) {
          .nav-wrap {
            min-height: 72px;
          }

          .brand-tag,
          .btn-ghost {
            display: none;
          }

          .btn.small {
            padding-inline: 13px;
            font-size: 0.63rem;
          }

          .hero {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 44px 0 32px;
          }

          .hero-copy {
            text-align: center;
          }

          .hero-subtitle,
          .pricing-note {
            margin-left: auto;
            margin-right: auto;
          }

          .feature-row,
          .partner-row {
            justify-content: center;
          }

          .hero-art {
            min-height: auto;
            order: 0;
            margin-top: 12px;
          }

          .forge-showcase {
            width: min(100%, 560px);
          }

          h1 {
            font-size: clamp(2.8rem, 12vw, 4.7rem);
          }

          .furnace-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .workflow {
            grid-template-columns: 1fr;
          }

          .closing-cta {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .closing-action {
            text-align: center;
          }

          .footer {
            grid-template-columns: 1fr;
          }
        }



        .hero-banner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          padding: 8px 14px;
          border: 1px solid rgba(255, 140, 0, 0.4);
          border-radius: 999px;
          color: #ffb24d;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          background: rgba(255, 120, 0, 0.08);
        }

        .hero-action-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          margin: 18px 0;
        }

        .hero-login {
          min-height: 60px;
        }

        .mobile-signup {
          white-space: nowrap;
        }

        @media (max-width: 780px) {
          .hero-action-row {
            justify-content: center;
          }
        }

        @media (max-width: 520px) {
          .topbar {
            position: sticky;
            top: 0;
          }

          .nav-wrap {
            width: calc(100% - 20px);
            min-height: 70px;
            gap: 8px;
          }

          .brand {
            min-width: 0;
            gap: 7px;
          }

          .brand-logo {
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
          }

          .brand-name {
            font-size: 0.98rem;
            letter-spacing: 0.045em;
          }

          .nav-actions {
            flex-shrink: 0;
            gap: 7px;
          }

          .nav-actions .btn {
            min-height: 38px;
            padding: 0 10px;
            font-size: 0.64rem;
            letter-spacing: 0.035em;
          }

          .hero {
            width: calc(100% - 20px);
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 18px 0 26px;
          }

          .hero-copy {
            padding: 0;
            text-align: center;
          }

          .hero-banner {
            display: none;
          }

          .eyebrow {
            margin: 0 0 12px;
            font-size: 0.65rem;
            letter-spacing: 0.18em;
          }

          h1 {
            max-width: 100%;
            font-size: clamp(2.45rem, 12vw, 3.55rem);
            line-height: 0.94;
            letter-spacing: -0.04em;
          }

          .hero-subtitle {
            max-width: 36rem;
            margin: 18px auto 14px;
            font-size: 0.98rem;
            line-height: 1.42;
          }

          .hero-action-row {
            display: grid;
            grid-template-columns: 1fr;
            width: 100%;
            gap: 9px;
            margin: 12px 0 14px;
          }

          .hero-action-row .btn {
            width: 100%;
            min-height: 56px;
            padding-inline: 14px;
            font-size: 0.86rem;
          }

          .hero-cta {
            max-width: none;
            border: 2px solid #ffd27a;
            background: linear-gradient(
              180deg,
              #ffb52e 0%,
              #ff7200 48%,
              #d94100 100%
            );
            box-shadow:
              0 0 18px rgba(255, 116, 0, 0.9),
              0 0 45px rgba(255, 70, 0, 0.45),
              inset 0 1px 0 rgba(255, 255, 255, 0.65);
          }

          .hero-login {
            min-height: 48px !important;
            border-color: #8f5a1e;
            background: #0d0b09;
          }

          .feature-row {
            justify-content: center;
            gap: 10px 15px;
            margin: 14px 0 9px;
          }

          .feature {
            gap: 6px;
            font-size: 0.78rem;
          }

          .feature-glyph {
            font-size: 1.05rem;
          }

          .pricing-note {
            width: 100%;
            margin: 8px auto 0;
            padding-bottom: 8px;
            font-size: 0.78rem;
            line-height: 1.42;
          }

          .trust-block {
            margin-top: 24px;
          }

          .partner-row {
            justify-content: center;
          }

          .hero-art {
            min-height: auto;
            margin-top: 14px;
          }

          .forge-showcase {
            width: 100%;
            padding: 17px;
            border-radius: 14px;
          }

          .showcase-core {
            grid-template-columns: 1fr;
            padding: 18px 14px;
            text-align: center;
          }

          .showcase-icon {
            width: 78px;
            height: 78px;
            margin: 0 auto;
          }

          .showcase-list {
            grid-template-columns: 1fr;
          }

          .showcase-item {
            min-height: 64px;
            flex-direction: row;
            justify-content: flex-start;
            padding-inline: 14px;
          }

          .showcase-output {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .furnace-grid {
            grid-template-columns: 1fr;
          }

          .furnace-card {
            min-height: 300px;
          }

          .steps {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .step-arrow {
            display: none;
          }

          .complete-panel {
            grid-template-columns: 1fr;
          }

          .pour-art {
            min-height: 170px;
          }

          .closing-cta {
            width: calc(100% - 20px);
            padding: 22px 18px;
          }

          .footer-links {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </main>
  );
}
