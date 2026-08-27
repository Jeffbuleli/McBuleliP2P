"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { BRAND_LOGO_MARK_256 } from "@/lib/brand-logo";
import type { McSessionPublic } from "@/lib/hackathon/mc-state";
import {
  McStageAiCard,
  McStageHumanCard,
} from "@/components/hackathon/mc-stage-ai-card";
import type { McCueKind } from "@/lib/hackathon/mc-day";
import {
  ensureMcVoicesLoaded,
  speakMcLine,
  stopMcVoice,
} from "@/lib/hackathon/mc-voice";

/** Cues where a human speaks — McBuleli IA stays silent. */
const HUMAN_SPEAKER_KINDS = new Set<McCueKind>([
  "patty_open",
  "patty_close",
  "jeff_bootcamp",
]);

function isHumanSpeakerCue(kind: McCueKind): boolean {
  return HUMAN_SPEAKER_KINDS.has(kind);
}

function formatRemain(ms: number) {
  if (ms <= 0) return "0:00";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function MicPulse({ active }: { active: boolean }) {
  return (
    <span className="relative inline-flex h-3 w-3 items-center justify-center">
      {active ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-[#1F6B43]/40" />
          <span className="relative h-2 w-2 rounded-full bg-[#1F6B43]" />
        </>
      ) : (
        <span className="h-2 w-2 rounded-full bg-stone-300" />
      )}
    </span>
  );
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
  const [speaking, setSpeaking] = useState(false);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [chunkTotal, setChunkTotal] = useState(0);
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
      setSpeaking(false);
      return;
    }
    if (session.humanOverride) {
      stopMcVoice();
      setSpeaking(false);
      return;
    }
    if (isHumanSpeakerCue(session.cue.kind)) {
      stopMcVoice();
      setSpeaking(false);
      return;
    }

    const speakKey = `${session.cueId}:${session.voiceReplayToken}`;
    if (lastSpokenKey.current === speakKey) return;
    lastSpokenKey.current = speakKey;

    let cancelled = false;
    void (async () => {
      await ensureMcVoicesLoaded();
      if (cancelled) return;
      setSpeaking(true);
      setChunkIndex(0);
      speakMcLine(session.cue.stageLineFr, {
        cueKind: session.cue.kind,
        onChunk: (i, total) => {
          if (!cancelled) {
            setChunkIndex(i);
            setChunkTotal(total);
          }
        },
        onDone: () => {
          if (!cancelled) setSpeaking(false);
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    voiceUnlocked,
    session.voiceEnabled,
    session.humanOverride,
    session.cueId,
    session.cue.kind,
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
      if (
        session.voiceEnabled &&
        !session.humanOverride &&
        !isHumanSpeakerCue(session.cue.kind)
      ) {
        lastSpokenKey.current = `${session.cueId}:${session.voiceReplayToken}`;
        setSpeaking(true);
        speakMcLine(session.cue.stageLineFr, {
          cueKind: session.cue.kind,
          onChunk: (i, total) => {
            setChunkIndex(i);
            setChunkTotal(total);
          },
          onDone: () => setSpeaking(false),
        });
      }
    });
  };

  const humanHostCard = (() => {
    const { cue } = session;
    if (cue.kind === "patty_open") {
      return (
        <McStageHumanCard
          title="Ouverture"
          hostName="Mme Patty Basoga"
          role="Chargée des Finances · McBuleli"
          subtitle="Accueil de la salle · puis passage à McBuleli IA"
          photoSrc="/hackathon/patty-basoga.png"
          photoAlt="Portrait de Mme Patty Basoga"
          tone="gold"
        />
      );
    }
    if (cue.kind === "patty_close") {
      return (
        <McStageHumanCard
          title="Clôture"
          hostName="Mme Patty Basoga"
          role="Chargée des Finances · McBuleli"
          subtitle={cue.detailFr}
          photoSrc="/hackathon/patty-basoga.png"
          photoAlt="Portrait de Mme Patty Basoga"
          tone="gold"
        />
      );
    }
    if (cue.kind === "jeff_bootcamp") {
      return (
        <McStageHumanCard
          title="Bootcamp"
          hostName="Ir Jeff Buleli"
          role="Fondateur · développeur principal de McBuleli"
          subtitle={cue.detailFr ?? "1 heure · outils IA · pratique"}
          photoSrc="/hackathon/jeff-buleli.png"
          photoAlt="Portrait de Ir Jeff Buleli"
          tone="ivory"
        />
      );
    }
    return null;
  })();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#FAFAF8] text-[#111111]">
      {!voiceUnlocked ? (
        <button
          type="button"
          onClick={unlockVoice}
          className="absolute inset-x-4 top-4 z-30 rounded-2xl border border-[#1F6B43]/25 bg-white/95 px-4 py-3 text-left shadow-lg shadow-[#1F6B43]/10 backdrop-blur-sm sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1F6B43]">
            Voix McBuleli IA
          </p>
          <p className="mt-1 text-sm font-semibold text-[#111]">
            Cliquer une fois pour activer le son sur ce projecteur
          </p>
        </button>
      ) : (
        <div className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-[#E5E5E0] bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#57534e] shadow-sm sm:right-6 sm:top-6">
          <MicPulse active={speaking && session.voiceEnabled} />
          {session.voiceEnabled ? "Voix ON" : "Voix OFF"}
          {speaking && chunkTotal > 0 ? (
            <span className="font-mono normal-case tracking-normal text-[#1F6B43]">
              {chunkIndex + 1}/{chunkTotal}
            </span>
          ) : null}
        </div>
      )}

      <header className="relative z-20 shrink-0 border-b border-[#1F6B43]/12 bg-white/85 px-6 py-4 backdrop-blur-md sm:px-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src={BRAND_LOGO_MARK_256}
              alt="McBuleli"
              width={48}
              height={48}
              unoptimized
              className="h-11 w-11 object-contain"
            />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#1F6B43]">
                McBuleli IA
              </p>
              <p className="mt-0.5 text-sm text-[#78716c]">
                Kinshasa · Silikin Village · 28 Août 2026
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E5E5E0] bg-white/90 px-4 py-2.5 text-right shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a8a29e]">
              Maintenant
            </p>
            <p className="text-sm font-bold text-[#1c1917]">
              {session.cue.windowFr || session.cue.labelFr}
            </p>
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1F6B43]/35 to-transparent"
        />
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-6 py-8 sm:px-12">
        {/* Skyline only in content band — starts above footer, not behind it */}
        <HackathonAtmosphere variant="page" className="opacity-100" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-[#EAF6EE]/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-8 h-48 w-48 rounded-full bg-[#EEF2FF]/35 blur-3xl"
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={
              session.humanOverride
                ? `override-${session.updatedAt}`
                : session.cueId
            }
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 mx-auto w-full ${
              humanHostCard ? "max-w-5xl" : "max-w-xl sm:max-w-2xl"
            }`}
          >
            {session.humanOverride ? (
              <div className="rounded-3xl border border-amber-300/60 bg-amber-50/90 px-8 py-10 text-center shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-700">
                  Équipe McBuleli
                </p>
                <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#1c1917] sm:text-5xl">
                  {session.overrideMessageFr}
                </h1>
              </div>
            ) : humanHostCard ? (
              humanHostCard
            ) : (
              <McStageAiCard
                cue={session.cue}
                speaking={speaking && session.voiceEnabled}
                chunkIndex={chunkIndex}
                chunkTotal={chunkTotal}
                meetActive={Boolean(session.meetSlug)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {remainMs != null && !session.humanOverride ? (
          <motion.div
            layout
            className="relative z-10 mx-auto mt-8 w-full max-w-xl sm:max-w-2xl"
          >
            <div
              className={`inline-flex flex-col rounded-3xl border px-6 py-4 shadow-sm ${
                overtime
                  ? "border-rose-300 bg-rose-50"
                  : urgent
                    ? "border-amber-300 bg-amber-50"
                    : "border-[#E5E5E0] bg-white/90"
              }`}
            >
              <p
                className={`font-mono text-5xl font-black tabular-nums sm:text-7xl ${
                  overtime
                    ? "text-rose-600"
                    : urgent
                      ? "text-amber-700"
                      : "text-[#1F6B43]"
                }`}
              >
                {overtime ? "0:00" : formatRemain(remainMs)}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#78716c]">
                {overtime
                  ? "Temps écoulé"
                  : urgent
                    ? "Dernière minute"
                    : "Chrono"}
              </p>
            </div>
          </motion.div>
        ) : null}
      </main>

      <footer className="relative z-20 shrink-0 border-t border-[#1F6B43]/12 bg-white/90 px-6 py-4 backdrop-blur-md sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1F6B43]/35 to-transparent"
        />
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a8a29e]">
              Ensuite
            </p>
            <p className="text-sm font-bold text-[#292524]">
              {session.nextCue?.labelFr ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8a29e]">
              Kinshasa
            </p>
            <p className="text-xs font-semibold text-[#1F6B43]">
              mcbuleli.org · McBuleli Hackathon
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
