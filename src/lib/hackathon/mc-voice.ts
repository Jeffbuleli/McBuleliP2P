/**
 * Browser playback for McBuleli IA MC lines (FR).
 * Prefers OpenAI TTS (server) ; falls back to Web Speech API if unavailable.
 */

import { applyMcPronunciation } from "@/lib/hackathon/mc-pronunciation";

export { applyMcPronunciation } from "@/lib/hackathon/mc-pronunciation";

import type { McCueKind } from "@/lib/hackathon/mc-day";

const DEFAULT_RATE = 0.9;
const DEFAULT_PITCH = 1.02;
const CHUNK_GAP_MS = 420;

let speakGeneration = 0;
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

export function stopMcVoice() {
  speakGeneration += 1;
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

/** Split into speakable chunks for browser TTS fallback. */
export function splitMcSpeechChunks(text: string): string[] {
  const normalized = applyMcPronunciation(text);
  if (!normalized) return [];
  const parts = normalized
    .split(/(?<=[.!?…])\s+|(?<=:)\s+|(?<=;)\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1 && normalized.length > 140) {
    return normalized
      .split(/(?<=,)\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return parts.length ? parts : [normalized];
}

function pickFrVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefer = [
    /google.*fr/i,
    /thomas/i,
    /amélie|amelie/i,
    /denise/i,
    /audrey/i,
    /hortense/i,
    /marie/i,
  ];
  for (const re of prefer) {
    const hit = voices.find((v) => /^fr[-_]/i.test(v.lang) && re.test(v.name));
    if (hit) return hit;
  }
  return voices.find((v) => /^fr[-_]/i.test(v.lang)) ?? null;
}

function speakChunk(
  chunk: string,
  opts: { rate: number; pitch: number; voice: SpeechSynthesisVoice | null },
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = "fr-FR";
    u.rate = opts.rate;
    u.pitch = opts.pitch;
    if (opts.voice) u.voice = opts.voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function wait(ms: number, gen: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (gen === speakGeneration) resolve();
      else resolve();
    }, ms);
  });
}

async function playOpenAiAudio(
  text: string,
  gen: number,
  opts?: {
    cueKind?: McCueKind;
    onChunk?: (i: number, total: number) => void;
    onDone?: () => void;
  },
): Promise<boolean> {
  const res = await fetch("/api/hackathon/live/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, cueKind: opts?.cueKind }),
  });
  if (!res.ok) return false;
  if (gen !== speakGeneration) return true;

  const blob = await res.blob();
  if (gen !== speakGeneration) return true;

  const url = URL.createObjectURL(blob);
  currentObjectUrl = url;
  const audio = new Audio(url);
  currentAudio = audio;
  opts?.onChunk?.(0, 1);

  await new Promise<void>((resolve) => {
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    void audio.play().catch(() => resolve());
  });

  if (currentObjectUrl === url) {
    URL.revokeObjectURL(url);
    currentObjectUrl = null;
  }
  if (currentAudio === audio) currentAudio = null;
  if (gen === speakGeneration) opts?.onDone?.();
  return true;
}

async function playBrowserFallback(
  text: string,
  gen: number,
  opts?: {
    rate?: number;
    pitch?: number;
    onChunk?: (i: number, total: number) => void;
    onDone?: () => void;
  },
): Promise<void> {
  const chunks = splitMcSpeechChunks(text);
  if (!chunks.length) {
    opts?.onDone?.();
    return;
  }
  if (typeof window === "undefined" || !window.speechSynthesis) {
    opts?.onDone?.();
    return;
  }
  window.speechSynthesis.cancel();
  const voice = pickFrVoice();
  const rate = opts?.rate ?? DEFAULT_RATE;
  const pitch = opts?.pitch ?? DEFAULT_PITCH;

  for (let i = 0; i < chunks.length; i++) {
    if (gen !== speakGeneration) return;
    opts?.onChunk?.(i, chunks.length);
    await speakChunk(chunks[i]!, { rate, pitch, voice });
    if (gen !== speakGeneration) return;
    if (i < chunks.length - 1) await wait(CHUNK_GAP_MS, gen);
  }
  if (gen === speakGeneration) opts?.onDone?.();
}

/**
 * Speak a stage line via OpenAI TTS when available, else browser FR voice.
 */
export function speakMcLine(
  text: string,
  opts?: {
    cueKind?: McCueKind;
    rate?: number;
    pitch?: number;
    onChunk?: (i: number, total: number) => void;
    onDone?: () => void;
  },
): boolean {
  if (typeof window === "undefined") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  const gen = ++speakGeneration;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  void (async () => {
    try {
      const ok = await playOpenAiAudio(trimmed, gen, opts);
      if (ok) return;
    } catch {
      /* fall through */
    }
    if (gen !== speakGeneration) return;
    await playBrowserFallback(trimmed, gen, opts);
  })();

  return true;
}

export function ensureMcVoicesLoaded(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve();
    }, 1500);
  });
}
