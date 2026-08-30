export function playForgeConfirmation() {
  try {
    const browserWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextCtor = window.AudioContext || browserWindow.webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    void context.resume();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.2, now + 0.015);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    master.connect(context.destination);

    const hammer = context.createOscillator();
    const hammerGain = context.createGain();
    hammer.type = "square";
    hammer.frequency.setValueAtTime(180, now);
    hammer.frequency.exponentialRampToValueAtTime(52, now + 0.28);
    hammerGain.gain.setValueAtTime(0.8, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    hammer.connect(hammerGain).connect(master);
    hammer.start(now);
    hammer.stop(now + 0.34);

    for (const [frequency, delay] of [[620, 0.06], [930, 0.11], [1240, 0.16]] as const) {
      const ring = context.createOscillator();
      const ringGain = context.createGain();
      ring.type = "sine";
      ring.frequency.setValueAtTime(frequency, now + delay);
      ringGain.gain.setValueAtTime(0.0001, now);
      ringGain.gain.setValueAtTime(0.26, now + delay);
      ringGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.42);
      ring.connect(ringGain).connect(master);
      ring.start(now + delay);
      ring.stop(now + delay + 0.45);
    }

    window.setTimeout(() => void context.close().catch(() => undefined), 1100);
  } catch {
    // Confirmation sound is cosmetic and must never block saved feedback.
  }
}
