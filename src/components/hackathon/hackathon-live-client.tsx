"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  HkPage,
  HkSection,
  HkShell,
  HkStatusPill,
  useHkLocale,
} from "@/components/hackathon/hk-ui";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { HackathonSlideFrame } from "@/components/hackathon/hackathon-slide-frame";
import { McStageDisplay } from "@/components/hackathon/mc-stage-display";
import { LiveRemoteMeet } from "@/components/hackathon/live-remote-meet";
import { BRAND_LOGO_MARK_256 } from "@/lib/brand-logo";
import type { HackathonSlide } from "@/lib/hackathon/slides/types";
import type {
  McSessionPublic,
  ProjectorMode,
} from "@/lib/hackathon/mc-state";

type AwardsEntry = {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  jurorCount: number;
};

type AwardsPayload = {
  entries: AwardsEntry[];
  scoredTeamCount: number;
  updatedAt: string;
};

type LivePresentation = {
  status: "live";
  deckSlug: string;
  deckTitleFr: string;
  deckTitleEn: string;
  slideIndex: number;
  totalSlides: number;
  speakerLabel: string | null;
  slide: HackathonSlide;
  updatedAt: string;
};

type LivePayload = {
  edition: {
    id: string;
    nameFr: string;
    nameEn?: string;
    submissionDeadlineAt: string | null;
  };
  presence: { inside: number; outside: number; absent: number; paid: number };
  program: {
    dayIndex: number;
    labelFr: string;
    labelEn?: string;
    slot: {
      time: string;
      activityFr: string;
      activityEn?: string;
    } | null;
  } | null;
  announcement: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
  } | null;
  mentoring: Array<{ id: string; topic: string; teamName: string }>;
  teams: Array<{
    id: string;
    name: string;
    status: string;
    labelFr: string;
    labelEn?: string;
  }>;
  presentation?: LivePresentation | null;
  projectorMode?: ProjectorMode;
  mc?: McSessionPublic;
  awards?: AwardsPayload;
  pitchQueue?: {
    entries: Array<{ teamId: string; teamName: string }>;
    currentIndex: number;
    active: boolean;
    current: { teamId: string; teamName: string } | null;
    next: { teamId: string; teamName: string } | null;
    total: number;
    position: number;
  };
  serverTime: string;
};

