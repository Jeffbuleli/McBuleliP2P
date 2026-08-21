"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { McSessionPublic } from "@/lib/hackathon/mc-state";
import {
  ensureMcVoicesLoaded,
  speakMcLine,
  stopMcVoice,
} from "@/lib/hackathon/mc-voice";

function formatRemain(ms: number) {
  if (ms <= 0) return "0:00";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function McStageDisplay({
  initialSession,
  session: controlled,
  poll = true,
}: {
  initialSession: McSessionPublic;
  /** When provided by Live, skip local fetch and use parent state */
  session?: McSessionPublic;
  poll?: boolean;
}) {
  const [localSession, setLocalSession] = useState(initialSession);
  const session = controlled ?? localSession;
  const [now, setNow] = useState(() => Date.now());
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);
  const lastSpokenKey = useRef<string>("");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!poll || controlled) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/hackathon/mc", { cache: "no-store" });
        const data = await res.json();
        if (data?.session) setLocalSession(data.session);
      } catch {
        /* ignore */
      }
    }, 1000);
    return () => clearInterval(t);
  }, [poll, controlled]);

  useEffect(() => {
    if (controlled) setLocalSession(controlled);
  }, [controlled]);

  useEffect(() => {
    if (!voiceUnlocked) return;
    if (!session.voiceEnabled) {
      stopMcVoice();
      return;
    }
    if (session.humanOverride) {
      stopMcVoice();
      return;
    }

    const speakKey = `${session.cueId}:${session.voiceReplayToken}`;
    if (lastSpokenKey.current === speakKey) return;
    lastSpokenKey.current = speakKey;

    let cancelled = false;
    void (async () => {
      await ensureMcVoicesLoaded();
      if (cancelled) return;
      speakMcLine(session.cue.stageLineFr);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    voiceUnlocked,
    session.voiceEnabled,
    session.humanOverride,
    session.cueId,
    session.voiceReplayToken,
    session.cue.stageLineFr,
  ]);

  useEffect(() => {
    return () => stopMcVoice();
  }, []);

  const remainMs = useMemo(() => {
    if (!session.timerEndsAt) return null;
    return new Date(session.timerEndsAt).getTime() - now;
  }, [session.timerEndsAt, now]);

  const urgent = remainMs != null && remainMs <= 60_000;
  const overtime = remainMs != null && remainMs <= 0;

  const unlockVoice = () => {
    setVoiceUnlocked(true);
    void ensureMcVoicesLoaded().then(() => {
      if (session.voiceEnabled && !session.humanOverride) {
        lastSpokenKey.current = `${session.cueId}:${session.voiceReplayToken}`;
        speakMcLine(session.cue.stageLineFr);
      }
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#06140f] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(52,211,153,0.22),transparent_50%),radial-gradient(ellipse_at_90%_10%,rgba(16,185,129,0.12),transparent_40%),linear-gradient(180deg,#06140f_0%,#0a1f18_55%,#04110c_100%)]"
      />

      {!voiceUnlocked ? (
        <button
          type="button"
          onClick={unlockVoice}
          className="absolute inset-x-4 top-4 z-20 rounded-2xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-left backdrop-blur-sm sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
            Voix McBuleli AI
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            Cliquer une fois pour activer le son sur ce projecteur
          </p>
        </button>
      ) : (
        <div className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/70 sm:right-6 sm:top-6">
          {session.voiceEnabled ? "Voix ON" : "Voix OFF"}
        </div>
      )}

      <header className="relative z-10 flex items-start justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-300/90">
            McBuleli AI
          </p>
          <p className="mt-1 text-sm text-white/50">
            Modération - piloté avec l&apos;équipe McBuleli
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            Maintenant
          </p>
          <p className="text-sm font-semibold text-white/80">
            {session.cue.windowFr || session.cue.labelFr}
          </p>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10 sm:px-12">
        {session.humanOverride ? (
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
              Équipe McBuleli
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              {session.overrideMessageFr}
            </h1>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            {session.cue.partnerName ? (
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300/90">
                {session.cue.partnerName}
                {session.cue.domainFr ? ` · ${session.cue.domainFr}` : ""}
              </p>
            ) : (
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300/80">
                {session.cue.labelFr}
              </p>
            )}
            <h1 className="mt-4 text-3xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              {session.cue.stageLineFr}
            </h1>
            {session.cue.detailFr ? (
              <p className="mt-5 max-w-3xl text-lg text-white/60 sm:text-xl">
                {session.cue.detailFr}
              </p>
            ) : null}
          </div>
        )}

        {remainMs != null && !session.humanOverride ? (
          <div className="mx-auto mt-12 w-full max-w-5xl">
            <p
              className={`font-mono text-6xl font-black tabular-nums sm:text-8xl ${
                overtime
                  ? "text-rose-400"
                  : urgent
                    ? "text-amber-300"
                    : "text-white"
              }`}
            >
              {overtime ? "0:00" : formatRemain(remainMs)}
            </p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/40">
              {overtime
                ? "Temps écoulé"
                : urgent
                  ? "Dernière minute"
                  : "Chrono"}
            </p>
          </div>
        ) : null}
      </main>

      <footer className="relative z-10 flex items-end justify-between gap-4 border-t border-white/10 px-6 py-5 sm:px-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
            Ensuite
          </p>
          <p className="text-sm font-semibold text-white/70">
            {session.nextCue?.labelFr ?? "-"}
          </p>
        </div>
        <p className="text-xs text-white/35">mcbuleli.org · Silikin Village</p>
      </footer>
    </div>
  );
}
