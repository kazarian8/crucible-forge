"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MasteringPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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

    setSelectedFile(file);
    setAudioUrl(URL.createObjectURL(file));
  }

  function resetFile() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setSelectedFile(null);
    setAudioUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070403] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(249,115,22,.18),transparent_34%),linear-gradient(to_bottom,#100804,#070403_52%,#020202)]" />

      <header className="relative z-20 flex h-16 items-center justify-between border-b border-white/10 bg-black/45 px-4 backdrop-blur-xl md:px-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
            Crucible Mastering
          </p>
          <p className="text-[10px] text-white/35">
            Audio refinement chamber
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/studio")}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
        >
          Back to studio
        </button>
      </header>

      <section className="relative z-10 px-5 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
              The mastering forge
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              Prepare your track
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
              Upload the strongest-quality version of your song. Your file stays
              on your device for this preview until the secure submission system
              is connected.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-orange-300/20 bg-black/35 p-4 shadow-[0_30px_100px_rgba(0,0,0,.6)] md:p-7">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.aac,.flac"
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={openFilePicker}
                className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-orange-300/30 bg-gradient-to-b from-orange-500/[0.08] to-black/20 px-6 text-center transition hover:border-orange-300/60 hover:bg-orange-500/[0.12]"
              >
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-orange-300/25 bg-orange-400/10 text-5xl text-orange-100 shadow-[0_0_60px_rgba(249,115,22,.18)]">
                  ◉
                </div>

                <h2 className="mt-7 text-2xl font-semibold">
                  Upload your track
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  WAV, MP3, M4A, AAC, or FLAC
                </p>
              </button>
            ) : (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 md:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-sm text-white/40">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetFile}
                    className="text-left text-sm font-medium text-orange-200 transition hover:text-orange-100"
                  >
                    Choose another file
                  </button>
                </div>

                {audioUrl && (
                  <audio
                    controls
                    src={audioUrl}
                    className="mt-6 w-full"
                  />
                )}

                <div className="mt-7 rounded-2xl border border-orange-300/15 bg-orange-400/[0.06] p-5">
                  <p className="font-medium text-orange-100">
                    Ready for the next stage
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/45">
                    The secure upload form and mastering request details will be
                    connected next.
                  </p>
                </div>

                <a
                  href={`mailto:kazakazaate@gmail.com?subject=${encodeURIComponent(
                    `Crucible Mastering Request - ${selectedFile.name}`,
                  )}&body=${encodeURIComponent(
                    `Hi Justice,

I would like to request mastering for:

File: ${selectedFile.name}

Artist name:
Song title:
What I want improved:
`,
                  )}`}
                  className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 font-semibold text-black transition hover:brightness-110"
                >
                  Send mastering request
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
