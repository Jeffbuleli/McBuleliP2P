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
  label: string;
  listeningLabel: string;
  unsupportedLabel: string;
  /** Optional live STT into parent text (off by default for SOS). */
  onLiveTranscript?: (text: string) => void;
  locale?: string;
  onRecordingChange?: (recording: boolean) => void;
  onAudioChange?: (blob: Blob | null) => void;
  discrete?: boolean;
  className?: string;
  /** When parent clears audio from the other source (import). */
  resetToken?: number;
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
  onerror: ((ev?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
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

/** Never force wav/mp3 - browsers only support a subset. */
function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/aac",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

function extForMime(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  if (base.includes("mp4") || base.includes("aac") || base.includes("m4a"))
    return "m4a";
  if (base.includes("ogg")) return "ogg";
  if (base.includes("wav")) return "wav";
  return "webm";
}

function formatSec(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function VoiceButton({
  label,
  listeningLabel,
  unsupportedLabel,
  onLiveTranscript,
  locale = "fr",
  onRecordingChange,
  onAudioChange,
  discrete = false,
  className = "",
  resetToken = 0,
}: Props) {
  const [recSupported, setRecSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [leftSec, setLeftSec] = useState(COMPOSE_VOICE_MAX_SEC);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<string | null>(null);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<Rec | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const recordingRef = useRef(false);
  const finalsRef = useRef("");
  const mimeRef = useRef("");

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

  useEffect(() => {
    if (resetToken === 0) return;
    deleteAudio(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  function setRecordingState(v: boolean) {
    recordingRef.current = v;
    setRecording(v);
    onRecordingChange?.(v);
  }

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopSpeech() {
    const speech = speechRef.current;
    speechRef.current = null;
    if (!speech) return;
    try {
      speech.onend = null;
      speech.onresult = null;
      speech.onerror = null;
      speech.stop();
    } catch {
      try {
        speech.abort?.();
      } catch {
        // ignore
      }
    }
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
        if (rec.state === "recording") rec.requestData();
        rec.stop();
      } catch {
        // ignore
      }
    }
    mediaRecRef.current = null;
    stopStream();
    if (!silent) setRecordingState(false);
  }

  function revokePreview() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
    setFileMeta(null);
  }

  function deleteAudio(silentParent = false) {
    stopAll(true);
    revokePreview();
    setLeftSec(COMPOSE_VOICE_MAX_SEC);
    finalsRef.current = "";
    if (!silentParent) onAudioChange?.(null);
  }

  function publishBlob(blob: Blob, elapsedSec: number) {
    const mime = blob.type || mimeRef.current || "audio/webm";
    const file = new File(
      [blob],
      `ngemba-${Date.now()}.${extForMime(mime)}`,
      { type: mime },
    );
    const url = URL.createObjectURL(file);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = url;
    setAudioUrl(url);
    setFileMeta(`${formatSec(elapsedSec)} · ${extForMime(mime)}`);
    onAudioChange?.(file);
  }

  function emitTranscript(finals: string, interim = "") {
    if (!onLiveTranscript) return;
    const live = [finals, interim].filter(Boolean).join(" ").trim();
    onLiveTranscript(live);
  }

  function startSpeech() {
    if (!onLiveTranscript) return;
    const SR = getSpeechRecognition();
    if (!SR) return;
    stopSpeech();
    const speech = new SR();
    speechRef.current = speech;
    speech.lang = LANG_MAP[locale] || "fr-FR";
    speech.continuous = true;
    speech.interimResults = true;
    speech.maxAlternatives = 1;
    speech.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r?.[0]?.transcript?.trim();
        if (!t) continue;
        if (r.isFinal) {
          finalsRef.current = finalsRef.current
            ? `${finalsRef.current} ${t}`
            : t;
        } else {
          interim = interim ? `${interim} ${t}` : t;
        }
      }
      emitTranscript(finalsRef.current, interim);
    };
    speech.onerror = () => {};
    speech.onend = () => {
      if (!recordingRef.current) return;
      window.setTimeout(() => {
        if (!recordingRef.current || speechRef.current !== speech) return;
        try {
          speech.start();
        } catch {
          // ignore
        }
      }, 120);
    };
    try {
      speech.start();
    } catch {
      // STT optional
    }
  }

  async function startRecording() {
    if (recording) return;
    revokePreview();
    onAudioChange?.(null);
    chunksRef.current = [];
    finalsRef.current = "";
    emitTranscript("");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
    } catch {
      setRecSupported(false);
      return;
    }
    streamRef.current = stream;

    const mime = pickMime();
    mimeRef.current = mime;
    const mediaRec = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    mediaRecRef.current = mediaRec;
    mediaRec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRec.onstop = () => {
      const elapsedSec = Math.max(
        0.5,
        (Date.now() - startedAtRef.current) / 1000,
      );
      const raw = mediaRec.mimeType || mime || "audio/webm";
      const type = raw.split(";")[0].trim() || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      stopStream();
      setRecordingState(false);
      clearTimer();
      if (blob.size < 32) return;
      // Keep native browser format - do not force WAV/MP3.
      publishBlob(blob, elapsedSec);
    };

    mediaRec.start(250);
    startedAtRef.current = Date.now();
    setLeftSec(COMPOSE_VOICE_MAX_SEC);
    setRecordingState(true);
    startSpeech();

    clearTimer();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const left = COMPOSE_VOICE_MAX_SEC - elapsed;
      setLeftSec(left);
      if (left <= 0) stopRecording();
    }, 200);
  }

  function stopRecording() {
    clearTimer();
    window.setTimeout(() => stopSpeech(), 280);
    const rec = mediaRecRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        if (rec.state === "recording") rec.requestData();
        rec.stop();
      } catch {
        setRecordingState(false);
        stopStream();
      }
    } else {
      setRecordingState(false);
      stopStream();
    }
  }

  if (!recSupported) {
    return (
      <p className={`text-xs text-ng-muted ${className}`}>{unsupportedLabel}</p>
    );
  }

  const btnBase = discrete
    ? "border-white/15 bg-white/10 text-[#e8d4e3]"
    : "border-[var(--ng-border)] bg-ng-surface text-ng-primary";

  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      {recording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ng-urgent px-3 text-sm font-semibold text-white"
          aria-label={listeningLabel}
        >
          <IconWaveform active className="h-5 w-12 text-white" />
          <span className="tabular-nums text-xs">{formatSec(leftSec)}</span>
          <IconStop className="size-4" />
        </button>
      ) : audioUrl ? (
        <div
          className={`rounded-2xl border px-3 py-3 ${
            discrete
              ? "border-white/15 bg-white/5"
              : "border-[var(--ng-border)] bg-ng-surface"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <IconWaveform
              className={`size-5 shrink-0 ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`}
            />
            <span
              className={`min-w-0 flex-1 truncate text-[11px] font-semibold ${
                discrete ? "text-[#c9a0bc]" : "text-ng-muted"
              }`}
            >
              {fileMeta ?? "Audio"}
            </span>
            <button
              type="button"
              onClick={() => void startRecording()}
              className={`text-[11px] font-semibold underline ${
                discrete ? "text-[#e8d4e3]" : "text-ng-primary"
              }`}
            >
              {label}
            </button>
            <button
              type="button"
              onClick={() => deleteAudio()}
              className="inline-flex size-8 items-center justify-center rounded-lg text-ng-urgent"
              aria-label="Supprimer"
            >
              <IconTrash className="size-4" />
            </button>
          </div>
          <audio
            key={audioUrl}
            controls
            preload="auto"
            playsInline
            className="w-full"
            src={audioUrl}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void startRecording()}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold ${btnBase}`}
          aria-label={label}
        >
          <IconMic className="size-5 shrink-0" />
          <span>{label}</span>
        </button>
      )}
    </div>
  );
}
