"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconMic,
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
  onText: (text: string) => void;
  onAudioChange?: (blob: Blob | null) => void;
  discrete?: boolean;
  /** Stretch to fill parent (e.g. 80% row). */
  className?: string;
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

/**
 * Safari lit surtout mp4/aac ; Chrome/Firefox webm.
 * On choisit le premier format supporté pour enregistrement ET lecture locale.
 */
function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Android/i.test(ua);
  const order = isSafari
    ? ["audio/mp4", "audio/aac", "audio/wav", "audio/webm"]
    : [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
      ];
  for (const m of order) {
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
  className = "",
}: Props) {
  const [recSupported, setRecSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [leftSec, setLeftSec] = useState(COMPOSE_VOICE_MAX_SEC);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<Rec | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUrlRef = useRef<string | null>(null);
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
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
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
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
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
      const raw = mediaRec.mimeType || mime || "audio/webm";
      // Strip codecs=… so <audio> maps the MIME correctly.
      const type = raw.split(";")[0].trim() || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
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
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const t = r?.[0]?.transcript?.trim();
          if (!t || !r.isFinal) continue;
          if (t !== lastFinal) {
            lastFinal = t;
            onText(t);
          }
        }
      };
      speech.onerror = () => {};
      speech.onend = () => {};
      try {
        speech.start();
      } catch {
        // STT optional
      }
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
        if (rec.state === "recording") {
          try {
            rec.requestData();
          } catch {
            // optional
          }
        }
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

  if (!recSupported) {
    return (
      <p className={`text-xs text-ng-muted ${className}`}>{unsupportedLabel}</p>
    );
  }

  const btnBase = discrete
    ? "bg-white/10 text-[#e8d4e3]"
    : "bg-ng-primary-muted text-ng-primary";

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {recording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ng-urgent px-3 text-sm font-semibold text-white"
          aria-label={listeningLabel}
        >
          <IconWaveform active className="h-5 w-12 text-white" />
          <span className="tabular-nums text-xs">{formatSec(leftSec)}</span>
          <IconStop className="size-4" />
        </button>
      ) : audioUrl ? (
        <div
          className={`flex min-h-11 w-full items-center gap-1 rounded-xl px-1.5 py-1 ${
            discrete ? "bg-white/10" : "bg-ng-primary-muted"
          }`}
          role="group"
          aria-label="Fichier audio"
        >
          {/* Contrôles natifs = lecture fiable sur Chrome / Safari / Firefox */}
          <audio
            key={audioUrl}
            controls
            preload="metadata"
            src={audioUrl}
            className="min-w-0 flex-1"
            style={{ height: 36 }}
          />
          <button
            type="button"
            onClick={() => void startRecording()}
            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${
              discrete ? "text-[#e8d4e3]" : "text-ng-primary"
            }`}
            aria-label="Reenregistrer"
            title="Reenregistrer"
          >
            <IconMic className="size-4" />
          </button>
          <button
            type="button"
            onClick={deleteAudio}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ng-urgent"
            aria-label="Supprimer"
          >
            <IconTrash className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void startRecording()}
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ${btnBase}`}
          aria-label={label}
        >
          <IconMic className="size-5 shrink-0" />
          <span>{label}</span>
        </button>
      )}
    </div>
  );
}
