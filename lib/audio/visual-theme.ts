export const AUDIO_PARAMETER_COLORS = {
  waveform: "#38bdf8",
  eq: "#fb923c",
  pan: "#f472b6",
  stereo: "#22d3ee",
  reverb: "#a78bfa",
  delay: "#60a5fa",
  dynamics: "#c084fc",
  loudness: "#fbbf24",
  phase: "#34d399",
} as const;

export type AudioParameterColor = keyof typeof AUDIO_PARAMETER_COLORS;

export const AUDIO_PARAMETER_LABELS: Record<AudioParameterColor, string> = {
  waveform: "Waveform",
  eq: "EQ",
  pan: "Pan",
  stereo: "Stereo",
  reverb: "Reverb",
  delay: "Delay",
  dynamics: "Dynamics",
  loudness: "Loudness",
  phase: "Phase",
};
