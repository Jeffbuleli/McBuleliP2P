"use client";

import { useEffect, useRef, useState } from "react";
import { IconPlay } from "@/components/community/community-icons";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CommunityVideoPlayer({
  src,
  fr,
  poster,
  variant = "standard",
}: {
  src: string;
  fr: boolean;
  poster?: string | null;
  variant?: "standard" | "reels";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  const isReels = variant === "reels";

  const seekFromClientX = (clientX: number) => {
    const v = ref.current;
    const bar = progressRef.current;
    if (!v || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
    setCurrent(v.currentTime);
  };

  useEffect(() => {
    if (!isReels || !wrapRef.current) return;
    const el = wrapRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const v = ref.current;
        if (!v) return;
        const visible = entries[0]?.isIntersecting;
        if (visible) {
          v.muted = true;
          void v.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isReels]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const unmute = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    if (v.paused) void v.play().then(() => setPlaying(true));
  };

  useEffect(() => {
    if (!scrubbing) return;
    const onMove = (e: PointerEvent) => seekFromClientX(e.clientX);
    const onUp = () => setScrubbing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [scrubbing, duration]);

  if (isReels) {
    return (
      <div
        ref={wrapRef}
        className="relative mx-auto aspect-[9/16] max-h-[min(72vh,540px)] w-full max-w-[280px] overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-black/10"
        onClick={() => {
          if (muted) unmute();
          else toggle();
        }}
      >
        <video
          ref={ref}
          src={src}
          poster={poster ?? undefined}
          playsInline
          loop
          muted={muted}
          className="h-full w-full object-cover"
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />

        {!playing ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <IconPlay size={56} />
          </div>
        ) : null}

        {muted && playing ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              unmute();
            }}
            className="absolute bottom-14 right-3 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-bold text-white"
          >
            {fr ? "Activer le son" : "Tap for sound"}
          </button>
        ) : null}

        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            ref={progressRef}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={current}
            aria-label={fr ? "Progression" : "Progress"}
            className="flex h-5 cursor-pointer items-end"
            onPointerDown={(e) => {
              e.stopPropagation();
              setScrubbing(true);
              seekFromClientX(e.clientX);
            }}
          >
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: duration ? `${(current / duration) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
          <p className="mt-1 text-[10px] font-medium tabular-nums text-white/80">
            {fmt(current)} / {fmt(duration || 0)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      onClick={() => {
        if (!playing) toggle();
        else setShowControls((s) => !s);
      }}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        playsInline
        muted={muted}
        className="h-full w-full object-contain"
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      {!playing ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="active:scale-95"
            aria-label={fr ? "Lire" : "Play"}
          >
            <IconPlay size={56} />
          </button>
        </div>
      ) : null}

      {playing && showControls ? (
        <div
          className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-center gap-6">
            <button type="button" className="text-xs font-bold text-white" onClick={() => {
              const v = ref.current;
              if (v) v.currentTime = Math.max(0, v.currentTime - 10);
            }}>
              -10s
            </button>
            <button type="button" onClick={toggle} aria-label="Pause">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden>
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
            <button type="button" className="text-xs font-bold text-white" onClick={() => {
              const v = ref.current;
              if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
            }}>
              +10s
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={current}
            onChange={(e) => {
              const v = ref.current;
              if (!v) return;
              v.currentTime = Number(e.target.value);
            }}
            className="w-full accent-[#305f33]"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-white/90">
            <span>{fmt(current)} / {fmt(duration)}</span>
            <button type="button" onClick={() => setMuted((m) => !m)} className="font-semibold">
              {muted ? (fr ? "Son" : "Sound") : (fr ? "Muet" : "Mute")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
