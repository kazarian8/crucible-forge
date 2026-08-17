const fs = require('fs');

const path = 'components/sound-furnace/StemSequencer.tsx';
let text = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const first = text.indexOf(oldText);
  if (first === -1) throw new Error(`${label}: source text not found`);
  if (text.indexOf(oldText, first + 1) !== -1) throw new Error(`${label}: source text matched more than once`);
  text = text.replace(oldText, newText);
}

if (!text.includes('clipLastTapRef')) {
  replaceOnce(
    '  const clipDragRef = useRef<ClipDrag | null>(null);\n',
    '  const clipDragRef = useRef<ClipDrag | null>(null);\n' +
      '  const clipLastTapRef = useRef<{ trackId: string; at: number } | null>(null);\n' +
      '  const clipArmedPointerRef = useRef<number | null>(null);\n',
    'gesture refs',
  );
}

const oldHandlers = `  function beginClipDrag(event: ReactPointerEvent<HTMLElement>, track: StemTrack) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const timeline = event.currentTarget.parentElement;
    clipDragRef.current = {
      trackId: track.id,
      startX: event.clientX,
      startSeconds: track.startSeconds,
      timelineWidth: Math.max(1, timeline?.clientWidth ?? event.currentTarget.clientWidth),
    };
    setSelectedTrackId(track.id);
  }

  function moveClip(event: ReactPointerEvent<HTMLElement>) {
    const drag = clipDragRef.current;
    if (!drag) return;
    const raw = Math.max(0, drag.startSeconds + ((event.clientX - drag.startX) / drag.timelineWidth) * rulerDuration);
    const snapMultipliers: Record<string, number> = { "1/4": 1, "1/8": 0.5, "1/16": 0.25, "1/32": 0.125 };
    const snapSeconds = (60 / projectBpm) * (snapMultipliers[snapDivision] ?? 0.25);
    const next = snapEnabled ? Math.round(raw / snapSeconds) * snapSeconds : Math.round(raw * 100) / 100;
    replaceTrack(drag.trackId, { startSeconds: next });
  }

  function endClipDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clipDragRef.current = null;
  }
`;

const newHandlers = `  function beginClipDrag(event: ReactPointerEvent<HTMLElement>, track: StemTrack) {
    setSelectedTrackId(track.id);

    const now = performance.now();
    const previousTap = clipLastTapRef.current;
    const isSecondTap = Boolean(
      previousTap &&
      previousTap.trackId === track.id &&
      now - previousTap.at <= 380
    );

    if (!isSecondTap) {
      // First touch only selects/arms this clip. It must never move the audio.
      clipLastTapRef.current = { trackId: track.id, at: now };
      clipArmedPointerRef.current = null;
      clipDragRef.current = null;
      return;
    }

    // Only the second tap of the double-tap can unlock movement. The user
    // must keep this pointer down while dragging; lifting it locks the clip.
    event.preventDefault();
    clipLastTapRef.current = null;
    clipArmedPointerRef.current = event.pointerId;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
    const timeline = event.currentTarget.parentElement;
    clipDragRef.current = {
      trackId: track.id,
      startX: event.clientX,
      startSeconds: track.startSeconds,
      timelineWidth: Math.max(1, timeline?.clientWidth ?? event.currentTarget.clientWidth),
    };
    setStatus("Track unlocked — keep the second tap held and drag left or right.");
  }

  function moveClip(event: ReactPointerEvent<HTMLElement>) {
    if (clipArmedPointerRef.current !== event.pointerId) return;
    const drag = clipDragRef.current;
    if (!drag) return;
    event.preventDefault();
    const raw = Math.max(0, drag.startSeconds + ((event.clientX - drag.startX) / drag.timelineWidth) * rulerDuration);
    const snapMultipliers: Record<string, number> = { "1/4": 1, "1/8": 0.5, "1/16": 0.25, "1/32": 0.125 };
    const snapSeconds = (60 / projectBpm) * (snapMultipliers[snapDivision] ?? 0.25);
    const next = snapEnabled ? Math.round(raw / snapSeconds) * snapSeconds : Math.round(raw * 100) / 100;
    replaceTrack(drag.trackId, { startSeconds: next });
  }

  function endClipDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (clipArmedPointerRef.current === event.pointerId) {
      clipArmedPointerRef.current = null;
      clipDragRef.current = null;
    }
  }
`;

if (!text.includes('Track unlocked — keep the second tap held and drag left or right.')) {
  replaceOnce(oldHandlers, newHandlers, 'drag handlers');
}

// Keep only the waveform itself color coded: vocals red, instruments blue.
if (!text.includes('const VOCAL_WAVE_COLOR = "#fb7185";') ||
    !text.includes('const INSTRUMENT_WAVE_COLOR = "#60a5fa";') ||
    !text.includes('<TimelineWaveform track={track} waveColor={waveColor} />')) {
  throw new Error('waveform color wiring is missing');
}

fs.writeFileSync(path, text);
