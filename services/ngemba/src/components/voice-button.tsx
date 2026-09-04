"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconMic,
  IconPause,
  IconPlay,
  IconStop,
  IconTrash,
  IconWaveform,
} from "@/components/icons";
import { COMPOSE_VOICE_MAX_SEC } from "@/lib/compose/limits";

type Props = {
  locale: string;
  label: string;
  listeningLabel: string;
  unsupportedLabel: string;
  /** Live / final STT text → parent textarea. */
  onText: (text: string) => void;
  /** Recorded audio blob for upload; null when deleted. */
  onAudioChange?: (blob: Blob | null) => void;
  discrete?: boolean;
};

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{
          isFinal?: boolean;
          0: { transcript: string };
        }>;
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const LANG_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ln: "fr-FR",
  sw: "sw-KE",
  lua: "fr-FR",
  kg: "fr-FR",
};

function getSpeechRecognition(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

function formatSec(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function VoiceButton({
  locale,
  label,
  listeningLabel,
  unsupportedLabel,
  onText,
  onAudioChange,
  discrete = false,
}: Props) {
  const [recSupported, setRecSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [leftSec, setLeftSec] = useState(COMPOSE_VOICE_MAX_SEC);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [sttOk, setSttOk] = useState(true);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<Rec | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    setRecSupported(
      typeof window !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined",
    );
  }, []);

  useEffect(() => {
    return () => {
      stopAll(true);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopSpeech() {
    try {
      speechRef.current?.stop();
    } catch {
      // ignore
    }
    speechRef.current = null;
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function stopAll(silent = false) {
    clearTimer();
    stopSpeech();
    const rec = mediaRecRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
    mediaRecRef.current = null;
    stopStream();
    if (!silent) setRecording(false);
  }

  function revokePreview() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setPlaying(false);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
  }

  function deleteAudio() {
    stopAll(true);
    revokePreview();
    onAudioChange?.(null);
    setLeftSec(COMPOSE_VOICE_MAX_SEC);
  }

  async function startRecording() {
    if (recording) return;
    revokePreview();
    onAudioChange?.(null);
    setSttOk(true);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setRecSupported(false);
      return;
    }
    streamRef.current = stream;

    const mime = pickMime();
    const mediaRec = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    mediaRecRef.current = mediaRec;
    mediaRec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRec.onstop = () => {
      const type = mediaRec.mimeType || mime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAudioChange?.(blob);
      }
      stopStream();
      setRecording(false);
      clearTimer();
    };

    mediaRec.start(250);
    startedAtRef.current = Date.now();
    setLeftSec(COMPOSE_VOICE_MAX_SEC);
    setRecording(true);

    // Parallel browser STT → textarea (best effort; audio is source of truth).
    const SR = getSpeechRecognition();
    if (SR) {
      const speech = new SR();
      speechRef.current = speech;
      speech.lang = LANG_MAP[locale] || "fr-FR";
      speech.continuous = true;
      speech.interimResults = true;
      speech.maxAlternatives = 1;
      let lastFinal = "";
      speech.onresult = (event) => {
        let piece = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const t = r?.[0]?.transcript?.trim();
          if (!t) continue;
          if (r.isFinal) {
            if (t !== lastFinal) {
              lastFinal = t;
              onText(t);
            }
          } else {
            piece = t;
          }
        }
        // interim ignored for textarea stability — finals only
        void piece;
      };
      speech.onerror = () => setSttOk(false);
      speech.onend = () => {
        // Keep recording even if STT ends early.
      };
      try {
        speech.start();
      } catch {
        setSttOk(false);
      }
    } else {
      setSttOk(false);
    }

    clearTimer();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const left = COMPOSE_VOICE_MAX_SEC - elapsed;
      setLeftSec(left);
      if (left <= 0) stopRecording();
    }, 200);
  }

  function stopRecording() {
    stopSpeech();
    clearTimer();
    const rec = mediaRecRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        setRecording(false);
        stopStream();
      }
    } else {
      setRecording(false);
      stopStream();
    }
  }

  function togglePlay() {
    if (!audioUrl) return;
    if (!audioElRef.current) {
      audioElRef.current = new Audio(audioUrl);
      audioElRef.current.onended = () => setPlaying(false);
    }
    const el = audioElRef.current;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  if (!recSupported) {
    return <p className="text-xs text-ng-muted">{unsupportedLabel}</p>;
  }

  const btnBase = discrete
    ? "bg-white/10 text-[#e8d4e3]"
    : "bg-ng-primary-muted text-ng-primary";

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {!recording && !audioUrl ? (
          <button
            type="button"
            onClick={() => void startRecording()}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${btnBase}`}
          >
            <IconMic className="size-4" />
            {label}
          </button>
        ) : null}

        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ng-urgent px-3 text-sm font-semibold text-white"
            aria-label={listeningLabel}
          >
            <IconWaveform active className="h-5 w-10 text-white" />
            <span className="tabular-nums">{formatSec(leftSec)}</span>
            <IconStop className="size-4" />
          </button>
        ) : null}

        {audioUrl && !recording ? (
          <div
            className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-1 ${
              discrete ? "bg-white/10" : "bg-ng-primary-muted"
            }`}
          >
            <button
              type="button"
              onClick={togglePlay}
              className={`inline-flex size-10 items-center justify-center rounded-lg ${
                discrete ? "text-[#e8d4e3]" : "text-ng-primary"
              }`}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <IconPause className="size-5" />
              ) : (
                <IconPlay className="size-5" />
              )}
            </button>
            <IconWaveform className={`h-5 w-10 ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`} />
            <button
              type="button"
              onClick={deleteAudio}
              className="inline-flex size-10 items-center justify-center rounded-lg text-ng-urgent"
              aria-label="Delete"
            >
              <IconTrash className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {!sttOk && audioUrl ? (
        <p className="text-[10px] text-ng-muted">Audio · photo · texte</p>
      ) : null}
    </div>
  );
}
