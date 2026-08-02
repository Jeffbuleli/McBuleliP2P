"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  HkPage,
  HkSection,
  HkShell,
  HkStatusPill,
  useHkLocale,
} from "@/components/hackathon/hk-ui";
import { HackathonSlideFrame } from "@/components/hackathon/hackathon-slide-frame";
import type { HackathonSlide } from "@/lib/hackathon/slides/types";

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
    <div className="fixed inset-0 z-40 flex flex-col bg-[color:var(--hk-page,#fafaf8)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
            McBuleli Live · On Air
          </p>
          <p className="truncate text-sm font-bold text-[color:var(--hk-text)]">
            {isFr ? presentation.deckTitleFr : presentation.deckTitleEn}
            {presentation.speakerLabel
              ? ` · ${presentation.speakerLabel}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tabular-nums text-[color:var(--hk-muted)]">
            {presentation.slideIndex + 1} / {presentation.totalSlides}
          </span>
          <Link
            href="/hackathon/slides"
            className="text-xs font-semibold text-[color:var(--hk-accent)] hover:underline"
          >
            Slides
          </Link>
        </div>
      </div>
      <div className="min-h-0 flex-1 px-3 pb-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={presentation.slide.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
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
    </div>
  );
}

export function HackathonLiveClient({ initial }: { initial: LivePayload }) {
  const isFr = useHkLocale();
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(0);

  const onAir = data.presentation?.status === "live";

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const intervalMs = onAir ? 2000 : 15000;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/hackathon/live");
        if (!res.ok) return;
        const json = await res.json();
        if (!json.error) setData(json);
      } catch {
        /* ignore */
      }
    }, intervalMs);
    return () => clearInterval(poll);
  }, [onAir]);

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

  if (onAir && data.presentation) {
    return (
      <div className="min-h-dvh">
        <LiveProjector presentation={data.presentation} isFr={isFr} />
      </div>
    );
  }

  return (
    <HkShell authReturnPath="/hackathon/live">
      <HkPage
        eyebrow="McBuleli Live"
        title={isFr ? data.edition.nameFr : data.edition.nameEn ?? data.edition.nameFr}
        lede={
          isFr
            ? "Mur d'affichage - actualisé toutes les 15 secondes."
            : "Display wall - refreshes every 15 seconds."
        }
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <Link
              href="/hackathon/slides"
              className="rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))] px-4 py-3 text-sm font-bold text-[color:var(--hk-accent)] shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
            >
              Slides
            </Link>
            <div className="rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))] px-5 py-3 text-right shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--hk-muted,var(--fd-muted))]">
                {isFr ? "Clôture livrables" : "Submission deadline"}
              </p>
              <p className="mt-1 font-mono text-3xl font-black tabular-nums text-[color:var(--hk-accent,var(--fd-primary))] sm:text-4xl">
                {countdown}
              </p>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))] p-5 shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))] sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr ? "Présents" : "Inside"}
            </p>
            <p className="mt-1 text-5xl font-black text-[color:var(--hk-text,var(--fd-text))]">
              {data.presence.inside}
            </p>
            <p className="mt-3 text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr ? "Dehors" : "Outside"} {data.presence.outside} ·{" "}
              {isFr ? "Absents" : "Absent"} {data.presence.absent} · Paid{" "}
              {data.presence.paid}
            </p>
          </div>
          <div className="rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))] p-5 shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))] sm:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr ? "Créneau actuel" : "Current slot"}
            </p>
            {data.program?.slot ? (
              <>
                <p className="mt-2 text-2xl font-black text-[color:var(--hk-text,var(--fd-text))]">
                  {isFr
                    ? data.program.slot.activityFr
                    : data.program.slot.activityEn ?? data.program.slot.activityFr}
                </p>
                <p className="mt-1 text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                  {isFr
                    ? data.program.labelFr
                    : data.program.labelEn ?? data.program.labelFr}{" "}
                  · {data.program.slot.time}
                </p>
              </>
            ) : (
              <p className="mt-2 text-lg text-[color:var(--hk-muted,var(--fd-muted))]">
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
                  <p className="text-xl font-black text-[color:var(--hk-text,var(--fd-text))]">
                    {data.announcement.title}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
                  {data.announcement.body}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                {isFr ? "Aucune annonce." : "No announcement."}
              </p>
            )}
          </HkSection>

          <HkSection title={isFr ? "Équipes en mentorat" : "Teams in mentoring"}>
            {data.mentoring.length === 0 ? (
              <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                {isFr ? "Aucune session active." : "No active session."}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.mentoring.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-3 py-2.5 text-sm"
                  >
                    <span className="font-bold text-[color:var(--hk-text,var(--fd-text))]">
                      {m.teamName}
                    </span>
                    <span className="text-[color:var(--hk-muted,var(--fd-muted))]">
                      {" "}
                      - {m.topic}
                    </span>
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
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr ? "Aucune équipe." : "No teams yet."}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.teams.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-3.5 py-3 ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
                >
                  <p className="font-bold text-[color:var(--hk-text,var(--fd-text))]">
                    {t.name}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
                    {isFr ? t.labelFr : t.labelEn ?? t.labelFr}
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
