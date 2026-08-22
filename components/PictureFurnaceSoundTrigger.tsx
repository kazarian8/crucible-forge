"use client";

import { useEffect } from "react";

function playFurnaceSound() {
  try {
    const context = new AudioContext();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    master.connect(context.destination);

    const fireBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 1.1), context.sampleRate);
    const fireData = fireBuffer.getChannelData(0);
    for (let i = 0; i < fireData.length; i += 1) {
      fireData[i] = (Math.random() * 2 - 1) * (1 - i / fireData.length);
    }
    const fire = context.createBufferSource();
    fire.buffer = fireBuffer;
    const fireFilter = context.createBiquadFilter();
    fireFilter.type = "lowpass";
    fireFilter.frequency.setValueAtTime(700, now);
    fireFilter.frequency.exponentialRampToValueAtTime(190, now + 1.05);
    fire.connect(fireFilter).connect(master);
    fire.start(now);

    const hammer = context.createOscillator();
    const hammerGain = context.createGain();
    hammer.type = "square";
    hammer.frequency.setValueAtTime(170, now + 0.18);
    hammer.frequency.exponentialRampToValueAtTime(48, now + 0.48);
    hammerGain.gain.setValueAtTime(0.0001, now);
    hammerGain.gain.setValueAtTime(0.9, now + 0.18);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
    hammer.connect(hammerGain).connect(master);
    hammer.start(now + 0.18);
    hammer.stop(now + 0.55);

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 1800);
  } catch {
    // Sound is cosmetic; never block an accepted edit if audio is unavailable.
  }
}

export default function PictureFurnaceSoundTrigger() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!button || button.textContent?.trim() !== "Continue") return;
      const panel = button.closest("div");
      const confirmationText = panel?.parentElement?.textContent ?? panel?.textContent ?? "";
      if (!confirmationText.includes("Do you wish to spend")) return;
      playFurnaceSound();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
