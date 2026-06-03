"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { AcademyLiveChat } from "@/components/academy/academy-live-chat";
import { academyCls } from "@/components/academy/academy-ui";
import type { LivePhase } from "@/lib/academy-live";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type SessionLive = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  liveJoinUrl: string;
  livePhase: LivePhase;
  setupEndsAt: string;
  isLiveNow: boolean;
  checkedIn: boolean;
  canCheckIn: boolean;
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
  const [checking, setChecking] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
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
    setErr(null);
  }, [editionSlug, programSlug, sessionSlug, t]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

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

  if (err && !session) {
    return (
      <div className={`pb-6 ${academyCls.root}`}>
        <p className="text-sm text-rose-700">{err}</p>
        <Link
          href={`/app/academy/${editionSlug}?program=${encodeURIComponent(programSlug)}`}
          className="mt-3 inline-block text-sm font-semibold text-[color:var(--fd-primary)]"
        >
          ← {t("academy_title")}
        </Link>
      </div>
    );
  }

  if (!session) {
    return <p className={`text-sm text-[color:var(--fd-muted)] ${academyCls.root}`}>…</p>;
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

  const canJoin =
    session.isLiveNow && phase !== "ended" && phase !== "upcoming" && enrolled;

  return (
    <div className={`space-y-3 pb-8 ${academyCls.root}`}>
      <Link
        href={`/app/academy/${editionSlug}?program=${encodeURIComponent(programSlug)}`}
        className="text-sm font-semibold text-[color:var(--fd-primary)]"
      >
        ← {editionTitle || t("academy_title")}
      </Link>

      <header className="rounded-2xl border-2 border-[#305f33] bg-gradient-to-br from-[#e8f3ee] to-white p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#305f33]">
          {session.isLiveNow ? "● LIVE" : t("academy_sessions")}
        </p>
        <h1 className="mt-1 text-lg font-black text-[color:var(--fd-text)]">{session.title}</h1>
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

      {canJoin ? (
        <a
          href={session.liveJoinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full flex-col items-center rounded-2xl bg-[#305f33] px-4 py-4 text-center text-white shadow-lg active:scale-[0.99]"
        >
          <span className="text-base font-black">{t("academy_join_live")}</span>
          <span className="mt-1 text-[10px] font-medium opacity-90">
            {t("academy_live_join_sub")}
          </span>
        </a>
      ) : null}

      <p className="text-[10px] leading-relaxed text-[color:var(--fd-muted)]">
        {t("academy_live_bandwidth_note")}
      </p>

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

      {enrolled && session.isLiveNow ? (
        <AcademyLiveChat editionSlug={editionSlug} programSlug={programSlug} />
      ) : null}
    </div>
  );
}
