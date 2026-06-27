"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import type { LiveSessionStatsView } from "@/lib/academy-live-stats";

export function AcademyLiveSessionStats({
  editionSlug,
  sessionSlug,
  programSlug,
}: {
  editionSlug: string;
  sessionSlug: string;
  programSlug: string;
}) {
  const { t } = useI18n();
  const [stats, setStats] = useState<LiveSessionStatsView | null>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    const q = new URLSearchParams({
      editionSlug,
      sessionSlug,
      program: programSlug,
    });
    const res = await fetchWithDeadline(
      `/api/academy/live/session-stats?${q}`,
      { credentials: "include", cache: "no-store" },
      15_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.stats) {
      setStats(j.stats as LiveSessionStatsView);
      setErr(false);
    } else {
      setErr(true);
    }
  }, [editionSlug, programSlug, sessionSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const backHref = `/app/academy/${editionSlug}?program=${encodeURIComponent(programSlug)}`;
  const replaysHref = `${backHref}#replays`;

  if (!stats && !err) {
    return (
      <div className="h-40 animate-pulse rounded-2xl bg-[#e8f3ee]" aria-hidden />
    );
  }

  return (
    <section
      className={`rounded-2xl border-2 border-[#305f33]/30 bg-gradient-to-br from-[#e8f3ee] to-white p-4 ${academyCls.root}`}
      aria-label={t("academy_live_stats_title")}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-700 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
          {t("academy_live_stats_badge")}
        </span>
      </div>
      <h2 className="mt-2 text-lg font-black text-[color:var(--fd-text)]">
        {stats?.sessionTitle ?? t("academy_live_stats_title")}
      </h2>
      <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
        {t("academy_live_stats_subtitle")}
      </p>

      {stats ? (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/90 p-3 shadow-sm">
            <dt className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("academy_live_stats_present")}
            </dt>
            <dd className="mt-1 text-xl font-black text-[#305f33]">
              {stats.attendeesCount}
              <span className="text-xs font-semibold text-[color:var(--fd-muted)]">
                {" "}
                / {stats.cohortEnrolled}
              </span>
            </dd>
          </div>
          <div className="rounded-xl bg-white/90 p-3 shadow-sm">
            <dt className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("academy_live_stats_duration")}
            </dt>
            <dd className="mt-1 text-xl font-black text-[#305f33]">
              {stats.durationMinutes}
              <span className="text-xs font-semibold"> min</span>
            </dd>
          </div>
          <div className="col-span-2 rounded-xl bg-white/90 p-3 shadow-sm">
            <dt className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("academy_live_stats_you")}
            </dt>
            <dd className="mt-1 text-sm font-bold text-[color:var(--fd-text)]">
              {stats.checkedIn
                ? t("academy_live_stats_checked_in")
                : t("academy_live_stats_not_checked_in")}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--fd-muted)]">{t("academy_error_load")}</p>
      )}

      <div className="mt-4 grid gap-2">
        {stats?.replayUrl ? (
          <a
            href={stats.replayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#305f33] px-4 py-3 text-sm font-extrabold text-white"
          >
            <AcademyIcon name="video" className="h-5 w-5 !text-white" />
            {t("academy_watch_replay")} ↗
          </a>
        ) : (
          <p className="rounded-xl bg-white/80 px-3 py-2 text-center text-xs text-[color:var(--fd-muted)]">
            {t("academy_classroom_replay_pending")}
          </p>
        )}
        <Link
          href={backHref}
          className="block text-center text-sm font-bold text-[#305f33] underline"
        >
          {t("academy_live_stats_back_events")}
        </Link>
        {stats?.replayUrl ? (
          <Link
            href={replaysHref}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem("academy_tab", "replays");
              }
            }}
            className="block text-center text-xs font-semibold text-[color:var(--fd-muted)]"
          >
            {t("academy_live_stats_open_replays")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function AcademyLiveEndingSoonBanner({
  minutesLeft,
}: {
  minutesLeft: 15 | 10 | 5;
}) {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-3 py-2.5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200">
        <AcademyIcon name="live" className="h-5 w-5 text-amber-900" />
      </span>
      <p className="text-xs font-extrabold leading-snug text-amber-950">
        {interpolate(t("academy_live_ending_soon"), { minutes: String(minutesLeft) })}
      </p>
    </div>
  );
}
