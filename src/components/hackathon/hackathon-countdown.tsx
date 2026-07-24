"use client";

import { useEffect, useState } from "react";
import { HACKATHON_START_AT } from "@/lib/hackathon/event-content";

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

function diffParts(targetMs: number, nowMs: number): Parts {
  const totalMs = targetMs - nowMs;
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs };
  }
  const sec = Math.floor(totalMs / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function HackathonCountdown({
  isFr,
  targetAt = HACKATHON_START_AT,
  onDark = false,
  className = "",
  /** Digits only (jj h mm ss) — no card, no “Compte à rebours” label. */
  bare = true,
}: {
  isFr: boolean;
  targetAt?: string;
  onDark?: boolean;
  className?: string;
  bare?: boolean;
}) {
  const target = new Date(targetAt).getTime();
  const [parts, setParts] = useState<Parts>(() =>
    diffParts(target, Date.now()),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const tick = () => setParts(diffParts(target, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!Number.isFinite(target)) return null;

  const started = parts.totalMs <= 0;
  const ink = onDark ? "text-white" : "text-[#1F6B43]";
  const muted = onDark ? "text-white/65" : "text-[#8A8A8A]";
  const sep = onDark ? "text-white/40" : "text-[#C5C5C0]";

  const aria = started
    ? isFr
      ? "Hackathon en cours"
      : "Hackathon in progress"
    : isFr
      ? `Compte à rebours ${pad(parts.days)} jours ${pad(parts.hours)} heures ${pad(parts.minutes)} minutes`
      : `Countdown ${pad(parts.days)} days ${pad(parts.hours)} hours ${pad(parts.minutes)} minutes`;

  const digits = started ? (
    <span className={`text-sm font-extrabold tabular-nums ${ink}`}>
      {isFr ? "En cours" : "Live"}
    </span>
  ) : ready ? (
    <div
      className={`flex items-baseline gap-0.5 font-extrabold tabular-nums ${ink}`}
      role="timer"
    >
      <Unit value={parts.days} label={isFr ? "j" : "d"} muted={muted} />
      <span className={`px-0.5 text-xs ${sep}`} aria-hidden>
        :
      </span>
      <Unit value={parts.hours} label="h" muted={muted} />
      <span className={`px-0.5 text-xs ${sep}`} aria-hidden>
        :
      </span>
      <Unit value={parts.minutes} label="m" muted={muted} />
      <span className={`px-0.5 text-xs ${sep}`} aria-hidden>
        :
      </span>
      <Unit value={parts.seconds} label="s" muted={muted} />
    </div>
  ) : (
    <span className={`inline-block h-4 w-24 animate-pulse rounded ${onDark ? "bg-white/15" : "bg-black/10"}`} />
  );

  if (bare) {
    return (
      <aside className={className} aria-live="polite" aria-label={aria}>
        {digits}
      </aside>
    );
  }

  return (
    <aside
      className={`rounded-2xl border px-3 py-2 ${
        onDark
          ? "border-white/25 bg-white/10 text-white shadow-sm backdrop-blur-md"
          : "border-[#E5E5E0] bg-white/90 text-[#222222] shadow-[0_10px_28px_-16px_rgba(34,34,34,0.35)] backdrop-blur-md"
      } ${className}`}
      aria-live="polite"
      aria-label={aria}
    >
      {digits}
    </aside>
  );
}

function Unit({
  value,
  label,
  muted,
}: {
  value: number;
  label: string;
  muted: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <strong className="text-sm sm:text-[15px]">{pad(value)}</strong>
      <em className={`text-[9px] font-bold not-italic ${muted}`}>{label}</em>
    </span>
  );
}
