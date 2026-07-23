"use client";

import { useVoice } from "@/hooks/useVoice";

export default function VoiceLogger({
  language,
  onInterimTranscript,
  onFinalTranscript,
  onError,
}: {
  language: "en" | "hi";
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (message: string) => void;
}) {
  const { status, waveform, seconds, start, stop } = useVoice({
    language,
    onInterimTranscript,
    onFinalTranscript,
    onError,
  });

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={start}
        aria-label="Log by voice"
        className="flex h-11 w-11 items-center justify-center rounded-button border border-border text-lg"
      >
        🎤
      </button>
    );
  }

  if (status === "processing") {
    return (
      <div
        aria-live="polite"
        className="flex h-11 items-center gap-2 rounded-button border border-accent bg-accent/10 px-3 text-xs text-accent"
      >
        Transcribing...
      </div>
    );
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <button
      type="button"
      onClick={stop}
      aria-label="Stop recording"
      className="flex h-11 items-center gap-2 rounded-button border border-accent bg-accent/10 px-3"
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
      <span className="flex items-end gap-0.5">
        {waveform.map((level, i) => (
          <span
            key={i}
            style={{ height: `${4 + level * 20}px` }}
            className="w-1 rounded-full bg-accent transition-all duration-100"
          />
        ))}
      </span>
      <span className="font-mono text-xs text-accent">
        {mm}:{ss}
      </span>
    </button>
  );
}
