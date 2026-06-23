"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { AcademyLiveChat } from "@/components/academy/academy-live-chat";
import {
  AcademyOpenClassroomBar,
  type OpenClassroomPanel,
} from "@/components/academy/academy-open-classroom-bar";
import { AcademyLiveTutorSheet } from "@/components/academy/academy-live-tutor-sheet";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";
import {
  formatLiveCountdown,
  liveSessionRemainingSec,
  type LivePhase,
} from "@/lib/academy-live";
import type { AcademyLiveRole } from "@/lib/academy-live-role";
import { isAcademyLiveEmbedEnabled } from "@/lib/academy-live-embed";
import { AcademyLiveEmbed } from "@/components/academy/academy-live-embed";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { useAcademyLiveJoinUrls } from "@/hooks/use-academy-live-join-urls";
import {
  AcademyLiveCompanionGuide,
  AcademyLiveStatusBanner,
  AcademyLiveTipsGrid,
} from "@/components/academy/academy-live-companion-guide";
import { buildLiveEnterAppPath } from "@/lib/academy-live-enter-path";

type SessionLive = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  liveJoinUrl: string;
  liveJoinUrlHost: string;
  liveJoinUrlAudio: string;
  livePhase: LivePhase;
  setupEndsAt: string;
  liveStartedAt: string | null;
  isLiveNow: boolean;
  checkedIn: boolean;
  canCheckIn: boolean;
  remainingSec: number;
  remainingKind: "until_start" | "until_end" | "ended";
};

