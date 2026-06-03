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
import { academyCls } from "@/components/academy/academy-ui";
import {
  formatLiveCountdown,
  liveSessionRemainingSec,
  type LivePhase,
} from "@/lib/academy-live";
import type { AcademyLiveRole } from "@/lib/academy-live-role";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

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
  const [tipsOpen, setTipsOpen] = useState(false);
  const [panel, setPanel] = useState<OpenClassroomPanel>(null);
  const [tick, setTick] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ program: programSlug });
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}?${q}`,
      { credentials: "include", cache: "no-store" },
      20_000,
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(t("academy_error_load"));
      return;
    }
    const s = (j.sessions as SessionLive[] | undefined)?.find(
      (x) => x.slug === sessionSlug,
    );
    if (!s) {
      setErr(t("academy_live_session_not_found"));
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
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

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

  if (err && !session) {
    return (
      <div className={`pb-6 ${academyCls.root}`}>
        <p className="text-sm text-rose-700">{err}</p>
        <Link href={backHref} className="mt-3 inline-block text-sm font-semibold text-[color:var(--fd-primary)]">
          ← {t("academy_title")}
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`space-y-3 pb-24 ${academyCls.root}`}>
        <div className="h-24 animate-pulse rounded-2xl bg-[#e8f3ee]" />
        <div className="h-12 animate-pulse rounded-xl bg-[color:var(--fd-border)]/40" />
        <p className="text-center text-xs text-[color:var(--fd-muted)]">{t("academy_oc_loading")}</p>
      </div>
    );
  }

  const phase = session.livePhase;
  const isHost = liveRole === "host";
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

  const canJoin =
    session.isLiveNow && phase !== "ended" && phase !== "upcoming" && enrolled;

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
    <div className={`space-y-3 pb-28 ${academyCls.root}`}>
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
          {new Date(session.startsAt).toLocaleString()}
        </p>
        {phaseDetail ? (
          <p className="mt-2 rounded-lg bg-white/80 px-2.5 py-2 text-xs font-semibold text-[#1a2e1c]">
            <span className="font-extrabold text-[#305f33]">{phaseLabel}</span>
            {phaseDetail ? ` — ${phaseDetail}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-xs font-bold text-[#305f33]">{phaseLabel}</p>
        )}
      </header>

      {!enrolled ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("academy_live_enroll_required")}
        </p>
      ) : null}

      {enrolled && canJoin ? (
        <p className="text-center text-xs leading-relaxed text-[color:var(--fd-muted)]">
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

      <div className="rounded-xl border border-[color:var(--fd-border)] bg-white">
        <button
          type="button"
          onClick={() => setTipsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-bold text-[color:var(--fd-text)]"
        >
          {t("academy_live_tips_title")}
          <span className="text-[color:var(--fd-muted)]">{tipsOpen ? "−" : "+"}</span>
        </button>
        {tipsOpen ? (
          <ul className="space-y-2 border-t border-[color:var(--fd-border)] px-3 py-2.5 text-xs text-[color:var(--fd-text)]">
            <li>🎤 {t("academy_live_tip_mic")}</li>
            <li>📷 {t("academy_live_tip_camera")}</li>
            <li>🖥️ {t("academy_live_tip_screen")}</li>
            <li>✋ {t("academy_live_tip_hand")}</li>
            <li>📶 {t("academy_live_tip_data")}</li>
          </ul>
        ) : null}
      </div>

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
        canJoin={canJoin}
        isHost={isHost}
        joinVideoHref={isHost ? session.liveJoinUrlHost : session.liveJoinUrl}
        joinAudioHref={session.liveJoinUrlAudio}
        joinHostHref={session.liveJoinUrlHost}
        activePanel={panel}
        onPanel={setPanel}
        backHref={backHref}
        tutorEnabled={tutorEnabled}
      />
    </div>
  );
}
