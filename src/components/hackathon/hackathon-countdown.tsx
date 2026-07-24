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
}: {
  isFr: boolean;
  targetAt?: string;
  onDark?: boolean;
  className?: string;
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
  const shell = onDark
    ? "border-white/25 bg-white/10 text-white shadow-sm backdrop-blur-md"
    : "border-[#E5E5E0] bg-white/90 text-[#222222] shadow-[0_10px_28px_-16px_rgba(34,34,34,0.35)] backdrop-blur-md";

  return (
    <aside
      className={`rounded-2xl border px-3 py-2 ${shell} ${className}`}
      aria-live="polite"
      aria-label={
        started
          ? isFr
            ? "Hackathon en cours"
            : "Hackathon in progress"
          : isFr
            ? `Compte à rebours ${pad(parts.days)} jours ${pad(parts.hours)} heures ${pad(parts.minutes)} minutes`
            : `Countdown ${pad(parts.days)} days ${pad(parts.hours)} hours ${pad(parts.minutes)} minutes`
      }
    >
      <p
        className={`text-[9px] font-extrabold uppercase tracking-[0.16em] ${
          onDark ? "text-white/75" : "text-[#8A8A8A]"
        }`}
      >
        {started
          ? isFr
            ? "C’est parti"
            : "It’s on"
          : isFr
            ? "Compte à rebours"
            : "Countdown"}
      </p>
      {started ? (
        <p className="mt-0.5 text-sm font-extrabold tabular-nums">
          {isFr ? "En cours" : "Live"}
        </p>
      ) : ready ? (
        <div
          className="mt-1 flex items-baseline gap-1 font-extrabold tabular-nums"
          role="timer"
        >
          <Unit value={parts.days} label={isFr ? "j" : "d"} onDark={onDark} />
          <Sep onDark={onDark} />
          <Unit value={parts.hours} label="h" onDark={onDark} />
          <Sep onDark={onDark} />
          <Unit value={parts.minutes} label="m" onDark={onDark} />
          <Sep onDark={onDark} />
          <Unit value={parts.seconds} label="s" onDark={onDark} />
        </div>
      ) : (
        <p className="mt-0.5 h-5 w-28 animate-pulse rounded bg-current/10" />
      )}
    </aside>
  );
}

function Unit({
  value,
  label,
  onDark,
}: {
  value: number;
  label: string;
  onDark: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <strong className="text-sm sm:text-base">{pad(value)}</strong>
      <em
        className={`text-[9px] font-bold not-italic ${
          onDark ? "text-white/65" : "text-[#8A8A8A]"
        }`}
      >
        {label}
      </em>
    </span>
  );
}

function Sep({ onDark }: { onDark: boolean }) {
  return (
    <span
      className={`text-xs ${onDark ? "text-white/40" : "text-[#C5C5C0]"}`}
      aria-hidden
    >
      :
    </span>
  );
}
