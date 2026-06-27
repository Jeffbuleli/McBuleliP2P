"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { AcademyCohortChat } from "@/components/academy/academy-cohort-chat";
import { AcademyTutorPanel } from "@/components/academy/academy-tutor-panel";
import { AcademyEditionEnrollBar } from "@/components/academy/academy-edition-enroll-bar";
import { academyCls } from "@/components/academy/academy-ui";
import { academySessionContinueHref } from "@/lib/academy-route-paths";
import { normalizeTopicSlug, topicIllustration } from "@/lib/academy-topic-path";

type ClassroomTab = "events" | "modules" | "replays" | "chat";

const CLASSROOM_TABS = [
  { id: "events" as const, labelFr: "Événements", labelEn: "Events" },
  { id: "modules" as const, labelFr: "Leçons", labelEn: "Lessons" },
  { id: "replays" as const, labelFr: "Replays", labelEn: "Replays" },
  { id: "chat" as const, labelFr: "Classe", labelEn: "Class" },
];

type SessionRow = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  checkedIn: boolean;
  canCheckIn: boolean;
  isLiveNow: boolean;
  livePhase: string;
  hasReplay: boolean;
  replayUrl: string | null;
};

type ModuleRow = {
  slug: string;
  title: string;
  summary: string;
  visualKey: string;
  unlocked: boolean;
  completed: boolean;
};

type Detail = {
  edition: {
    slug: string;
    programSlug: string;
    title: string;
    enrolled: boolean;
    tutorEnabled: boolean;
    priceUsdt: string | null;
    requiresKyc: boolean;
    status: string;
    cohortMemberCount?: number;
  };
  sessions: SessionRow[];
  replays: SessionRow[];
};