function formatCountdown(deadlineIso: string | null, now: number) {
  if (!deadlineIso) return "--:--:--";
  const ms = new Date(deadlineIso).getTime() - now;
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function LiveProjector({
  presentation,
  isFr,
}: {
  presentation: LivePresentation;
  isFr: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#FAFAF8]">
      <HackathonAtmosphere variant="page" />
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[#1F6B43]/12 bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1F6B43]/35 to-transparent"
        />
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={BRAND_LOGO_MARK_256}
            alt=""
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 object-contain"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1F6B43]">
              McBuleli Live · On Air · Kinshasa
            </p>
            <p className="truncate text-sm font-bold text-[#1c1917]">
              {isFr ? presentation.deckTitleFr : presentation.deckTitleEn}
              {presentation.speakerLabel
                ? ` · ${presentation.speakerLabel}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[#E5E5E0] bg-[#EAF6EE] px-3 py-1 font-mono text-sm tabular-nums text-[#1F6B43]">
            {presentation.slideIndex + 1} / {presentation.totalSlides}
          </span>
          <Link
            href="/hackathon/slides"
            className="text-xs font-semibold text-[#1F6B43] hover:underline"
          >
            Slides
          </Link>
        </div>
      </header>
      <div className="relative z-10 min-h-0 flex-1 px-3 pb-3 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={presentation.slide.id}
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto h-full max-w-6xl"
          >
            <HackathonSlideFrame
              slide={presentation.slide}
              revealQuiz={false}
              hideQuizHint
              className="h-full"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <footer className="relative z-10 shrink-0 border-t border-[#1F6B43]/12 bg-white/75 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1F6B43]/35 to-transparent"
        />
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a8a29e]">
          <span>Silikin Village</span>
          <span className="text-[#1F6B43]">mcbuleli.org · 28 Août 2026</span>
        </div>
      </footer>
    </div>
  );
}

function LiveAwardsPodium({
  awards,
  isFr,
}: {
  awards: AwardsPayload;
  isFr: boolean;
}) {
  const medals = ["1", "2", "3"] as const;
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#FAFAF8] px-6 py-10 text-center">
      <HackathonAtmosphere variant="page" />
      <div className="relative z-10 w-full max-w-2xl">
        <Image
          src={BRAND_LOGO_MARK_256}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="mx-auto h-14 w-14 object-contain"
        />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1F6B43]">
          {isFr
            ? "McBuleli Hackathon 2026 · Prix"
            : "McBuleli Hackathon 2026 · Awards"}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0c0a09] sm:text-5xl">
          Podium
        </h1>

        {awards.entries.length === 0 ? (
          <p className="mt-10 text-sm text-[#78716c]">
            {isFr
              ? "En attente des scores jury verrouillés."
              : "Waiting for locked jury scores."}
          </p>
        ) : (
          <ol className="mt-10 space-y-3 text-left">
            {awards.entries.map((entry, i) => (
              <motion.li
                key={entry.teamId}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className={`flex items-center gap-4 rounded-2xl border px-5 py-4 shadow-sm ${
                  entry.rank === 1
                    ? "border-amber-400/70 bg-gradient-to-r from-amber-50 to-white"
                    : "border-[#E5E5E0] bg-white/95"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-black ${
                    entry.rank === 1
                      ? "bg-amber-400 text-[#1c1917]"
                      : entry.rank === 2
                        ? "bg-stone-200 text-[#1c1917]"
                        : "bg-[#EAF6EE] text-[#1F6B43]"
                  }`}
                >
                  {medals[entry.rank - 1] ?? entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-black text-[#0c0a09]">
                    {entry.teamName}
                  </p>
                  <p className="text-xs text-[#78716c]">
                    {entry.jurorCount} {isFr ? "juré(s)" : "juror(s)"}
                  </p>
                </div>
                <p className="font-mono text-3xl font-black tabular-nums text-[#1F6B43]">
                  {entry.score}
                </p>
              </motion.li>
            ))}
          </ol>
        )}
        <p className="mt-8 text-xs text-[#a8a29e]">
          {isFr
            ? `${awards.scoredTeamCount} équipe(s) notée(s)`
            : `${awards.scoredTeamCount} team(s) scored`}
        </p>
      </div>
    </div>
  );
}

function SlidesWaiting({ isFr }: { isFr: boolean }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#FAFAF8] px-6 text-center">
      <HackathonAtmosphere variant="page" />
      <div className="relative z-10 max-w-xl rounded-[2rem] border border-[#E5E5E0] bg-white/90 px-8 py-10 shadow-sm">
        <Image
          src={BRAND_LOGO_MARK_256}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="mx-auto h-12 w-12 object-contain"
        />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1F6B43]">
          Mode Slides
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0c0a09] sm:text-4xl">
          {isFr ? "En attente du deck On Air" : "Waiting for On Air deck"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#78716c]">
          {isFr
            ? "Le deck On Air démarre dans un instant."
            : "The On Air deck starts in a moment."}
        </p>
      </div>
    </div>
  );
}

export function HackathonLiveClient({ initial }: { initial: LivePayload }) {
  const isFr = useHkLocale();
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(0);
  const [endingMeet, setEndingMeet] = useState(false);

  const mode: ProjectorMode = data.projectorMode ?? "wall";
  const onAir = data.presentation?.status === "live";
  const showMc = mode === "mc" && Boolean(data.mc);
  const showMeet =
    !endingMeet && mode === "meet" && Boolean(data.mc?.meetSlug);
  const showSlides = mode === "slides";
  const showAwards = mode === "awards";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("endMeet") !== "1") return;
    setEndingMeet(true);
    void (async () => {
      try {
        await fetch("/api/hackathon/live/meet-end", { method: "POST" });
        sp.delete("endMeet");
        const q = sp.toString();
        window.history.replaceState(
          {},
          "",
          `/hackathon/live${q ? `?${q}` : ""}`,
        );
        const res = await fetch("/api/hackathon/live", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!json.error) setData(json);
        }
      } catch {
        /* ignore */
      } finally {
        setEndingMeet(false);
      }
    })();
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const intervalMs =
      showMc || showMeet || showSlides || showAwards ? 1500 : 15000;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/hackathon/live", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.error) setData(json);
      } catch {
        /* ignore */
      }
    }, intervalMs);
    return () => clearInterval(poll);
  }, [showMc, showMeet, showSlides, showAwards]);

  const countdown = useMemo(
    () => formatCountdown(data.edition.submissionDeadlineAt, now),
    [data.edition.submissionDeadlineAt, now],
  );

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of data.teams) {
      map.set(t.status, (map.get(t.status) ?? 0) + 1);
    }
    return [...map.entries()];
  }, [data.teams]);

  if (showAwards && data.awards) {
    return <LiveAwardsPodium awards={data.awards} isFr={isFr} />;
  }

  if (endingMeet) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#050a08] px-4 text-white">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
        <p className="mt-4 text-sm text-white/70">
          {isFr ? "Fermeture de la visio…" : "Closing video…"}
        </p>
      </div>
    );
  }

  if (showMeet && data.mc?.meetSlug) {
    return (
      <LiveRemoteMeet
        meetSlug={data.mc.meetSlug}
        partnerName={data.mc.cue.partnerName}
      />
    );
  }

  if (showMc && data.mc) {
    return (
      <McStageDisplay
        initialSession={data.mc}
        session={data.mc}
        poll={false}
      />
    );
  }

  if (showSlides) {
    if (onAir && data.presentation) {
      return (
        <div className="min-h-dvh">
          <LiveProjector presentation={data.presentation} isFr={isFr} />
        </div>
      );
    }
    return <SlidesWaiting isFr={isFr} />;
  }

  return (
    <HkShell authReturnPath="/hackathon/live">
      <HkPage
        eyebrow="McBuleli Live"
        title={
          isFr
            ? data.edition.nameFr
            : (data.edition.nameEn ?? data.edition.nameFr)
        }
        lede={
          isFr
            ? "Projecteur salle · programme et équipes en direct."
            : "Room projector · live program and teams."
        }
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <Link
              href="/hackathon/mc"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#1F6B43] shadow-sm ring-1 ring-[#E5E5E0]"
            >
              Télécommande
            </Link>
            <div className="rounded-2xl bg-white px-5 py-3 text-right shadow-sm ring-1 ring-[#E5E5E0]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8a29e]">
                {isFr ? "Clôture livrables" : "Submission deadline"}
              </p>
              <p className="mt-1 font-mono text-3xl font-black tabular-nums text-[#1F6B43] sm:text-4xl">
                {countdown}
              </p>
            </div>
          </div>
        }
      >
        {data.pitchQueue?.active && data.pitchQueue.current ? (
          <motion.div
            layout
            className="mb-4 overflow-hidden rounded-[1.75rem] border border-amber-300/70 bg-gradient-to-br from-amber-50 to-white px-5 py-5 shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">
              {isFr ? "Mini Demo · en scène" : "Mini Demo · on stage"}
            </p>
            <p className="mt-1 text-3xl font-black text-[#0c0a09]">
              {data.pitchQueue.current.teamName}
            </p>
            <p className="mt-1 text-sm text-[#78716c]">
              {isFr ? "Passage" : "Slot"} {data.pitchQueue.position}/
              {data.pitchQueue.total}
              {data.pitchQueue.next
                ? ` · ${isFr ? "Suivante" : "Next"}: ${data.pitchQueue.next.teamName}`
                : ""}
            </p>
          </motion.div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#E5E5E0] bg-white p-5 shadow-sm sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#a8a29e]">
              {isFr ? "Présents" : "Inside"}
            </p>
            <p className="mt-1 text-5xl font-black text-[#1F6B43]">
              {data.presence.inside}
            </p>
            <p className="mt-3 text-xs text-[#78716c]">
              {isFr ? "Dehors" : "Outside"} {data.presence.outside} ·{" "}
              {isFr ? "Absents" : "Absent"} {data.presence.absent} · Paid{" "}
              {data.presence.paid}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[#E5E5E0] bg-white p-5 shadow-sm sm:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#a8a29e]">
              {isFr ? "Créneau actuel" : "Current slot"}
            </p>
            {data.program?.slot ? (
              <>
                <p className="mt-2 text-2xl font-black text-[#0c0a09]">
                  {isFr
                    ? data.program.slot.activityFr
                    : (data.program.slot.activityEn ??
                      data.program.slot.activityFr)}
                </p>
                <p className="mt-1 text-sm text-[#78716c]">
                  {isFr
                    ? data.program.labelFr
                    : (data.program.labelEn ?? data.program.labelFr)}{" "}
                  · {data.program.slot.time}
                </p>
              </>
            ) : (
              <p className="mt-2 text-lg text-[#78716c]">
                {isFr ? "Hors programme" : "Off schedule"}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <HkSection title={isFr ? "Annonce" : "Announcement"}>
            {data.announcement ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {data.announcement.pinned ? (
                    <HkStatusPill tone="accent">Pin</HkStatusPill>
                  ) : null}
                  <p className="text-xl font-black text-[#0c0a09]">
                    {data.announcement.title}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#57534e]">
                  {data.announcement.body}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#78716c]">
                {isFr ? "Aucune annonce." : "No announcement."}
              </p>
            )}
          </HkSection>

          <HkSection title={isFr ? "Équipes en mentorat" : "Teams in mentoring"}>
            {data.mentoring.length === 0 ? (
              <p className="text-sm text-[#78716c]">
                {isFr ? "Aucune session active." : "No active session."}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.mentoring.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-2.5 text-sm"
                  >
                    <span className="font-bold text-[#0c0a09]">{m.teamName}</span>
                    <span className="text-[#78716c]"> - {m.topic}</span>
                  </li>
                ))}
              </ul>
            )}
          </HkSection>
        </div>

        <HkSection
          title={isFr ? "Statuts équipes" : "Team statuses"}
          action={
            <div className="flex flex-wrap gap-1.5">
              {byStatus.map(([status, n]) => (
                <HkStatusPill key={status} tone="neutral">
                  {status}: {n}
                </HkStatusPill>
              ))}
            </div>
          }
        >
          {data.teams.length === 0 ? (
            <p className="text-sm text-[#78716c]">
              {isFr ? "Aucune équipe." : "No teams yet."}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.teams.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-[#E5E5E0] bg-white px-3.5 py-3"
                >
                  <p className="font-bold text-[#0c0a09]">{t.name}</p>
                  <p className="mt-1 text-xs text-[#78716c]">
                    {isFr ? t.labelFr : (t.labelEn ?? t.labelFr)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </HkSection>
      </HkPage>
    </HkShell>
  );
}
