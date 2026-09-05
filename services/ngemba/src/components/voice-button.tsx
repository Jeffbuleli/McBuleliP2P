"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconMic,
  IconStop,
  IconTrash,
  IconWaveform,
} from "@/components/icons";
import { toPlayableWavBlob } from "@/lib/compose/audio-playable";
import { COMPOSE_VOICE_MAX_SEC } from "@/lib/compose/limits";

type Props = {
  locale: string;
  label: string;
  listeningLabel: string;
  unsupportedLabel: string;
  /** Full live transcript for this take (finals + interim). Parent replaces voice segment. */
  onLiveTranscript: (text: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  onAudioChange?: (blob: Blob | null) => void;
  discrete?: boolean;
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

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Android/i.test(ua);
  const order = isSafari
    ? ["audio/mp4", "audio/aac", "audio/webm"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const m of order) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

function formatSec(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function VoiceButton({
  locale,
  label,
  listeningLabel,
  unsupportedLabel,
  onLiveTranscript,
  onRecordingChange,
  onAudioChange,
  discrete = false,
  className = "",
}: Props) {
  const [recSupported, setRecSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [leftSec, setLeftSec] = useState(COMPOSE_VOICE_MAX_SEC);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<Rec | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef(0);
  const preparingGenRef = useRef(0);
  const recordingRef = useRef(false);
  const finalsRef = useRef("");

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
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
    setDurationSec(0);
    setPlayhead(0);
    setPlaying(false);
  }

  function deleteAudio() {
    preparingGenRef.current += 1;
    stopAll(true);
    revokePreview();
    onAudioChange?.(null);
    setLeftSec(COMPOSE_VOICE_MAX_SEC);
    setPreparing(false);
    finalsRef.current = "";
  }

  function publishBlob(blob: Blob, elapsedSec: number) {
    const url = URL.createObjectURL(blob);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = url;
    setAudioUrl(url);
    setDurationSec(elapsedSec);
    setPlayhead(0);
    setPlaying(false);
    onAudioChange?.(blob);
  }

  function emitTranscript(finals: string, interim = "") {
    const live = [finals, interim].filter(Boolean).join(" ").trim();
    onLiveTranscript(live);
  }

  function startSpeech() {
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
    speech.onerror = () => {
      // network / no-speech: keep recording audio; STT may restart onend
    };
    speech.onend = () => {
      if (!recordingRef.current) return;
      // Chrome stops continuous recognition periodically — restart while mic is open.
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
    if (recording || preparing) return;
    preparingGenRef.current += 1;
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

      if (blob.size < 32) {
        setPreparing(false);
        return;
      }

      const gen = ++preparingGenRef.current;
      setPreparing(true);
      void (async () => {
        try {
          const playable = await toPlayableWavBlob(blob);
          if (gen !== preparingGenRef.current) return;
          publishBlob(playable, elapsedSec);
        } catch {
          if (gen !== preparingGenRef.current) return;
          publishBlob(blob, elapsedSec);
        } finally {
          if (gen === preparingGenRef.current) setPreparing(false);
        }
      })();
    };

    // Timeslice: some Android Chrome only flush chunks with a timeslice.
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
    // Let last STT finals flush briefly before killing recognition.
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

  function togglePlay() {
    const url = audioUrlRef.current;
    if (!url) return;
    let el = audioElRef.current;
    if (!el) {
      el = new Audio(url);
      audioElRef.current = el;
      el.preload = "auto";
      el.onended = () => {
        setPlaying(false);
        setPlayhead(durationSec);
      };
      el.ontimeupdate = () => {
        setPlayhead(el?.currentTime || 0);
      };
      el.onloadedmetadata = () => {
        if (el && Number.isFinite(el.duration) && el.duration > 0) {
          setDurationSec(el.duration);
        }
      };
    }
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    void el.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
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
      ) : preparing ? (
        <p
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-xs font-semibold ${btnBase}`}
        >
          Preparation audio…
        </p>
      ) : audioUrl ? (
        <div
          className={`flex min-h-11 w-full items-center gap-1.5 rounded-xl px-2 py-1 ${
            discrete ? "bg-white/10" : "bg-ng-primary-muted"
          }`}
          role="group"
          aria-label="Fichier audio"
        >
          <button
            type="button"
            onClick={togglePlay}
            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg font-bold ${
              discrete ? "text-[#e8d4e3]" : "text-ng-primary"
            }`}
            aria-label={playing ? "Pause" : "Lecture"}
          >
            {playing ? (
              <IconStop className="size-4" />
            ) : (
              <span className="text-sm leading-none" aria-hidden>
                ▶
              </span>
            )}
          </button>
          <span
            className={`min-w-0 flex-1 truncate text-[11px] font-semibold tabular-nums ${
              discrete ? "text-[#c9a0bc]" : "text-ng-primary"
            }`}
          >
            {formatSec(playhead)} / {formatSec(durationSec)}
          </span>
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
