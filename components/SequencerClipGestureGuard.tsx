"use client";

import { useEffect } from "react";

const DOUBLE_TAP_MS = 380;
const HOLD_MS = 180;

export default function SequencerClipGestureGuard() {
  useEffect(() => {
    const lastTap = new WeakMap<HTMLElement, number>();
    const active = new Map<number, { clip: HTMLElement; unlocked: boolean; timer: number | null }>();

    const findClip = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>(".cursor-grab") : null;

    const clearPointer = (pointerId: number) => {
      const state = active.get(pointerId);
      if (state?.timer !== null && state?.timer !== undefined) {
        window.clearTimeout(state.timer);
      }
      active.delete(pointerId);
    };

    const onPointerDown = (event: PointerEvent) => {
      const clip = findClip(event.target);
      if (!clip) return;

      const now = performance.now();
      const previous = lastTap.get(clip) ?? -Infinity;
      const secondTap = now - previous <= DOUBLE_TAP_MS;
      lastTap.set(clip, secondTap ? -Infinity : now);

      const state = { clip, unlocked: false, timer: null as number | null };
      active.set(event.pointerId, state);

      if (secondTap) {
        state.timer = window.setTimeout(() => {
          const current = active.get(event.pointerId);
          if (!current || current.clip !== clip) return;
          current.unlocked = true;
          current.timer = null;
        }, HOLD_MS);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const state = active.get(event.pointerId);
      if (!state || state.unlocked) return;

      // A normal touch, first tap, or second tap released before the hold
      // must never reach the sequencer's drag handler.
      event.preventDefault();
      event.stopPropagation();
    };

    const onPointerEnd = (event: PointerEvent) => clearPointer(event.pointerId);

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
    document.addEventListener("pointerup", onPointerEnd, true);
    document.addEventListener("pointercancel", onPointerEnd, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerEnd, true);
      document.removeEventListener("pointercancel", onPointerEnd, true);
      active.forEach((state) => {
        if (state.timer !== null) window.clearTimeout(state.timer);
      });
      active.clear();
    };
  }, []);

  return null;
}