export function AcademyLiveRoomClient({
  editionSlug,
  sessionSlug,
  programSlug,
}: {
  editionSlug: string;
  sessionSlug: string;
  programSlug: string;
}) {
  const { t } = useI18n();
  const [session, setSession] = useState<SessionLive | null>(null);
  const [editionTitle, setEditionTitle] = useState("");
  const [enrolled, setEnrolled] = useState(false);
  const [tutorEnabled, setTutorEnabled] = useState(true);
  const [liveRole, setLiveRole] = useState<AcademyLiveRole>("learner");
  const [checking, setChecking] = useState(false);
  const [panel, setPanel] = useState<OpenClassroomPanel>(null);
  const [tick, setTick] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const canJoinEnabled =
    !!session &&
    enrolled &&
    session.isLiveNow &&
    session.livePhase !== "ended" &&
    session.livePhase !== "upcoming";

  const isHost = liveRole === "host";

  const { urls: gatedUrls, gateError } = useAcademyLiveJoinUrls({
    editionSlug,
    sessionSlug,
    programSlug,
    enabled: canJoinEnabled,
    isHost,
    liveStartedAt: session?.liveStartedAt ?? null,
  });

  const load = useCallback(async () => {
    await fetch("/api/auth/session", { credentials: "same-origin" }).catch(
      () => undefined,
    );
    const q = new URLSearchParams({
      program: programSlug,
      companion: sessionSlug,
    });
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}?${q}`,
      { credentials: "include", cache: "no-store" },
      20_000,
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        const next = encodeURIComponent(
          `/app/academy/${editionSlug}/live/${sessionSlug}?program=${encodeURIComponent(programSlug)}`,
        );
        window.location.href = `/login?next=${next}`;
        return;
      }
      setErr(t("academy_error_load"));
      return;
    }
    const sessions = (j.sessions as SessionLive[] | undefined) ?? [];
    const replays = (j.replays as SessionLive[] | undefined) ?? [];
    const companion = j.companionSession as SessionLive | null | undefined;
    const s =
      companion ??
      [...sessions, ...replays].find((x) => x.slug === sessionSlug);
    if (!s) {
      setErr(t("academy_live_session_not_found"));
      setEditionTitle((j.edition as { title?: string })?.title ?? "");
      setEnrolled(!!(j.edition as { enrolled?: boolean })?.enrolled);
      return;
    }
    setSession(s);
    setEditionTitle((j.edition as { title?: string })?.title ?? "");
    setEnrolled(!!(j.edition as { enrolled?: boolean })?.enrolled);
    setTutorEnabled(!!(j.edition as { tutorEnabled?: boolean })?.tutorEnabled);
    setLiveRole((j.liveRole as AcademyLiveRole) ?? "learner");
    setErr(null);
  }, [editionSlug, programSlug, sessionSlug, t]);

  useEffect(() => {
    void load();
    const waitingGuest =
      session?.isLiveNow &&
      !session.liveStartedAt &&
      liveRole !== "host";
    const ms = waitingGuest ? 5_000 : 30_000;
    const id = setInterval(() => void load(), ms);
    return () => clearInterval(id);
  }, [load, liveRole, session?.isLiveNow, session?.liveStartedAt]);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function checkIn() {
    if (!session) return;
    setChecking(true);
    try {
      await fetchWithDeadline(
        "/api/academy/attendance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId: session.id }),
        },
        15_000,
      );
      await load();
    } finally {
      setChecking(false);
    }
  }

  const backHref = `/app/academy/${editionSlug}?program=${encodeURIComponent(programSlug)}`;
  const enterBase = { editionSlug, sessionSlug, programSlug };
  const joinVideo = buildLiveEnterAppPath({
    ...enterBase,
    mode: liveRole === "host" ? "host" : "learner",
  });
  const joinHost = buildLiveEnterAppPath({ ...enterBase, mode: "host" });
  const joinAudio = buildLiveEnterAppPath({ ...enterBase, mode: "audio" });

  if (err && !session) {
    return (
      <div className={`space-y-4 pb-6 ${academyCls.root}`}>
        <Link href={backHref} className="text-sm font-semibold text-[color:var(--fd-primary)]">
          ← {editionTitle || t("academy_title")}
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-950">{err}</p>
          <p className="mt-2 text-xs text-amber-900">
            {t("academy_live_companion_rejoin_hint")}
          </p>
        </div>
        <div className="grid gap-2">
          <a
            href={joinVideo}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#305f33] px-4 py-3 text-sm font-extrabold text-white"
          >
            <AcademyIcon name="video" className="h-5 w-5 !text-white" />
            {t("academy_live_rejoin_video")}
          </a>
          <a
            href={joinAudio}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#305f33] bg-white px-4 py-3 text-sm font-bold text-[#305f33]"
          >
            <AcademyIcon name="audio" className="h-5 w-5" />
            {t("academy_live_rejoin_audio")}
          </a>
          <Link
            href={backHref}
            className="block text-center text-sm font-bold text-[color:var(--fd-muted)] underline"
          >
            {t("academy_live_leave_classroom")}
          </Link>
          <Link
            href="/app"
            className="block text-center text-xs font-semibold text-[color:var(--fd-muted)]"
          >
            {t("academy_live_back_home")}
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`space-y-3 pb-[calc(10.5rem+env(safe-area-inset-bottom))] ${academyCls.root}`}>
        <div className="h-24 animate-pulse rounded-2xl bg-[#e8f3ee]" />
        <div className="h-12 animate-pulse rounded-xl bg-[color:var(--fd-border)]/40" />
        <p className="text-center text-xs text-[color:var(--fd-muted)]">{t("academy_oc_loading")}</p>
      </div>
    );
  }

  const phase = session.livePhase;
  const phaseLabel =
    phase === "setup"
      ? t("academy_live_phase_setup")
      : phase === "main"
        ? t("academy_live_phase_main")
        : phase === "warmup"
          ? t("academy_live_phase_warmup")
          : phase === "ended"
            ? t("academy_live_phase_ended")
            : t("academy_live_phase_upcoming");

  const phaseDetail =
    phase === "setup"
      ? interpolate(t("academy_live_phase_setup_detail"), {
          until: new Date(session.setupEndsAt).toLocaleTimeString(),
        })
      : phase === "main"
        ? t("academy_live_phase_main_detail")
        : phase === "warmup"
          ? t("academy_live_phase_warmup_detail")
          : "";

  const hostStarted = Boolean(session.liveStartedAt);
  const waitingForHost = canJoinEnabled && !isHost && !hostStarted;
  const canJoinVideo =
    canJoinEnabled &&
    (isHost || hostStarted) &&
    gateError !== "academy_live_account_required" &&
    gateError !== "academy_live_host_requires_payment" &&
    gateError !== "academy_live_enroll_required";
  const joinVideoLive = buildLiveEnterAppPath({
    ...enterBase,
    mode: isHost ? "host" : "learner",
  });
  const joinHostLive = buildLiveEnterAppPath({ ...enterBase, mode: "host" });
  const joinAudioLive = buildLiveEnterAppPath({ ...enterBase, mode: "audio" });

  const timing = liveSessionRemainingSec({
    startsAt: new Date(session.startsAt),
    endsAt: session.endsAt ? new Date(session.endsAt) : null,
  });
  void tick;

  const remainingLabel =
    timing.kind === "until_start"
      ? t("academy_oc_starts_in")
      : timing.kind === "until_end"
        ? t("academy_oc_ends_in")
        : null;
  const displayRemaining =
    timing.kind !== "ended" ? formatLiveCountdown(timing.seconds) : null;

  return (
    <div className={`space-y-3 pb-[calc(10.5rem+env(safe-area-inset-bottom))] ${academyCls.root}`}>
      <Link href={backHref} className="text-sm font-semibold text-[color:var(--fd-primary)]">
        ← {editionTitle || t("academy_title")}
      </Link>

      <header className="rounded-2xl border-2 border-[#305f33] bg-gradient-to-br from-[#e8f3ee] to-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {session.isLiveNow ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              LIVE
            </span>
          ) : (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-600">
              {t("academy_sessions")}
            </span>
          )}
          {isHost ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">
              {t("academy_oc_host_badge")}
            </span>
          ) : null}
          {remainingLabel && session.remainingKind !== "ended" ? (
            <span className="ml-auto text-[10px] font-bold text-[#305f33]">
              {remainingLabel} {displayRemaining}
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 text-lg font-black text-[color:var(--fd-text)]">{session.title}</h1>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
          {new Date(session.startsAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          <span className="block text-[10px] opacity-80">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-extrabold text-[#305f33]">
          <AcademyIcon name="live" className="h-3.5 w-3.5 shrink-0" />
          {phaseLabel}
          {phaseDetail ? (
            <span className="font-semibold text-[color:var(--fd-muted)]">
              · {phaseDetail}
            </span>
          ) : null}
        </p>
      </header>

      <AcademyLiveCompanionGuide />

      {isHost && canJoinEnabled && !hostStarted ? (
        <AcademyLiveStatusBanner variant="host_start" />
      ) : null}

      {waitingForHost ? <AcademyLiveStatusBanner variant="waiting_host" /> : null}

      {!enrolled ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("academy_live_enroll_required")}
        </p>
      ) : null}

      {gateError &&
      canJoinEnabled &&
      gateError !== "academy_live_waiting_host" ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t(gateError as "academy_live_enroll_required")}
        </p>
      ) : null}

      {enrolled && canJoinVideo && gatedUrls && isAcademyLiveEmbedEnabled() ? (
        <AcademyLiveEmbed
          joinUrl={joinVideoLive}
          title={session.title}
        />
      ) : enrolled && canJoinVideo ? (
        <p className="flex items-center justify-center gap-1.5 text-center text-[10px] font-bold text-[color:var(--fd-muted)]">
          <AcademyIcon name="chat" className="h-3.5 w-3.5 shrink-0" />
          {t("academy_live_bandwidth_note")}
        </p>
      ) : null}

      {enrolled && session.canCheckIn ? (
        <button
          type="button"
          disabled={checking}
          onClick={() => void checkIn()}
          className="w-full rounded-xl border-2 border-[color:var(--fd-primary)] bg-white py-2.5 text-sm font-bold text-[color:var(--fd-primary)] disabled:opacity-60"
        >
          {checking ? "…" : t("academy_check_in")}
        </button>
      ) : session.checkedIn ? (
        <p className="text-center text-xs font-bold text-[color:var(--fd-primary)]">
          ✓ {t("academy_checked_in")}
        </p>
      ) : null}

      <AcademyLiveTipsGrid />

      {panel === "chat" && enrolled && session.isLiveNow ? (
        <AcademyLiveChat editionSlug={editionSlug} programSlug={programSlug} />
      ) : null}

      <AcademyLiveTutorSheet
        editionSlug={editionSlug}
        programSlug={programSlug}
        open={panel === "tutor"}
        onClose={() => setPanel(null)}
      />

      <AcademyOpenClassroomBar
        canJoin={canJoinVideo}
        isHost={isHost}
        joinVideoHref={joinVideoLive}
        joinAudioHref={joinAudioLive}
        joinHostHref={joinHostLive}
        activePanel={panel}
        onPanel={setPanel}
        backHref={backHref}
        tutorEnabled={tutorEnabled}
        waitingForHost={waitingForHost}
      />
    </div>
  );
}
