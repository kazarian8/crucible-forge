"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ForgePreset = {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  description: string;
};

type ForgeStage = "upload" | "ready" | "forging" | "complete";

const presets: ForgePreset[] = [
  {
    id: "warm",
    icon: "🔥",
    name: "Warm Forge",
    tagline: "Rich • Smooth • Analog",
    description: "Adds warmth, fuller mids, and softer high frequencies.",
  },
  {
    id: "modern",
    icon: "⚡",
    name: "Modern Forge",
    tagline: "Loud • Wide • Streaming Ready",
    description: "Commercial loudness, crisp detail, and controlled low end.",
  },
  {
    id: "crystal",
    icon: "💎",
    name: "Crystal Forge",
    tagline: "Clear • Detailed • Open",
    description: "Maximum clarity with clean imaging and transparent polish.",
  },
  {
    id: "heavy",
    icon: "🥁",
    name: "Heavy Forge",
    tagline: "Punch • Bass • Impact",
    description: "Harder drums, deeper bass, and aggressive final limiting.",
  },
  {
    id: "voice",
    icon: "🎙",
    name: "Voice Forge",
    tagline: "Rap • Podcast • Spoken Word",
    description: "Presence, intelligibility, and controlled vocal dynamics.",
  },
];

const forgeMessages = [
  "Furnace ignited",
  "Analyzing frequency balance",
  "Removing harsh resonances",
  "Balancing dynamics",
  "Forging stereo image",
  "Applying final polish",
  "Cooling the master",
];

