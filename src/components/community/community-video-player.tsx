"use client";

import { useRef, useState } from "react";
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
}: {
  src: string;
  fr: boolean;
  poster?: string | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(true);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
      setShowControls(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const seek = (delta: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };

  const fullscreen = () => {
    const v = ref.current;
    if (!v) return;
    if (v.requestFullscreen) void v.requestFullscreen();
  };

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
            <button
              type="button"
              className="text-xs font-bold text-white"
              onClick={() => seek(-10)}
            >
              -10s
            </button>
            <button type="button" onClick={toggle} aria-label="Pause">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden>
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
            <button
              type="button"
              className="text-xs font-bold text-white"
              onClick={() => seek(10)}
            >
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
            <span>
              {fmt(current)} / {fmt(duration)}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="font-semibold"
              >
                {muted ? (fr ? "Son" : "Sound") : (fr ? "Muet" : "Mute")}
              </button>
              <button type="button" onClick={fullscreen} className="font-semibold">
                {fr ? "Plein écran" : "Fullscreen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
