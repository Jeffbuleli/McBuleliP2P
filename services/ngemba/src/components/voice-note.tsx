"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function barsFor(seed: string): number[] {
  let n = 0;
  for (let i = 0; i < seed.length; i += 1) n = (n * 33 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: 28 }, (_, index) => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return 28 + ((n + index * 17) % 72);
  });
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "…";
  const shown = Math.round(seconds);
  return `${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, "0")}`;
}

/** Bulle vocale : le fichier est chargé avec le cookie, puis lu en local. */
export function VoiceNote({
  src,
  autoPlay = false,
  light = false,
}: {
  src: string;
  autoPlay?: boolean;
  light?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [failed, setFailed] = useState(false);
  const bars = useMemo(() => barsFor(src), [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let objectUrl = "";
    let cancelled = false;
    setReady(false);
    setFailed(false);
    setPlaying(false);
    setSeconds(0);

    void (async () => {
      try {
        const res = await fetch(src, { credentials: "include" });
        if (!res.ok) throw new Error("audio_http");
        const blob = await res.blob();
        if (cancelled) return;
        const typed =
          blob.type && blob.type !== "application/octet-stream"
            ? blob
            : new Blob([blob], { type: "audio/mpeg" });
        objectUrl = URL.createObjectURL(typed);
        audio.src = objectUrl;
        audio.load();
        setReady(true);
        try {
          const Ctx =
            window.AudioContext ||
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (Ctx) {
            const ctx = new Ctx();
            const decoded = await ctx.decodeAudioData(await typed.arrayBuffer());
            if (!cancelled && Number.isFinite(decoded.duration)) setSeconds(decoded.duration);
            void ctx.close();
          }
        } catch {
          /* la durée arrivera avec loadedmetadata */
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      audio.pause();
      audio.removeAttribute("src");
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  function noteDuration(audio: HTMLAudioElement) {
    const duration = audio.duration;
    if (Number.isFinite(duration) && duration > 0 && duration < 60 * 30) {
      setSeconds(duration);
    }
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio || !ready) return;
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="flex min-w-[180px] items-center gap-2">
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onLoadedMetadata={(event) => {
          setReady(true);
          noteDuration(event.currentTarget);
          if (autoPlay) {
            void event.currentTarget
              .play()
              .then(() => setPlaying(true))
              .catch(() => setPlaying(false));
          }
        }}
        onDurationChange={(event) => noteDuration(event.currentTarget)}
        onTimeUpdate={(event) => {
          const el = event.currentTarget;
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setProgress(el.currentTime / el.duration);
            if (seconds <= 0) setSeconds(el.duration);
          }
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={toggle}
        disabled={!ready || failed}
        aria-label={playing ? "Pause" : "Lire le vocal"}
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
          light ? "bg-white/20 text-white" : "bg-ng-primary text-white"
        }`}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="flex h-8 min-w-0 flex-1 items-center gap-[2px]">
        {bars.map((height, index) => (
          <span
            key={index}
            className={`w-[3px] rounded-full ${light ? "bg-white" : "bg-ng-primary"}`}
            style={{
              height: `${height}%`,
              opacity: index / bars.length <= progress ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <span className={`text-[10px] tabular-nums ${light ? "text-white/80" : "text-ng-muted"}`}>
        {failed ? "—" : clock(seconds)}
      </span>
    </div>
  );
}