const allowedExtensions = ["wav", "mp3", "flac", "aiff", "aif", "m4a"];
const maxFileSize = 500 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export default function SoundFurnacePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const forgeAudioContextRef = useRef<AudioContext | null>(null);

  const [stage, setStage] = useState<ForgeStage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("modern");
  const [progress, setProgress] = useState(0);
  const [forgeMessage, setForgeMessage] = useState(forgeMessages[0]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [heat, setHeat] = useState(72);
  const [clarity, setClarity] = useState(64);
  const [punch, setPunch] = useState(68);
  const [warmth, setWarmth] = useState(48);
  const [width, setWidth] = useState(57);

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPreset) ?? presets[1],
    [selectedPreset],
  );

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (stage !== "forging") return;

    setProgress(0);
    setForgeMessage(forgeMessages[0]);
    playForgeTone(96, 520, 0.1, "sawtooth");

    const startedAt = Date.now();
    const totalDuration = 7600;
    let lastMessageIndex = 0;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(nextProgress);

      const messageIndex = Math.min(
        forgeMessages.length - 1,
        Math.floor((nextProgress / 100) * forgeMessages.length),
      );
      setForgeMessage(forgeMessages[messageIndex]);

      if (messageIndex !== lastMessageIndex) {
        lastMessageIndex = messageIndex;
        playForgeTone(150 + messageIndex * 24, 150, 0.045, "triangle");
      }

      if (nextProgress >= 100) {
        window.clearInterval(timer);
        playForgeTone(440, 180, 0.06, "triangle");
        window.setTimeout(() => {
          playForgeTone(660, 360, 0.07, "sine");
          setStage("complete");
        }, 450);
      }
    }, 90);

    return () => window.clearInterval(timer);
  }, [stage]);

  function playForgeTone(
    frequency: number,
    durationMs: number,
    volume = 0.08,
    type: OscillatorType = "sine",
  ) {
    if (!soundEnabled || typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const context =
      forgeAudioContextRef.current ?? new AudioContextClass();
    forgeAudioContextRef.current = context;

    if (context.state === "suspended") {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(45, frequency * 0.72),
      now + durationMs / 1000,
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + durationMs / 1000,
    );

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000);
  }

  function validateAndLoad(candidate: File | null) {
    setError("");
    if (!candidate) return;

    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? "";
    const validType =
      candidate.type.startsWith("audio/") || allowedExtensions.includes(extension);

    if (!validType) {
      setError("Use a WAV, MP3, FLAC, AIFF, AIF, or M4A audio file.");
      return;
    }

    if (candidate.size > maxFileSize) {
      setError("That file is over the 500 MB upload limit.");
      return;
    }

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const nextUrl = URL.createObjectURL(candidate);

    setFile(candidate);
    setAudioUrl(nextUrl);
    setDuration(0);
    setStage("ready");
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    validateAndLoad(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    validateAndLoad(event.dataTransfer.files?.[0] ?? null);
  }

  function resetFurnace() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(null);
    setAudioUrl("");
    setDuration(0);
    setError("");
    setProgress(0);
    setStage("upload");
  }

  return (
    <main className="sound-page">
      <header className="topbar">
        <div className="nav-wrap">
          <Link href="/" className="brand" aria-label="Crucible home">
            <Image
              src="/crucible-logo.png"
              alt="Crucible"
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

          <div className="nav-center">
            <span className="live-dot" />
            SOUND FURNACE
          </div>

          <div className="nav-actions">
            <button
              className="sound-toggle"
              type="button"
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((current) => !current)}
            >
              {soundEnabled ? "🔊 Forge Sounds" : "🔇 Forge Sounds"}
            </button>
            <Link href="/studio" className="back-link">
              All Furnaces
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="embers" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <p className="eyebrow">THE FIRST CRUCIBLE FURNACE</p>
        <h1>
          Sound <span>Furnace</span>
        </h1>
        <p className="motto">
          Everything enters raw. Everything leaves <strong>reforged.</strong>
        </p>
        <p className="hero-copy">
          Upload your track, choose the character of your master, and prepare it
          for release.
        </p>
      </section>

      <section className="workspace">
        <aside className="step-rail" aria-label="Sound Furnace progress">
          {[
            ["01", "Upload", stage !== "upload"],
            ["02", "Choose Forge", stage === "ready" || stage === "forging" || stage === "complete"],
            ["03", "Reforge", stage === "forging" || stage === "complete"],
            ["04", "Download", stage === "complete"],
          ].map(([number, label, complete]) => (
            <div
              className={`rail-step ${
                complete ? "complete" : ""
              }`}
              key={String(label)}
            >
              <span>{number}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </aside>

        <div className="furnace-panel">
          {stage === "upload" && (
            <div className="upload-stage">
              <div
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <div className="furnace-ring">
                  <div className="furnace-core">♫</div>
                </div>
                <p className="drop-kicker">FEED THE FURNACE</p>
                <h2>Drop your audio here</h2>
                <p className="drop-help">or choose a file from your device</p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse Audio Files
                </button>
                <p className="file-types">
                  WAV • MP3 • FLAC • AIFF • M4A &nbsp;|&nbsp; MAX 500 MB
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.flac,.aiff,.aif,.m4a"
                  onChange={handleInput}
                  hidden
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="security-row">
                <span>◈ Private upload</span>
                <span>▣ Your audio stays yours</span>
                <span>ϟ Fast processing</span>
              </div>
            </div>
          )}

          {stage === "ready" && file && (
            <div className="ready-stage">
              <div className="track-card">
                <div className="track-top">
                  <div>
                    <p className="section-kicker">RAW INPUT DETECTED</p>
                    <h2>{file.name}</h2>
                  </div>
                  <button type="button" className="text-button" onClick={resetFurnace}>
                    Replace File
                  </button>
                </div>

                <div className="waveform" aria-hidden="true">
                  {Array.from({ length: 74 }).map((_, index) => (
                    <i
                      key={index}
                      style={{
                        height: `${18 + ((index * 19) % 54)}%`,
                        opacity: 0.42 + ((index % 5) * 0.11),
                      }}
                    />
                  ))}
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  preload="metadata"
                  onLoadedMetadata={(event) =>
                    setDuration(event.currentTarget.duration || 0)
                  }
                />

                <div className="track-meta">
                  <span>{formatDuration(duration)}</span>
                  <span>{formatBytes(file.size)}</span>
                  <span>{file.type || "Audio file"}</span>
                  <span className="status-ready">Ready to forge</span>
                </div>
              </div>

              <div className="analysis-grid">
                <div>
                  <span>Estimated LUFS</span>
                  <strong>-14.8</strong>
                </div>
                <div>
                  <span>Peak</span>
                  <strong>-3.2 dB</strong>
                </div>
                <div>
                  <span>Dynamic Range</span>
                  <strong>8.7 dB</strong>
                </div>
                <div>
                  <span>Stereo Width</span>
                  <strong>84%</strong>
                </div>
              </div>

              <div className="preset-section">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">CHOOSE YOUR FIRE</p>
                    <h2>Select a Forge</h2>
                  </div>
                  <p>
                    Recommended: <strong>Modern Forge</strong>
                  </p>
                </div>

                <div className="preset-grid">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-card ${
                        selectedPreset === preset.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedPreset(preset.id)}
                    >
                      <span className="preset-icon">{preset.icon}</span>
                      <strong>{preset.name}</strong>
                      <small>{preset.tagline}</small>
                      <p>{preset.description}</p>
                      <span className="select-mark">
                        {selectedPreset === preset.id ? "Selected ✓" : "Select"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="advanced">
                <button
                  type="button"
                  className="advanced-toggle"
                  onClick={() => setAdvancedOpen((current) => !current)}
                >
                  <span>Advanced Forging Controls</span>
                  <strong>{advancedOpen ? "−" : "+"}</strong>
                </button>

                {advancedOpen && (
                  <div className="control-grid">
                    {[
                      ["Forge Heat", heat, setHeat],
                      ["Clarity", clarity, setClarity],
                      ["Punch", punch, setPunch],
                      ["Warmth", warmth, setWarmth],
                      ["Stereo Width", width, setWidth],
                    ].map(([label, value, setter]) => (
                      <label key={String(label)}>
                        <span>
                          {String(label)}
                          <strong>{Number(value)}%</strong>
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Number(value)}
                          onChange={(event) =>
                            (setter as (next: number) => void)(
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="forge-action">
                <div>
                  <p>Selected forge</p>
                  <strong>
                    {activePreset.icon} {activePreset.name}
                  </strong>
                </div>
                <button
                  type="button"
                  className="forge-button"
                  onClick={() => {
                    playForgeTone(120, 120, 0.035, "square");
                    setStage("forging");
                  }}
                >
                  ⚒ Reforge My Track
                </button>
              </div>
            </div>
          )}

          {stage === "forging" && (
            <div className="forging-stage">
              <div className="active-forge">
                <div className="heat-ring">
                  <div className="anvil">⚒</div>
                </div>
                <p className="section-kicker">THE FORGE IS ACTIVE</p>
                <h2>{forgeMessage}...</h2>
                <p>
                  {file?.name} is being shaped with {activePreset.name}.
                </p>

                <div className="progress-track">
                  <div style={{ width: `${progress}%` }} />
                </div>
                <strong className="progress-number">{progress}%</strong>

                <div className="forge-statuses">
                  {forgeMessages.map((message, index) => {
                    const threshold = ((index + 1) / forgeMessages.length) * 100;
                    return (
                      <span
                        key={message}
                        className={progress >= threshold ? "done" : ""}
                      >
                        {progress >= threshold ? "✓" : "•"} {message}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {stage === "complete" && file && (
            <div className="complete-stage">
              <div className="complete-badge">⚒ FORGING COMPLETE</div>
              <h2>Your master is ready.</h2>
              <p>
                Day-one demo mode is active. The processing engine will connect
                in the next milestone.
              </p>

              <div className="comparison">
                <div className="comparison-card original">
                  <p>ORIGINAL</p>
                  <h3>{file.name}</h3>
                  <div className="metric-row">
                    <span>LUFS</span>
                    <strong>-14.8</strong>
                  </div>
                  <div className="metric-row">
                    <span>Peak</span>
                    <strong>-3.2 dB</strong>
                  </div>
                  <div className="metric-row">
                    <span>Width</span>
                    <strong>84%</strong>
                  </div>
                  <audio src={audioUrl} controls preload="metadata" />
                </div>

                <div className="comparison-arrow">→</div>

                <div className="comparison-card reforged">
                  <p>REFORGED</p>
                  <h3>{activePreset.name}</h3>
                  <div className="metric-row">
                    <span>LUFS</span>
                    <strong>-9.4</strong>
                  </div>
                  <div className="metric-row">
                    <span>Peak</span>
                    <strong>-0.8 dB</strong>
                  </div>
                  <div className="metric-row">
                    <span>Width</span>
                    <strong>94%</strong>
                  </div>
                  <button type="button" disabled>
                    Preview available after engine connection
                  </button>
                </div>
              </div>

              <div className="result-benefits">
                <span>✓ Louder</span>
                <span>✓ Cleaner</span>
                <span>✓ Wider</span>
                <span>✓ Streaming Ready</span>
              </div>

              <div className="result-actions">
                <button className="download-button" type="button" disabled>
                  Download Reforged WAV
                </button>
                <button className="secondary-button" type="button" onClick={resetFurnace}>
                  Forge Another Track
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer>
        <p>CRUCIBLE SOUND FURNACE • FIRST FORGE</p>
        <span>Real mastering engine connects in Milestone 2.</span>
      </footer>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          background: #040404;
        }

        :global(body) {
          margin: 0;
          color: #f5f0e8;
          background: #040404;
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        :global(button),
        :global(input) {
          font: inherit;
        }

        :global(a) {
          color: inherit;
          text-decoration: none;
        }

        .sound-page {
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 96, 0, 0.11), transparent 32rem),
            linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            #040404;
          background-size: auto, 48px 48px, 48px 48px, auto;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(255, 132, 22, 0.26);
          background: rgba(4, 4, 4, 0.9);
          backdrop-filter: blur(18px);
        }

        .nav-wrap {
          width: min(1240px, calc(100% - 32px));
          min-height: 76px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo {
          object-fit: contain;
          filter: drop-shadow(0 0 13px rgba(255, 102, 0, 0.55));
        }

        .brand-name {
          display: block;
          font-size: 1.35rem;
          font-weight: 950;
          letter-spacing: 0.06em;
          color: #e6a039;
        }

        .brand-tag {
          display: block;
          margin-top: 4px;
          color: #aa681c;
          font-size: 0.55rem;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #d9a45d;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff8c16;
          box-shadow: 0 0 14px #ff4d00;
          animation: pulse 1.7s ease-in-out infinite;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sound-toggle,
        .back-link,
        .text-button {
          border: 1px solid #55402a;
          border-radius: 7px;
          color: #d4cec4;
          background: #0b0a09;
          cursor: pointer;
        }

        .sound-toggle,
        .back-link {
          min-height: 40px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .hero {
          position: relative;
          width: min(900px, calc(100% - 32px));
          margin: auto;
          padding: 58px 0 38px;
          text-align: center;
        }

        .eyebrow,
        .section-kicker {
          color: #a96b28;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 8px 0 10px;
          font-size: clamp(3.4rem, 8vw, 6.6rem);
          line-height: 0.93;
          letter-spacing: -0.055em;
          text-transform: uppercase;
        }

        .hero h1 span {
          color: transparent;
          background: linear-gradient(180deg, #ffd06b, #ff7a00 52%, #9b2700);
          background-clip: text;
          -webkit-background-clip: text;
          filter: drop-shadow(0 0 16px rgba(255, 89, 0, 0.32));
        }

        .motto {
          margin: 0;
          color: #c9c2b8;
          font-size: clamp(1rem, 2vw, 1.25rem);
        }

        .motto strong {
          color: #ff9c28;
        }

        .hero-copy {
          max-width: 610px;
          margin: 15px auto 0;
          color: #918b83;
          line-height: 1.6;
        }

        .embers i {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ffc04d;
          box-shadow: 0 0 13px #ff5200;
          animation: ember 4s ease-in-out infinite;
        }

        .embers i:nth-child(1) { left: 10%; top: 64%; }
        .embers i:nth-child(2) { left: 25%; top: 24%; animation-delay: 1s; }
        .embers i:nth-child(3) { right: 19%; top: 30%; animation-delay: 1.7s; }
        .embers i:nth-child(4) { right: 8%; top: 67%; animation-delay: 2.4s; }
        .embers i:nth-child(5) { left: 49%; top: 8%; animation-delay: 3.1s; }

        .workspace {
          width: min(1240px, calc(100% - 32px));
          margin: 0 auto 50px;
          display: grid;
          grid-template-columns: 168px 1fr;
          gap: 18px;
          align-items: start;
        }

        .step-rail,
        .furnace-panel {
          border: 1px solid #3d2c1d;
          border-radius: 16px;
          background:
            linear-gradient(145deg, rgba(255, 120, 0, 0.035), transparent 28%),
            rgba(8, 8, 8, 0.95);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .step-rail {
          position: sticky;
          top: 96px;
          padding: 17px;
          display: grid;
          gap: 10px;
        }

        .rail-step {
          min-height: 70px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          border: 1px solid #28231d;
          border-radius: 10px;
          color: #655f57;
          background: #080808;
        }

        .rail-step span {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .rail-step strong {
          font-size: 0.74rem;
          text-transform: uppercase;
        }

        .rail-step.complete {
          color: #f0a33b;
          border-color: #774415;
          box-shadow: inset 0 0 20px rgba(255, 91, 0, 0.055);
        }

        .furnace-panel {
          min-height: 620px;
          padding: 28px;
        }

        .drop-zone {
          min-height: 540px;
          padding: 42px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed #6c431e;
          border-radius: 14px;
          text-align: center;
          background:
            radial-gradient(circle at 50% 42%, rgba(255, 91, 0, 0.1), transparent 17rem),
            #070706;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }

        .drop-zone.dragging {
          transform: scale(1.006);
          border-color: #ff9b25;
          background:
            radial-gradient(circle at 50% 42%, rgba(255, 105, 0, 0.2), transparent 19rem),
            #090704;
        }

        .furnace-ring,
        .heat-ring {
          width: 150px;
          height: 150px;
          margin-bottom: 25px;
          display: grid;
          place-items: center;
          border: 1px solid #a95616;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 119, 0, 0.13), transparent 66%);
          box-shadow:
            0 0 34px rgba(255, 74, 0, 0.19),
            inset 0 0 28px rgba(255, 111, 0, 0.08);
        }

        .furnace-core {
          width: 92px;
          height: 92px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #ffb134;
          background: linear-gradient(145deg, #1a1009, #090706);
          font-size: 2.7rem;
          box-shadow: 0 0 28px rgba(255, 72, 0, 0.33);
          animation: breathe 2.3s ease-in-out infinite;
        }

        .drop-kicker {
          margin: 0 0 8px;
          color: #b1712a;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .drop-zone h2,
        .track-card h2,
        .preset-section h2,
        .complete-stage h2,
        .active-forge h2 {
          margin: 0;
          text-transform: uppercase;
        }

        .drop-zone h2 {
          font-size: clamp(1.75rem, 4vw, 2.7rem);
        }

        .drop-help {
          margin: 10px 0 22px;
          color: #8e8880;
        }

        .primary-button,
        .forge-button,
        .download-button {
          min-height: 54px;
          padding: 0 24px;
          border: 1px solid #ffc25b;
          border-radius: 8px;
          color: white;
          background: linear-gradient(180deg, #ffa91f, #e85300 62%, #a92d00);
          box-shadow:
            0 0 16px rgba(255, 105, 0, 0.7),
            0 0 38px rgba(255, 61, 0, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.52);
          font-weight: 950;
          letter-spacing: 0.055em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .file-types {
          margin: 18px 0 0;
          color: #665f57;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.07em;
        }

        .error-message {
          margin: 14px 0 0;
          text-align: center;
          color: #ff7c66;
        }

        .security-row {
          margin-top: 18px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 15px 30px;
          color: #817a70;
          font-size: 0.76rem;
        }

        .ready-stage {
          display: grid;
          gap: 22px;
        }

        .track-card,
        .preset-section,
        .advanced,
        .analysis-grid,
        .forge-action,
        .comparison-card {
          border: 1px solid #3c3024;
          border-radius: 13px;
          background: #080808;
        }

        .track-card,
        .preset-section {
          padding: 22px;
        }

        .track-top,
        .section-heading,
        .forge-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .track-top h2 {
          margin-top: 5px;
          font-size: clamp(1rem, 3vw, 1.45rem);
          word-break: break-word;
        }

        .text-button {
          flex-shrink: 0;
          padding: 10px 13px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .waveform {
          height: 118px;
          margin: 22px 0 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          overflow: hidden;
          border-block: 1px solid #231d18;
          background: radial-gradient(circle, rgba(255, 97, 0, 0.055), transparent 65%);
        }

        .waveform i {
          width: 3px;
          min-height: 9px;
          border-radius: 99px;
          background: linear-gradient(180deg, #ffb43a, #db5100);
          box-shadow: 0 0 7px rgba(255, 75, 0, 0.25);
        }

        .track-card audio,
        .comparison-card audio {
          width: 100%;
          height: 42px;
          filter: sepia(0.55) saturate(1.8);
        }

        .track-meta {
          margin-top: 13px;
          display: flex;
          flex-wrap: wrap;
          gap: 9px 18px;
          color: #7e776e;
          font-size: 0.72rem;
        }

        .status-ready {
          margin-left: auto;
          color: #ff9f27;
          font-weight: 900;
          text-transform: uppercase;
        }

        .analysis-grid {
          padding: 15px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .analysis-grid div {
          padding: 13px;
          border-right: 1px solid #272019;
        }

        .analysis-grid div:last-child {
          border-right: 0;
        }

        .analysis-grid span,
        .metric-row span {
          display: block;
          color: #756f67;
          font-size: 0.67rem;
          text-transform: uppercase;
        }

        .analysis-grid strong {
          display: block;
          margin-top: 6px;
          color: #e3a24a;
          font-size: 1.2rem;
        }

        .section-heading {
          margin-bottom: 17px;
        }

        .section-heading h2 {
          margin-top: 4px;
          font-size: 1.5rem;
        }

        .section-heading > p {
          color: #777068;
          font-size: 0.78rem;
        }

        .section-heading > p strong {
          color: #f1a33a;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .preset-card {
          min-height: 225px;
          padding: 17px 13px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px solid #32291f;
          border-radius: 11px;
          color: #d4cec5;
          text-align: center;
          background: #090909;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .preset-card:hover,
        .preset-card.selected {
          transform: translateY(-3px);
          border-color: #b65d16;
          box-shadow: inset 0 0 28px rgba(255, 90, 0, 0.065);
        }

        .preset-card.selected {
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 108, 0, 0.12), transparent 12rem),
            #0a0908;
        }

        .preset-icon {
          font-size: 1.75rem;
        }

        .preset-card strong {
          margin-top: 10px;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .preset-card small {
          margin-top: 7px;
          min-height: 28px;
          color: #a86727;
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .preset-card p {
          margin: 10px 0;
          color: #817b73;
          font-size: 0.7rem;
          line-height: 1.45;
        }

        .select-mark {
          margin-top: auto;
          color: #c47b2b;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .advanced {
          overflow: hidden;
        }

        .advanced-toggle {
          width: 100%;
          min-height: 58px;
          padding: 0 19px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 0;
          color: #d9d2c9;
          background: transparent;
          font-weight: 850;
          cursor: pointer;
        }

        .advanced-toggle strong {
          color: #f39827;
          font-size: 1.4rem;
        }

        .control-grid {
          padding: 18px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px 24px;
          border-top: 1px solid #30271e;
        }

        .control-grid label > span {
          display: flex;
          justify-content: space-between;
          color: #9c958c;
          font-size: 0.76rem;
        }

        .control-grid label strong {
          color: #f5a037;
        }

        .control-grid input {
          width: 100%;
          margin-top: 12px;
          accent-color: #ed6c0b;
        }

        .forge-action {
          padding: 18px 20px;
        }

        .forge-action p {
          margin: 0 0 5px;
          color: #716b63;
          font-size: 0.68rem;
          text-transform: uppercase;
        }

        .forge-action > div > strong {
          color: #e9a040;
          text-transform: uppercase;
        }

        .forge-button {
          min-width: 280px;
        }

        .forging-stage,
        .complete-stage {
          min-height: 610px;
          display: grid;
          place-items: center;
        }

        .active-forge,
        .complete-stage {
          width: min(760px, 100%);
          margin: auto;
          text-align: center;
        }

        .heat-ring {
          margin: 0 auto 24px;
          animation: furnaceGlow 1.8s ease-in-out infinite;
        }

        .anvil {
          font-size: 3.4rem;
          filter: drop-shadow(0 0 16px rgba(255, 92, 0, 0.8));
          animation: hammer 1.1s ease-in-out infinite;
        }

        .active-forge h2 {
          margin-top: 7px;
          font-size: clamp(1.4rem, 4vw, 2.4rem);
        }

        .active-forge > p:not(.section-kicker) {
          color: #827b72;
        }

        .progress-track {
          height: 12px;
          margin: 30px 0 10px;
          overflow: hidden;
          border: 1px solid #613510;
          border-radius: 999px;
          background: #130b06;
        }

        .progress-track div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #9a2800, #ff7000, #ffd162);
          box-shadow: 0 0 20px rgba(255, 87, 0, 0.7);
          transition: width 100ms linear;
        }

        .progress-number {
          color: #ffad37;
          font-size: 1.3rem;
        }

        .forge-statuses {
          margin-top: 27px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 9px;
          text-align: left;
        }

        .forge-statuses span {
          color: #5d5750;
          font-size: 0.75rem;
        }

        .forge-statuses span.done {
          color: #d38c36;
        }

        .complete-stage {
          display: block;
          padding: 36px 0 12px;
        }

        .complete-badge {
          display: inline-flex;
          padding: 9px 14px;
          border: 1px solid #9c5316;
          border-radius: 999px;
          color: #ffae37;
          background: rgba(255, 109, 0, 0.07);
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .complete-stage h2 {
          margin-top: 17px;
          font-size: clamp(2rem, 5vw, 3.5rem);
        }

        .complete-stage > p {
          max-width: 620px;
          margin: 13px auto 27px;
          color: #8b847b;
          line-height: 1.55;
        }

        .comparison {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 14px;
          align-items: center;
          text-align: left;
        }

        .comparison-card {
          padding: 20px;
        }

        .comparison-card > p {
          margin: 0 0 7px;
          color: #8d642f;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .comparison-card h3 {
          min-height: 42px;
          margin: 0 0 16px;
          color: #ddd6cd;
          font-size: 1rem;
          word-break: break-word;
        }

        .comparison-card.reforged {
          border-color: #9a4d13;
          box-shadow: inset 0 0 28px rgba(255, 85, 0, 0.06);
        }

        .metric-row {
          padding: 8px 0;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #211b16;
        }

        .metric-row strong {
          color: #dd963b;
        }

        .comparison-card audio,
        .comparison-card button {
          margin-top: 16px;
        }

        .comparison-card button,
        .download-button:disabled {
          width: 100%;
          min-height: 42px;
          border: 1px solid #42372c;
          border-radius: 7px;
          color: #766f67;
          background: #0c0b0a;
        }

        .comparison-arrow {
          color: #d36c16;
          font-size: 1.7rem;
        }

        .result-benefits {
          margin: 23px 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px 25px;
          color: #d29a54;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .result-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .download-button {
          min-width: 260px;
        }

        .secondary-button {
          min-height: 54px;
          padding: 0 22px;
          border: 1px solid #86501c;
          border-radius: 8px;
          color: #e0d8cf;
          background: #0c0a08;
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
        }

        footer {
          width: min(1240px, calc(100% - 32px));
          margin: auto;
          padding: 24px 0 35px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid #211b16;
          color: #5f5952;
          font-size: 0.68rem;
        }

        footer p {
          margin: 0;
          font-weight: 900;
          letter-spacing: 0.11em;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.12); }
        }

        @keyframes ember {
          0%, 100% { transform: translateY(0); opacity: 0.15; }
          50% { transform: translateY(-28px); opacity: 0.95; }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes furnaceGlow {
          0%, 100% {
            box-shadow: 0 0 28px rgba(255, 74, 0, 0.25), inset 0 0 30px rgba(255, 99, 0, 0.08);
          }
          50% {
            box-shadow: 0 0 58px rgba(255, 74, 0, 0.5), inset 0 0 42px rgba(255, 99, 0, 0.16);
          }
        }

        @keyframes hammer {
          0%, 100% { transform: rotate(-8deg) translateY(0); }
          45% { transform: rotate(8deg) translateY(5px); }
        }

        @media (max-width: 1020px) {
          .nav-center {
            display: none;
          }

          .preset-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .analysis-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .analysis-grid div:nth-child(2) {
            border-right: 0;
          }
        }

        @media (max-width: 760px) {
          .brand-tag,
          .sound-toggle {
            display: none;
          }

          .workspace {
            grid-template-columns: 1fr;
          }

          .step-rail {
            position: static;
            grid-template-columns: repeat(4, 1fr);
          }

          .rail-step {
            min-height: 58px;
            padding: 9px;
          }

          .furnace-panel {
            padding: 18px;
          }

          .preset-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .forge-action {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .forge-button {
            width: 100%;
            min-width: 0;
          }

          .comparison {
            grid-template-columns: 1fr;
          }

          .comparison-arrow {
            transform: rotate(90deg);
            text-align: center;
          }
        }

        @media (max-width: 520px) {
          .nav-wrap {
            width: calc(100% - 20px);
            min-height: 68px;
          }

          .brand-logo {
            width: 48px;
            height: 48px;
          }

          .brand-name {
            font-size: 1rem;
          }

          .back-link {
            min-height: 37px;
            padding: 0 10px;
            font-size: 0.62rem;
          }

          .hero {
            width: calc(100% - 20px);
            padding: 38px 0 28px;
          }

          .hero h1 {
            font-size: clamp(3rem, 16vw, 4.4rem);
          }

          .workspace {
            width: calc(100% - 20px);
          }

          .step-rail {
            padding: 8px;
            gap: 6px;
          }

          .rail-step {
            min-width: 0;
          }

          .rail-step span {
            font-size: 0.55rem;
          }

          .rail-step strong {
            overflow: hidden;
            font-size: 0.58rem;
            text-overflow: ellipsis;
          }

          .furnace-panel {
            min-height: 540px;
            padding: 10px;
          }

          .drop-zone {
            min-height: 500px;
            padding: 28px 14px;
          }

          .furnace-ring {
            width: 125px;
            height: 125px;
          }

          .preset-grid,
          .control-grid,
          .analysis-grid,
          .forge-statuses {
            grid-template-columns: 1fr;
          }

          .analysis-grid div {
            border-right: 0;
            border-bottom: 1px solid #272019;
          }

          .track-top,
          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .status-ready {
            margin-left: 0;
          }

          .preset-card {
            min-height: 190px;
          }

          .result-actions {
            flex-direction: column;
          }

          .download-button,
          .secondary-button {
            width: 100%;
            min-width: 0;
          }

          footer {
            width: calc(100% - 20px);
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