export function AcademyEditionClient({
  editionSlug,
  programSlug,
}: {
  editionSlug: string;
  programSlug: string;
}) {
  const { t, locale } = useI18n();
  const fr = locale === "fr";
  const [tab, setTab] = useState<ClassroomTab>("events");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [bpFlash, setBpFlash] = useState<number | null>(null);

  const q = `?program=${encodeURIComponent(programSlug)}`;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ program: programSlug });
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}?${params}`,
      { credentials: "include", cache: "no-store" },
      20_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setDetail({
        edition: j.edition,
        sessions: j.sessions ?? [],
        replays: j.replays ?? [],
      });
    }
  }, [editionSlug, programSlug]);

  const loadModules = useCallback(async () => {
    const params = new URLSearchParams({ program: programSlug });
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}/modules?${params}`,
      { credentials: "include", cache: "no-store" },
      15_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setModules((j.modules as ModuleRow[]) ?? []);
      setModulesLoaded(true);
    }
  }, [editionSlug, programSlug]);

  const isBroadcasting = (s: SessionRow) =>
    s.livePhase === "main" || s.livePhase === "setup";

  useEffect(() => {
    void load();
    const hasLive = detail?.sessions.some(isBroadcasting);
    if (!hasLive) return;
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load, detail?.sessions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("academy_tab");
    if (saved === "replays" || saved === "events" || saved === "modules" || saved === "chat") {
      setTab(saved);
      window.sessionStorage.removeItem("academy_tab");
    }
  }, [detail?.edition.slug]);

  useEffect(() => {
    if (tab === "modules" && !modulesLoaded) void loadModules();
  }, [tab, modulesLoaded, loadModules]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#academy-tutor") {
      setTab("chat");
      document.getElementById("academy-tutor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (window.location.hash === "#academy-chat") setTab("chat");
  }, [detail?.edition.enrolled]);

  async function trackReplay(sessionId: string) {
    try {
      await fetchWithDeadline(
        "/api/academy/replay",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        },
        10_000,
      );
    } catch {
      /* best-effort */
    }
  }

  async function checkIn(sessionId: string) {
    setChecking(sessionId);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/attendance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        },
        15_000,
      );
      const j = await res.json().catch(() => ({}));
      if (res.ok && typeof j.grantedBp === "number" && j.grantedBp > 0) {
        setBpFlash(j.grantedBp);
        setTimeout(() => setBpFlash(null), 4000);
      }
      await load();
    } finally {
      setChecking(null);
    }
  }

  if (!detail) {
    return <p className="text-sm text-[color:var(--fd-muted)]">…</p>;
  }

  const liveCount = detail.sessions.filter(isBroadcasting).length;
  const modulesDone = modules.filter((m) => m.completed).length;

  return (
    <div className={`space-y-4 pb-6 ${academyCls.root}`}>
      <Link href="/app/academy" className="text-sm font-semibold text-[color:var(--fd-primary)]">
        ← {t("academy_title")}
      </Link>

      <header className="rounded-2xl border border-[#305f33]/20 bg-gradient-to-br from-[#e8f3ee] via-white to-white p-4 shadow-sm">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#305f33]">
          {t("academy_classroom_label")}
        </p>
        <h1 className="mt-1 text-xl font-extrabold text-[color:var(--fd-text)]">
          {detail.edition.title}
        </h1>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-semibold text-[color:var(--fd-muted)]">
          <span>
            {detail.sessions.length} {t("academy_events").toLowerCase()}
          </span>
          {typeof detail.edition.cohortMemberCount === "number" ? (
            <span>
              {detail.edition.cohortMemberCount} {t("academy_cohort_members")}
            </span>
          ) : null}
          {liveCount > 0 ? (
            <span className="font-bold text-[#305f33]">LIVE · {liveCount}</span>
          ) : null}
          {modulesLoaded ? (
            <span>
              {modulesDone}/{modules.length} {t("academy_classroom_lessons")}
            </span>
          ) : null}
        </div>
      </header>

      {bpFlash != null ? (
        <p className="rounded-xl bg-[#e8f3ee] px-3 py-2 text-sm font-bold text-[#305f33]">
          +{bpFlash} BP
        </p>
      ) : null}

      {!detail.edition.enrolled &&
      ["open", "active"].includes(detail.edition.status) ? (
        <AcademyEditionEnrollBar
          editionSlug={editionSlug}
          programSlug={programSlug}
          title={detail.edition.title}
          priceUsdt={detail.edition.priceUsdt}
          requiresKyc={detail.edition.requiresKyc}
          onEnrolled={() => void load()}
        />
      ) : null}

      <CommunityFilterTabs
        tabs={CLASSROOM_TABS}
        active={tab}
        onChange={setTab}
        fr={fr}
      />

      {tab === "events" ? (
        <section>
          {detail.sessions.length === 0 ? (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">{t("academy_events_empty")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {detail.sessions.map((s) => {
                const broadcasting = isBroadcasting(s);
                const ended = s.livePhase === "ended";
                return (
                <li
                  key={s.id}
                  className={`rounded-xl border bg-white p-3 ${
                    broadcasting ? "border-[#305f33] border-l-4" : "border-[color:var(--fd-border)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img src="/academy/event-live.svg" alt="" className="h-9 w-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{s.title}</p>
                      <p className="mt-0.5 text-xs text-[color:var(--fd-muted)]">
                        {new Date(s.startsAt).toLocaleString(fr ? "fr-FR" : "en-US")}
                      </p>
                      {broadcasting ? (
                        <span className="mt-1 inline-block text-[10px] font-bold uppercase text-[#305f33]">
                          LIVE
                        </span>
                      ) : ended ? (
                        <span className="mt-1 inline-block text-[10px] font-bold uppercase text-stone-500">
                          {t("academy_live_phase_ended")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={academySessionContinueHref({
                      editionSlug,
                      programSlug,
                      sessionSlug: s.slug,
                      isLiveNow: broadcasting,
                    })}
                    className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-extrabold ${
                      broadcasting
                        ? "bg-[#305f33] text-white"
                        : ended
                          ? "border border-stone-300 text-stone-700"
                          : "border border-[#305f33]/30 text-[#305f33]"
                    }`}
                  >
                    <AcademyIcon
                      name={broadcasting ? "live" : ended ? "video" : "calendar"}
                      className={`h-4 w-4 ${broadcasting ? "!text-white" : ""}`}
                    />
                    {broadcasting
                      ? "McBuleli Live →"
                      : ended
                        ? t("academy_live_stats_title")
                        : t("academy_classroom_open_session")}
                  </Link>
                  {s.checkedIn ? (
                    <p className="mt-2 text-xs font-bold text-[color:var(--fd-primary)]">
                      ✓ {t("academy_checked_in")}
                    </p>
                  ) : s.canCheckIn ? (
                    <button
                      type="button"
                      disabled={checking === s.id}
                      onClick={() => void checkIn(s.id)}
                      className="mt-2 w-full rounded-lg bg-[color:var(--fd-primary)] px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {t("academy_check_in")}
                    </button>
                  ) : !broadcasting && !ended ? (
                    <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
                      {t("academy_checkin_closed")}
                    </p>
                  ) : null}
                </li>
              );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "modules" ? (
        <section>
          {modules.length === 0 ? (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
              {t("academy_classroom_modules_empty")}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {modules.map((m) => {
                const href = `/app/academy/${editionSlug}/module/${m.slug}${q}`;
                const topic = normalizeTopicSlug(m.visualKey);
                const illus = topic
                  ? topicIllustration(topic)
                  : "/academy/hero-explorer.svg";
                return (
                  <li key={m.slug}>
                    {m.unlocked ? (
                      <Link
                        href={href}
                        className="flex items-center gap-3 rounded-xl border border-[color:var(--fd-border)] bg-white p-3 shadow-sm active:scale-[0.99]"
                      >
                        <img src={illus} alt="" className="h-11 w-11 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[color:var(--fd-text)]">{m.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--fd-muted)]">
                            {m.summary}
                          </p>
                          {m.completed ? (
                            <span className="mt-1 inline-block text-[10px] font-bold text-[#305f33]">
                              ✓ {t("academy_module_done")}
                            </span>
                          ) : null}
                        </div>
                        <span aria-hidden className="text-[color:var(--fd-muted)]">
                          →
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/20 p-3 opacity-70">
                        <img src={illus} alt="" className="h-11 w-11 shrink-0 grayscale" />
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--fd-muted)]">{m.title}</p>
                          <p className="text-[10px] text-[color:var(--fd-muted)]">
                            {t("academy_module_locked")}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "replays" ? (
        <section>
          {detail.replays.length === 0 ? (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
              {t("academy_classroom_replays_empty")}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {detail.replays.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-[color:var(--fd-border)] bg-white p-3"
                >
                  <AcademyIcon name="video" className="h-8 w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.title}</p>
                    {s.replayUrl ? (
                      <a
                        href={s.replayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => void trackReplay(s.id)}
                        className="mt-2 inline-flex w-full justify-center rounded-lg border border-[#305f33]/30 px-3 py-2 text-sm font-bold text-[#305f33]"
                      >
                        {t("academy_watch_replay")} ↗
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                        {t("academy_classroom_replay_pending")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "chat" && detail.edition.enrolled ? (
        <section id="academy-chat" className="space-y-4">
          <AcademyTutorPanel
            editionSlug={editionSlug}
            programSlug={programSlug}
            enabled={detail.edition.tutorEnabled}
          />
          <AcademyCohortChat editionSlug={editionSlug} programSlug={programSlug} />
        </section>
      ) : tab === "chat" ? (
        <p className="text-xs text-[color:var(--fd-muted)]">{t("academy_classroom_chat_locked")}</p>
      ) : null}
    </div>
  );
}
