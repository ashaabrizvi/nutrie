"use client";

import { useCallback, useRef, useState } from "react";

type VoiceStatus = "idle" | "recording" | "processing";

interface UseVoiceOptions {
  language: "en" | "hi";
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (message: string) => void;
}

const SILENCE_TIMEOUT_MS = 3000;
const WAVEFORM_BARS = 5;

function hasSpeechRecognition(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function useVoice({ language, onInterimTranscript, onFinalTranscript, onError }: UseVoiceOptions) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [waveform, setWaveform] = useState<number[]>(new Array(WAVEFORM_BARS).fill(0));
  const [seconds, setSeconds] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setWaveform(new Array(WAVEFORM_BARS).fill(0));
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    clearSilenceTimer();
    stopWaveform();
    stopTimer();
    stopStream();
    recognitionRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, [clearSilenceTimer, stopWaveform, stopTimer, stopStream]);

  const startWaveform = useCallback(async (stream: MediaStream) => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const sample = () => {
        analyser.getByteFrequencyData(data);
        const step = Math.floor(data.length / WAVEFORM_BARS) || 1;
        const bars: number[] = [];
        for (let i = 0; i < WAVEFORM_BARS; i++) {
          bars.push(data[i * step] / 255);
        }
        setWaveform(bars);
        rafRef.current = requestAnimationFrame(sample);
      };
      sample();
    } catch {
      // Waveform is cosmetic — silently skip if unavailable.
    }
  }, []);

  const startTimer = useCallback(() => {
    setSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const finishRecognition = useCallback(
    (transcript: string) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearSilenceTimer();

      const trimmed = transcript.trim();
      if (!trimmed) {
        cleanup();
        setStatus("idle");
        onError("Nothing heard — please try again");
        return;
      }

      cleanup();
      setStatus("idle");
      onFinalTranscript(trimmed);
    },
    [cleanup, clearSilenceTimer, onError, onFinalTranscript],
  );

  const startWithSpeechRecognition = useCallback(
    (stream: MediaStream) => {
      const SpeechRecognitionClass = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
      const recognition = new SpeechRecognitionClass();
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      let finalTranscript = "";
      finishedRef.current = false;

      const resetSilenceTimer = () => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          recognition.stop();
        }, SILENCE_TIMEOUT_MS);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += `${result[0].transcript} `;
          } else {
            interim += result[0].transcript;
          }
        }
        onInterimTranscript?.((finalTranscript + interim).trim());
        resetSilenceTimer();
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          finishedRef.current = true;
          clearSilenceTimer();
          cleanup();
          setStatus("idle");
          onError("Microphone access needed");
          return;
        }
        if (event.error === "no-speech") {
          finishRecognition(finalTranscript);
          return;
        }
        finishedRef.current = true;
        clearSilenceTimer();
        cleanup();
        setStatus("idle");
        onError("Something went wrong — try again");
      };

      recognition.onend = () => {
        finishRecognition(finalTranscript);
      };

      recognition.start();
      resetSilenceTimer();
      startWaveform(stream);
      startTimer();
      setStatus("recording");
    },
    [cleanup, clearSilenceTimer, finishRecognition, language, onError, onInterimTranscript, startTimer, startWaveform],
  );

  const startWithWhisperFallback = useCallback(
    (stream: MediaStream) => {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        clearSilenceTimer();
        stopWaveform();
        stopTimer();
        stopStream();
        setStatus("processing");

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          formData.append("language", language);

          const res = await fetch("/api/voice", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Transcription failed");

          const data = (await res.json()) as { transcript?: string };
          const trimmed = data.transcript?.trim() ?? "";

          setStatus("idle");
          if (!trimmed) {
            onError("Nothing heard — please try again");
          } else {
            onFinalTranscript(trimmed);
          }
        } catch {
          setStatus("idle");
          onError("Something went wrong — try again");
        }
      };

      mediaRecorder.start();
      startWaveform(stream);
      startTimer();
      setStatus("recording");

      const resetSilenceTimer = () => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }, SILENCE_TIMEOUT_MS);
      };
      resetSilenceTimer();
    },
    [clearSilenceTimer, language, onError, onFinalTranscript, startTimer, startWaveform, stopStream, stopTimer, stopWaveform],
  );

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (hasSpeechRecognition()) {
        startWithSpeechRecognition(stream);
      } else {
        startWithWhisperFallback(stream);
      }
    } catch {
      onError("Microphone access needed");
    }
  }, [onError, startWithSpeechRecognition, startWithWhisperFallback]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [clearSilenceTimer]);

  return { status, waveform, seconds, start, stop };
}
