"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

const forgeStages = [
  {
    title: "Crucible is forging...",
    description: "Preparing your audio for refinement.",
  },
  {
    title: "Melting out impurities...",
    description: "Inspecting noise, distortion, and unwanted residue.",
  },
  {
    title: "Filtering the static...",
    description: "Refining clarity while preserving the character of your track.",
  },
  {
    title: "Tempering the dynamics...",
    description: "Preparing the track for stronger balance, punch, and impact.",
  },
  {
    title: "Polishing the sound...",
    description: "Preparing your project for Justice to personally remaster.",
  },
];

const services = [
  {
    number: "01",
    title: "Free Remaster",
    description:
      "Send your track through the forge for a free remastering review by Justice.",
  },
  {
    number: "02",
    title: "Custom Production",
    description:
      "Original instrumentals, custom samples, arrangement, and creative production.",
  },
  {
    number: "03",
    title: "Digital Design",
    description:
      "Album covers, posters, merchandise graphics, promotional artwork, and visual branding.",
  },
  {
    number: "04",
    title: "Rap Training",
    description:
      "Instrumentals paired with synchronized rhyme stacks, cadence exercises, and writing practice.",
  },
  {
    number: "05",
    title: "Producer Showcase",
    description:
      "Featured production, artist releases, creative projects, and future producer spotlights.",
  },
  {
    number: "06",
    title: "Beat Battles",
    description:
      "Producer-versus-producer battles, community voting, challenges, and featured winners.",
  },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isForging, setIsForging] = useState(false);
  const [forgeComplete, setForgeComplete] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!isForging) return;

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        const nextProgress = Math.min(current + 1, 100);

        const nextStage = Math.min(
          Math.floor(nextProgress / 20),
          forgeStages.length - 1,
        );

        setStageIndex(nextStage);

        if (nextProgress === 100) {
          window.clearInterval(progressTimer);

          window.setTimeout(() => {
            setIsForging(false);
            setForgeComplete(true);
          }, 500);
        }

        return nextProgress;
      });
    }, 55);

    return () => window.clearInterval(progressTimer);
  }, [isForging]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please choose an audio file.");
      event.target.value = "";
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const nextAudioUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setAudioUrl(nextAudioUrl);
    setProgress(0);
    setStageIndex(0);
    setForgeComplete(false);
    setIsForging(true);
  }

  function resetForge() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setSelectedFile(null);
    setAudioUrl("");
    setProgress(0);
    setStageIndex(0);
    setForgeComplete(false);
    setIsForging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const inquirySubject = selectedFile
    ? `Crucible Remaster Request - ${selectedFile.name}`
    : "Crucible Forge Project Inquiry";

  const inquiryBody = selectedFile
    ? `Hi Justice,%0D%0A%0D%0AI would like to request a free remaster review for:%0D%0A${encodeURIComponent(
        selectedFile.name,
      )}%0D%0A%0D%0AArtist name:%0D%0ASong title:%0D%0AWhat I want improved:%0D%0A`
    : "Hi Justice,%0D%0A%0D%0AI would like to discuss a project with Crucible Forge.%0D%0A";

  return (
    <main className="min-h-screen overflow-hidden bg-[#09070f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(126,34,206,0.24),transparent_42%),radial-gradient(circle_at_15%_45%,rgba(236,72,153,0.08),transparent_30%),linear-gradient(to_bottom,#09070f,#050409)]" />

      <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:46px_46px]" />

      <header className="relative z-30 border-b border-white/10 bg-[#09070f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/crucible-forge-mark.jpg"
              alt="Crucible Forge"
              className="h-11 w-11 rounded-xl border border-white/10 object-cover"
            />

            <div>
              <div className="font-semibold tracking-tight">
                Crucible Forge
              </div>
              <div className="text-xs text-white/40">
                Music forged with purpose
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            <a className="transition hover:text-white" href="#forge">
              Remaster
            </a>
            <a className="transition hover:text-white" href="#services">
              Services
            </a>
            <a className="transition hover:text-white" href="#showcase">
              Showcase
            </a>
            <a className="transition hover:text-white" href="#contact">
              Contact
            </a>
          </nav>

          <a
            href="#forge"
            className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,.25)] transition hover:scale-[1.02]"
          >
            Free remaster
          </a>
        </div>
      </header>

      <section className="relative z-10 px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
              Your first remaster is free
            </div>

            <h1 className="text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-6xl md:text-8xl">
              Feed your sound
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-400 to-orange-300 bg-clip-text text-transparent">
                into the forge.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-pretty text-lg leading-8 text-white/60 md:text-xl">
              Upload your song and let Justice personally refine its clarity,
              balance, power, and presence.
            </p>
          </div>

          <div
            id="forge"
            className="relative mx-auto mt-14 max-w-5xl scroll-mt-28 overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[0.035] p-3 shadow-[0_35px_120px_rgba(0,0,0,.65)]"
          >
            <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0c0912] px-5 py-10 md:px-10 md:py-14">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(circle_at_50%_100%,rgba(168,85,247,.28),transparent_60%)]" />

              <div className="relative z-10 mx-auto max-w-3xl text-center">
                <p className="text-sm font-medium text-violet-300">
                  The Crucible Remastering Forge
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  Drop your track into the furnace
                </h2>

                <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/50">
                  WAV, MP3, M4A, AAC, or FLAC. Use the strongest-quality version
                  you have available.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a,.aac,.flac"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isForging}
                  className="group relative mx-auto mt-10 flex min-h-[330px] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-violet-400/35 bg-gradient-to-b from-violet-500/[0.08] to-black/20 px-6 py-10 transition hover:border-violet-300/70 hover:bg-violet-500/[0.12] disabled:cursor-wait"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 transition duration-700 ${
                      isForging
                        ? "bg-[radial-gradient(circle_at_50%_70%,rgba(249,115,22,.28),transparent_40%),radial-gradient(circle_at_50%_60%,rgba(168,85,247,.22),transparent_65%)]"
                        : "bg-[radial-gradient(circle_at_50%_70%,rgba(168,85,247,.16),transparent_55%)]"
                    }`}
                  />

                  <div
                    className={`relative flex h-52 w-52 items-center justify-center rounded-full border transition duration-700 ${
                      isForging
                        ? "scale-105 border-orange-300/40 shadow-[0_0_80px_rgba(249,115,22,.35)]"
                        : "border-violet-300/20 shadow-[0_0_70px_rgba(168,85,247,.22)] group-hover:scale-105"
                    }`}
                  >
                    <div
                      className={`absolute inset-3 rounded-full blur-2xl transition duration-700 ${
                        isForging
                          ? "bg-orange-500/35"
                          : "bg-violet-600/20"
                      }`}
                    />

                    <img
                      src="/crucible.png"
                      alt="Crucible furnace"
                      onError={(event) => {
                        event.currentTarget.src = "/crucible-forge-mark.jpg";
                      }}
                      className={`relative h-40 w-40 rounded-full object-contain transition duration-700 ${
                        isForging
                          ? "animate-pulse brightness-125 saturate-150"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="relative mt-7">
                    {!selectedFile && (
                      <>
                        <p className="text-xl font-semibold">
                          Feed the forge
                        </p>
                        <p className="mt-2 text-sm text-white/45">
                          Tap the furnace to select your audio file
                        </p>
                      </>
                    )}

                    {isForging && (
                      <>
                        <p className="text-xl font-semibold text-orange-100">
                          {forgeStages[stageIndex].title}
                        </p>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                          {forgeStages[stageIndex].description}
                        </p>
                      </>
                    )}

                    {forgeComplete && (
                      <>
                        <p className="text-xl font-semibold text-violet-200">
                          Your track entered the forge.
                        </p>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                          Complete your request below so Justice can personally
                          review and remaster it.
                        </p>
                      </>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="relative mt-6 w-full max-w-md">
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                        <span>{selectedFile.name}</span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                  )}
                </button>

                {selectedFile && !isForging && (
                  <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-medium text-white">
                          {selectedFile.name}
                        </p>
                        <p className="mt-1 text-sm text-white/40">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={resetForge}
                        className="text-sm font-medium text-white/50 transition hover:text-white"
                      >
                        Choose another track
                      </button>
                    </div>

                    {audioUrl && (
                      <audio
                        controls
                        src={audioUrl}
                        className="mt-5 w-full"
                      />
                    )}

                    <a
                      href={`mailto:kazakazaate@gmail.com?subject=${encodeURIComponent(
                        inquirySubject,
                      )}&body=${inquiryBody}`}
                      className="mt-5 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4 font-semibold text-white transition hover:brightness-110"
                    >
                      Complete free remaster request
                    </a>

                    <p className="mt-4 text-center text-xs leading-5 text-white/35">
                      The secure cloud-upload connection will be added next.
                      This first version previews your selected audio locally
