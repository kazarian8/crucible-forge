from pathlib import Path
import re

p = Path("components/sound-furnace/StemSequencer.tsx")
s = p.read_text()

def once(old, new, label):
    global s
    if s.count(old) != 1:
        raise SystemExit(f"{label}: {s.count(old)} matches")
    s = s.replace(old, new, 1)

once(
    '  const recordingChunksRef = useRef<Blob[]>([]);\n  const clipDragRef = useRef<ClipDrag | null>(null);',
    '  const recordingChunksRef = useRef<Blob[]>([]);\n  const recordingTargetIdRef = useRef("");\n  const recordingStartSecondsRef = useRef(0);\n  const clipDragRef = useRef<ClipDrag | null>(null);',
    "refs",
)

lane = '''  async function addVocalLane() {
    if (tracks.length >= MAX_TRACKS) return;
    setError("");
    const context = new AudioContext();
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * 0.05)), context.sampleRate);
    await context.close();
    const laneNumber = tracks.filter((track) => VOCAL_TRACK_PATTERN.test(track.name)).length + 1;
    const start = Math.min(playheadSeconds, rulerDuration);
    const track: StemTrack = {
      id: crypto.randomUUID(), name: `Vocal ${laneNumber}`, buffer,
      startSeconds: start, originalStartSeconds: start,
      trimStartSeconds: 0, trimEndSeconds: buffer.duration,
      fadeInSeconds: 0, fadeOutSeconds: 0, gainDb: 0, muted: false, solo: false,
      effects: { enabled: false, preset: "clear", intensity: 50, focusNote: projectKey, octave: 3 },
    };
    setTracks((current) => [...current, track]);
    setSelectedTrackId(track.id);
    setCadenceReferenceId((current) => current || track.id);
    setStatus(`${track.name} lane added. It is highlighted and ready to record.`);
  }

'''
marker = '  async function startVocalRecording() {\n'
if s.count(marker) != 1:
    raise SystemExit("start marker missing")
s = s.replace(marker, lane + marker, 1)

record = '''  async function startVocalRecording() {
    const target = selectedTrack;
    if (!target) {
      setError("Highlight a sequencer lane before recording.");
      setStatus("Choose the lane you want to record onto.");
      return;
    }
    setError("");
    recordingTargetIdRef.current = target.id;
    recordingStartSecondsRef.current = playheadSeconds;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const preferredType = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || preferredType || "audio/webm";
        const blob = new Blob(recordingChunksRef.current, { type });
        const targetId = recordingTargetIdRef.current;
        const recordStart = recordingStartSecondsRef.current;
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        recordingTargetIdRef.current = "";
        setRecording(false);
        setStatus("Recording captured. Loading it onto the highlighted lane…");
        void (async () => {
          try {
            const context = new AudioContext();
            const buffer = await context.decodeAudioData((await blob.arrayBuffer()).slice(0));
            await context.close();
            const audible = detectAudibleRange(buffer);
            setTracks((current) => current.map((track) => track.id === targetId ? {
              ...track,
              name: VOCAL_TRACK_PATTERN.test(track.name) ? track.name : `Vocal · ${track.name}`,
              buffer, startSeconds: recordStart, originalStartSeconds: recordStart,
              trimStartSeconds: audible.start, trimEndSeconds: audible.end,
              fadeInSeconds: Math.min(0.02, Math.max(0, (audible.end - audible.start) / 2)),
              fadeOutSeconds: Math.min(0.04, Math.max(0, (audible.end - audible.start) / 2)),
            } : track));
            setSelectedTrackId(targetId);
            setCadenceProfiles({});
            setCadenceSuggestions({});
            setStatus("Recorded directly onto the highlighted lane. The vocal waveform is shown in red.");
          } catch {
            setError("The recording was captured but could not be decoded into the lane.");
            setStatus("The selected lane was left unchanged.");
          }
        })();
      };
      recorder.start(250);
      setRecording(true);
      setStatus(`Recording onto ${target.name}…`);
    } catch {
      recordingTargetIdRef.current = "";
      setError("Microphone access is required to record onto the selected lane.");
      setStatus("Recording did not start.");
    }
  }

'''
pattern = re.compile(r'  async function startVocalRecording\(\) \{.*?\n  function stopVocalRecording\(\) \{', re.S)
if len(pattern.findall(s)) != 1:
    raise SystemExit("record function pattern mismatch")
s = pattern.sub(record + '  function stopVocalRecording() {', s, count=1)

old_button = '''            onClick={recording ? stopVocalRecording : () => void startVocalRecording()}
            disabled={busy || tracks.length >= MAX_TRACKS}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black disabled:opacity-40 ${recording ? "border-red-400/40 bg-red-500/15 text-red-100" : "border-emerald-300/20 bg-emerald-400/[0.06] text-emerald-100"}`}
          >
            {recording ? <CircleStop size={15} fill="currentColor" /> : <Mic size={15} />}
            {recording ? "Stop vocal" : "New vocal track"}'''
new_button = '''            onClick={() => void addVocalLane()}
            disabled={busy || tracks.length >= MAX_TRACKS || recording}
            className="flex items-center gap-2 rounded-xl border border-red-300/20 bg-red-400/[0.06] px-4 py-2.5 text-xs font-black text-red-100 disabled:opacity-40"
          >
            <Mic size={15} /> Add vocal lane'''
once(old_button, new_button, "vocal button")

time_line = '              <p className="font-mono text-sm font-black tabular-nums text-orange-100">{formatTime(playheadSeconds)}</p>'
record_button = time_line + '''
              <button
                type="button"
                onClick={recording ? stopVocalRecording : () => void startVocalRecording()}
                disabled={busy || !selectedTrack}
                aria-label={recording ? "Stop recording" : `Record onto ${selectedTrack?.name ?? "selected lane"}`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-wider disabled:opacity-35 ${recording ? "bg-red-500 text-white" : "border border-red-300/25 bg-red-400/[0.08] text-red-100"}`}
              >
                {recording ? <CircleStop size={13} fill="currentColor" /> : <Mic size={13} />}
                {recording ? "Stop" : "Record"}
              </button>'''
once(time_line, record_button, "record button")

for old, new in {
    'style={{ width: `${Math.round(760 * timelineZoom)}px`, minWidth: "760px" }}':
      'style={{ width: `${Math.round(980 * timelineZoom)}px`, minWidth: "980px" }}',
    'className="grid grid-cols-[150px_1fr] border-b border-white/10 bg-[#0d0b0a]"':
      'className="grid grid-cols-[170px_1fr] border-b border-white/10 bg-[#0d0b0a]"',
    'left: `calc(150px + (100% - 150px) * ${Math.min(1, playheadSeconds / rulerDuration)})`':
      'left: `calc(170px + (100% - 170px) * ${Math.min(1, playheadSeconds / rulerDuration)})`',
    'className={`grid h-[84px] grid-cols-[150px_1fr] border-b border-white/[0.07] last:border-b-0 ${inactive ? "opacity-45" : ""}`}':
      'className={`grid h-[96px] grid-cols-[170px_1fr] border-b border-white/[0.07] last:border-b-0 ${inactive ? "opacity-45" : ""}`}',
}.items():
    once(old, new, "timeline")

p.write_text(s)
