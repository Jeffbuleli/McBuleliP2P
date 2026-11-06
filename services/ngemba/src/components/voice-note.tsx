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

/** Bulle vocale : lecture, onde, durée. Comme une note vocale de messagerie. */
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
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const bars = useMemo(() => barsFor(src), [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !autoPlay) return;
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [autoPlay, src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  const shown = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
  const clock = `${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-w-[180px] items-center gap-2">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(event) => {
          const el = event.currentTarget;
          if (el.duration) setProgress(el.currentTime / el.duration);
        }}
        onLoadedMetadata={(event) => setSeconds(event.currentTarget.duration)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Lire le vocal"}
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${
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
        {clock}
      </span>
    </div>
  );
}
