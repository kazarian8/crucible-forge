"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ["wav", "mp3", "m4a", "aac", "flac"];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function cleanFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const extensionSuffix = extension ? `.${extension}` : "";

  const nameWithoutExtension = extensionSuffix
    ? fileName.slice(0, -extensionSuffix.length)
    : fileName;

  const safeName = nameWithoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeName || "track"}${extensionSuffix}`;
}

export default function MasteringPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");

  const [artistName, setArtistName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [masteringNotes, setMasteringNotes] = useState("");

  const [checkingUser, setCheckingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuthentication() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (error || !user) {
          router.replace("/login?next=/mastering");
          return;
        }

        setCheckingUser(false);
      } catch {
        if (!active) return;
        router.replace("/login?next=/mastering");
      }
    }

    void checkAuthentication();

    return () => {
      active = false;
    };
  }, [router, supabase]);

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

    setErrorMessage("");

    if (!file) return;

    const extension = getFileExtension(file.name);
    const validMimeType = file.type.startsWith("audio/");
    const validExtension = ALLOWED_EXTENSIONS.includes(extension);

    if (!validMimeType && !validExtension) {
      setErrorMessage(
        "Please choose a WAV, MP3, M4A, AAC, or FLAC audio file.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Please choose an audio file smaller than 100 MB.");
      event.target.value = "";
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setSelectedFile(file);
    setAudioUrl(URL.createObjectURL(file));

    if (!songTitle.trim()) {
      setSongTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function resetFile() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setSelectedFile(null);
    setAudioUrl("");
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetSubmission() {
    setSubmitted(false);
    setArtistName("");
    setSongTitle("");
    setMasteringNotes("");
    setProgressMessage("");
    setErrorMessage("");
    resetFile();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Choose a track before submitting.");
      return;
    }

    if (!artistName.trim()) {
      setErrorMessage("Enter your artist name.");
      return;
    }

    if (!songTitle.trim()) {
      setErrorMessage("Enter your song title.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setProgressMessage("Checking your Crucible account...");

    let uploadedPath = "";

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login?next=/mastering");
        return;
      }

      const safeFileName = cleanFileName(selectedFile.name);
      uploadedPath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

      setProgressMessage("Securely uploading your track...");

      const { error: uploadError } = await supabase.storage
        .from("mastering-uploads")
        .upload(uploadedPath, selectedFile, {
          cacheControl: "3600",
          contentType: selectedFile.type || "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setProgressMessage("Creating your free sample request...");

      const { error: requestError } = await supabase
        .from("mastering_requests")
        .insert({
          user_id: user.id,
          email: user.email ?? "",
          file_name: selectedFile.name,
          file_path: uploadedPath,
          file_size: selectedFile.size,
          artist_name: artistName.trim(),
          song_title: songTitle.trim(),
          mastering_notes: masteringNotes.trim() || null,
          service_type: "free_quick_sample",
          status: "submitted",
          giveaway_entry: true,
        });

      if (requestError) {
        await supabase.storage
          .from("mastering-uploads")
          .remove([uploadedPath]);

        throw new Error(requestError.message);
      }

      setSubmitted(true);
      setProgressMessage("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your request could not be submitted.";

      setErrorMessage(message);
      setProgressMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070403] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-orange-300/20 border-t-orange-400" />

          <p className="mt-5 text-sm text-white/50">
            Opening the mastering forge...
          </p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070403] px-5 py-12 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(249,115,22,.2),transparent_35%),linear-gradient(to_bottom,#100804,#070403_52%,#020202)]" />

        <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-orange-300/25 bg-black/55 p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,.7)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-300/25 bg-green-400/10 text-3xl text-green-200">
            ✓
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
            Submission received
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your track entered the Forge.
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/55">
            Your song was securely uploaded for a free quick-remaster sample.
            Your account was also entered for a chance to win a complete
            Justice Full Forge remaster and distribution.
          </p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Submitted track
            </p>

            <p className="mt-2 font-semibold text-white">{songTitle}</p>

            <p className="mt-1 text-sm text-white/45">{artistName}</p>

            {masteringNotes.trim() && (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                  Requested improvements
                </p>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  {masteringNotes}
                </p>
              </>
            )}
          </div>

          <p className="mt-6 text-xs leading-5 text-white/35">
            The free quick-remaster is a short sample, not a completed
            full-song master. A giveaway entry does not guarantee selection as
            the winner.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/studio")}
              className="flex-1 rounded-2xl bg-orange-400 px-5 py-4 text-sm font-bold text-black transition hover:bg-orange-300"
            >
              Enter the Studio
            </button>

            <button
              type="button"
              onClick={resetSubmission}
              className="flex-1 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white transition hover:border-orange-300/40"
            >
              Submit Another Track
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070403] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(249,115,22,.18),transparent_34%),linear-gradient(to_bottom,#100804,#070403_52%,#020202)]" />

      <header className="relative z-20 flex min-h-16 items-center justify-between gap-4 border-b border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl md:px-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
            Crucible Mastering
          </p>

          <p className="text-[10px] text-white/35">
            Free quick-remaster sample
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
              Your signup reward
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              Hear a free sample of your track forged.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
              Upload one song to request a short quick-remaster sample. Your
              submission also enters you for a chance to win a complete Justice
              Full Forge remaster and distribution.
            </p>

            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
              <span className="rounded-full border border-green-300/20 bg-green-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-green-200">
                Free sample
              </span>

              <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-200">
                Giveaway entry included
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                You keep your rights
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-[2rem] border border-orange-300/20 bg-black/35 p-4 shadow-[0_30px_100px_rgba(0,0,0,.6)] md:p-7"
          >
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
                className="flex min-h-[320px] w-full flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-orange-300/30 bg-gradient-to-b from-orange-500/[0.08] to-black/20 px-6 text-center transition hover:border-orange-300/60 hover:bg-orange-500/[0.12]"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-orange-300/25 bg-orange-400/10 text-4xl text-orange-100 shadow-[0_0_60px_rgba(249,115,22,.18)]">
                  ◉
                </div>

                <h2 className="mt-7 text-2xl font-semibold">
                  Choose your song
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  WAV, MP3, M4A, AAC, or FLAC · Maximum 100 MB
                </p>
              </button>
            ) : (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 md:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-sm text-white/40">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetFile}
                    disabled={submitting}
                    className="text-left text-sm font-medium text-orange-200 transition hover:text-orange-100 disabled:opacity-40"
                  >
                    Choose another file
                  </button>
                </div>

                {audioUrl && (
                  <audio controls src={audioUrl} className="mt-6 w-full" />
                )}
              </div>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="artistName"
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50"
                >
                  Artist name
                </label>

                <input
                  id="artistName"
                  type="text"
                  required
                  maxLength={100}
                  value={artistName}
                  onChange={(event) => setArtistName(event.target.value)}
                  placeholder="Your artist name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50"
                />
              </div>

              <div>
                <label
                  htmlFor="songTitle"
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50"
                >
                  Song title
                </label>

                <input
                  id="songTitle"
                  type="text"
                  required
                  maxLength={150}
                  value={songTitle}
                  onChange={(event) => setSongTitle(event.target.value)}
                  placeholder="Title of your song"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="masteringNotes"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50"
              >
                What should sound better?{" "}
                <span className="normal-case tracking-normal text-white/25">
                  Optional
                </span>
              </label>

              <textarea
                id="masteringNotes"
                rows={4}
                maxLength={1000}
                value={masteringNotes}
                onChange={(event) => setMasteringNotes(event.target.value)}
                placeholder="Examples: stronger bass, clearer vocals, louder overall, less harsh..."
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50"
              />
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100">
                {errorMessage}
              </div>
            )}

            {progressMessage && (
              <div className="mt-5 rounded-2xl border border-orange-300/20 bg-orange-400/10 px-4 py-3 text-sm leading-6 text-orange-100">
                {progressMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedFile}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting
                ? "Sending Track Through the Forge..."
                : "Claim My Free Quick-Remaster Sample"}
            </button>

            <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-white/35">
              By submitting, you confirm that you own the song or have
              permission to upload it. The free sample is a short preview and
              does not guarantee selection as the full-remaster and
              distribution giveaway winner.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
