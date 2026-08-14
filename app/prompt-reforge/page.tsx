"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createClient,
  isSupabaseConfigured,
} from "../../lib/supabase/client";
import { CREDITS_UPDATED_EVENT } from "../../components/CreditBalance";
import { CREDIT_PRICES } from "../../lib/credits/pricing";

type Scene = {
  scene_number: number;
  estimated_time: string;
  description: string;
  shot_type: string;
  camera_movement: string;
  lighting: string;
  action: string;
  transition: string;
  generation_prompt: string;
};

type ReforgeAnalysis = {
  title: string;
  summary: string;

  visual_dna: {
    concept: string;
    mood: string;
    subjects: string[];
    environment: string;
    camera: string;
    lighting: string;
    color_palette: string[];
    editing_style: string;
    effects: string[];
    audio_direction: string;
  };

  master_prompt: string;

  scenes: Scene[];

  platform_prompts: {
    capcut: string;
    sora: string;
    veo: string;
    kling: string;
    runway: string;
  };

  negative_prompt: string;
  editing_recipe: string[];
  continuity_rules: string[];
};

function greatestCommonDivisor(a: number, b: number): number {
  let first = a;
  let second = b;

  while (second !== 0) {
    const remainder = first % second;
    first = second;
    second = remainder;
  }

  return first;
}

async function extractVideoFrames(
  file: File,
  numberOfFrames = 10
): Promise<{
  frames: string[];
  duration: number;
  aspectRatio: string;
}> {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not process this video.");
  }

  const objectUrl = URL.createObjectURL(file);

  video.src = objectUrl;
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();

    video.onerror = () => {
      reject(new Error("The video could not be loaded."));
    };
  });

  const duration = video.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("The video duration is invalid.");
  }

  const maximumWidth = 960;
  const scale = Math.min(1, maximumWidth / video.videoWidth);

  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const frames: string[] = [];

  for (let index = 0; index < numberOfFrames; index += 1) {
    const percentage = (index + 0.5) / numberOfFrames;

    video.currentTime = Math.min(
      duration * percentage,
      Math.max(duration - 0.05, 0)
    );

    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();

      video.onerror = () => {
        reject(
          new Error(`Could not extract frame ${index + 1}.`)
        );
      };
    });

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    frames.push(
      canvas.toDataURL("image/jpeg", 0.72)
    );
  }

  const divisor = greatestCommonDivisor(
    video.videoWidth,
    video.videoHeight
  );

  URL.revokeObjectURL(objectUrl);

  return {
    frames,
    duration,
    aspectRatio: `${video.videoWidth / divisor}:${
      video.videoHeight / divisor
    }`,
  };
}

function ResultCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  async function copyText() {
    await navigator.clipboard.writeText(content);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-orange-300">
          {title}
        </h2>

        <button
          type="button"
          onClick={copyText}
          className="rounded-lg border border-orange-400/40 px-3 py-1.5 text-sm text-orange-200 transition hover:bg-orange-400/10"
        >
          Copy
        </button>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">
        {content}
      </p>
    </section>
  );
}

export default function PromptReforgePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] =
    useState<ReforgeAnalysis | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured()) {
      setIsSignedIn(false);
      setCheckingAuth(false);
      router.replace("/login?error=service-unavailable");
      return;
    }

    const supabase = createClient();

    async function checkSession() {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (sessionError || !data.session) {
        setIsSignedIn(false);
        setCheckingAuth(false);
        router.replace("/login");
        return;
      }

      setIsSignedIn(true);
      setCheckingAuth(false);
    }

    checkSession();

    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) {
          return;
        }

        if (!session) {
          setIsSignedIn(false);
          router.replace("/login");
          return;
        }

        setIsSignedIn(true);
        setCheckingAuth(false);
      });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  function handleVideoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    setVideoFile(file);
    setAnalysis(null);
    setError("");
    setStatus("");
  }

  async function handleReforge() {
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    if (!videoFile) {
      setError("Choose a video first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      setStatus("Extracting visual frames...");

      const extracted = await extractVideoFrames(
        videoFile,
        10
      );

      setStatus("Analyzing the video’s visual DNA...");

      const response = await fetch(
        "/api/prompt-reforge",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            frames: extracted.frames,
            duration: extracted.duration,
            aspectRatio: extracted.aspectRatio,
            userNotes: notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Prompt Reforge failed."
        );
      }

      setAnalysis(result.analysis);
      window.dispatchEvent(new Event(CREDITS_UPDATED_EVENT));
      setStatus("Reforge complete.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.";

      setError(message);
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth || !isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
            Crucible
          </p>
          <p className="mt-4 text-zinc-300">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
            Crucible
          </p>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Prompt Reforge
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Upload any video. Break down its visual DNA.
            Reforge it into a production-ready prompt.
          </p>
        </div>

        <section className="rounded-3xl border border-orange-500/20 bg-zinc-900/70 p-5 shadow-2xl sm:p-8">
          <label className="block">
            <span className="mb-3 block text-sm font-semibold text-zinc-200">
              Upload your video
            </span>

            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="block w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:font-semibold file:text-black"
            />
          </label>

          {videoFile && (
            <p className="mt-3 text-sm text-zinc-400">
              Selected: {videoFile.name}
            </p>
          )}

          <label className="mt-6 block">
            <span className="mb-3 block text-sm font-semibold text-zinc-200">
              Optional creative notes
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={5}
              placeholder="Example: Preserve the dark redwood atmosphere, cinematic pacing, handheld movement and deep shadows."
              className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-orange-500"
            />
          </label>

          <button
            type="button"
            onClick={handleReforge}
            disabled={loading || !videoFile}
            className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Reforging Video..."
              : `Reforge This Video · ${CREDIT_PRICES.promptReforge} coins`}
          </button>

          {status && (
            <p className="mt-4 text-center text-sm text-orange-300">
              {status}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </p>
          )}
        </section>

        {analysis && (
          <div className="mt-10 space-y-6">
            <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-b from-orange-500/10 to-black p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-orange-300">
                Reforged Analysis
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {analysis.title}
              </h2>

              <p className="mt-4 leading-7 text-zinc-300">
                {analysis.summary}
              </p>
            </section>

            <ResultCard
              title="Master Recreation Prompt"
              content={analysis.master_prompt}
            />

            <ResultCard
              title="CapCut Prompt"
              content={analysis.platform_prompts.capcut}
            />

            <ResultCard
              title="Sora Prompt"
              content={analysis.platform_prompts.sora}
            />

            <ResultCard
              title="Veo Prompt"
              content={analysis.platform_prompts.veo}
            />

            <ResultCard
              title="Kling Prompt"
              content={analysis.platform_prompts.kling}
            />

            <ResultCard
              title="Runway Prompt"
              content={analysis.platform_prompts.runway}
            />

            <ResultCard
              title="Negative Prompt"
              content={analysis.negative_prompt}
            />

            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <h2 className="mb-4 text-lg font-semibold text-orange-300">
                Visual DNA
              </h2>

              <div className="space-y-3 text-sm leading-7 text-zinc-200">
                <p>
                  <strong>Concept:</strong>{" "}
                  {analysis.visual_dna.concept}
                </p>

                <p>
                  <strong>Mood:</strong>{" "}
                  {analysis.visual_dna.mood}
                </p>

                <p>
                  <strong>Environment:</strong>{" "}
                  {analysis.visual_dna.environment}
                </p>

                <p>
                  <strong>Camera:</strong>{" "}
                  {analysis.visual_dna.camera}
                </p>

                <p>
                  <strong>Lighting:</strong>{" "}
                  {analysis.visual_dna.lighting}
                </p>

                <p>
                  <strong>Editing:</strong>{" "}
                  {analysis.visual_dna.editing_style}
                </p>

                <p>
                  <strong>Audio:</strong>{" "}
                  {analysis.visual_dna.audio_direction}
                </p>

                <p>
                  <strong>Colors:</strong>{" "}
                  {analysis.visual_dna.color_palette.join(
                    ", "
                  )}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <h2 className="mb-5 text-lg font-semibold text-orange-300">
                Scene Breakdown
              </h2>

              <div className="space-y-5">
                {analysis.scenes.map((scene) => (
                  <article
                    key={scene.scene_number}
                    className="rounded-xl border border-white/10 bg-zinc-900 p-4"
                  >
                    <h3 className="font-bold">
                      Scene {scene.scene_number}
                    </h3>

                    <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                      {scene.estimated_time}
                    </p>

                    <p className="mt-3 text-sm leading-7 text-zinc-300">
                      {scene.description}
                    </p>

                    <p className="mt-3 whitespace-pre-wrap rounded-lg bg-black/50 p-3 text-sm leading-7 text-orange-100">
                      {scene.generation_prompt}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <h2 className="mb-4 text-lg font-semibold text-orange-300">
                Editing Recipe
              </h2>

              <ol className="space-y-3">
                {analysis.editing_recipe.map(
                  (step, index) => (
                    <li
                      key={`${step}-${index}`}
                      className="text-sm leading-7 text-zinc-300"
                    >
                      <strong className="text-orange-300">
                        {index + 1}.
                      </strong>{" "}
                      {step}
                    </li>
                  )
                )}
              </ol>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <h2 className="mb-4 text-lg font-semibold text-orange-300">
                Continuity Rules
              </h2>

              <ul className="space-y-3">
                {analysis.continuity_rules.map(
                  (rule, index) => (
                    <li
                      key={`${rule}-${index}`}
                      className="text-sm leading-7 text-zinc-300"
                    >
                      • {rule}
                    </li>
                  )
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
