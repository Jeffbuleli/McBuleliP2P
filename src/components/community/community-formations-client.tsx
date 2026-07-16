"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import { CommunityLiveBanner } from "@/components/community/community-live-banner";
import {
  CommunityEmptyState,
  EmptyTrainingIllustration,
} from "@/components/community/community-empty-illustrations";
import { CommunityFormationCard } from "@/components/community/community-formation-card";
import {
  CommunityUpcomingEventCard,
  type UpcomingEventRow,
} from "@/components/community/community-upcoming-event-card";
import { academyCohortHref, academySessionContinueHref } from "@/lib/academy-route-paths";
import { formatUpcomingSessionDate } from "@/lib/community/formation-post-meta";
import type { FormationPostMeta } from "@/lib/community/formation-post-meta";
import Link from "next/link";

type FormationTab = "programs" | "upcoming" | "live" | "replays";

type Session = {
  editionSlug: string;
  programSlug: string;
  sessionSlug: string;
  title: string;
  startsAt: string;
  isLiveNow: boolean;
};

type Edition = {
  slug: string;
  title: string;
  startsAt: string | null;
  endsAt?: string | null;
  enrolled: boolean;
  programSlug: string;
  programTitle?: string;
  status?: string;
  priceUsdt?: string | null;
  requiresKyc?: boolean;
};

type FormationPost = {
  id: string;
  formationMeta: FormationPostMeta | null;
};

type AcademyProgram = {
  slug: string;
  title: string;
  summary: string | null;
  level: string;
  priceUsdt: string | null;
  requiresKyc: boolean;
};

type ReplayRow = {
  sessionSlug: string;
  editionSlug: string;
  programSlug: string;
  title: string;
  endedAt: string | null;
  replayUrl: string;
};

const TABS = [
  { id: "programs" as const, labelFr: "Programmes", labelEn: "Programs" },
  { id: "upcoming" as const, labelFr: "À venir", labelEn: "Upcoming" },
  { id: "live" as const, labelFr: "En direct", labelEn: "Live now" },
  { id: "replays" as const, labelFr: "Replays", labelEn: "Replays" },
];

export function CommunityFormationsClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [tab, setTab] = useState<FormationTab>("programs");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventRow[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [catalogEditions, setCatalogEditions] = useState<Edition[]>([]);
  const [formationPosts, setFormationPosts] = useState<FormationPost[]>([]);
  const [programs, setPrograms] = useState<AcademyProgram[]>([]);
  const [replays, setReplays] = useState<ReplayRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/community/formations")
      .then((r) => r.json())
      .then(
        (d: {
          upcomingSessions?: Session[];
          upcomingEvents?: UpcomingEventRow[];
          editions?: Edition[];
          catalogEditions?: Edition[];
          formationPosts?: FormationPost[];
          programs?: AcademyProgram[];
          replays?: ReplayRow[];
        }) => {
          setSessions(d.upcomingSessions ?? []);
          setUpcomingEvents(d.upcomingEvents ?? []);
          setEditions(d.editions ?? []);
          setCatalogEditions(d.catalogEditions ?? d.editions ?? []);
          setPrograms(d.programs ?? []);
          setReplays(d.replays ?? []);
          const posts = (d.formationPosts ?? []).filter(
            (p: FormationPost) => p.formationMeta,
          );
          setFormationPosts(posts);
        },
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const liveSessions = sessions.filter((s) => s.isLiveNow);

  const eventSlugs = new Set(upcomingEvents.map((e) => e.eventSlug));
  const extraEditions = editions.filter(
    (e) =>
      !upcomingEvents.some((ev) => ev.editionSlug === e.slug) &&
      !e.enrolled,
  );

  const programEditions =
    catalogEditions.length > 0 ? catalogEditions : editions;

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityModuleHeader title={fr ? "Lives & Formations" : "Live & Training"} />
      <CommunityLiveBanner fr={fr} />

      <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#e8f3ee] px-3 py-2">
        <img src="/academy/event-live.svg" alt="" className="h-9 w-9" />
        <p className="text-xs text-[#305f33]">
          {fr
            ? "Inscrivez-vous aux lives à venir - directement depuis cette liste."
            : "Enroll in upcoming lives - right from this list."}
        </p>
      </div>

      <CommunityFilterTabs tabs={TABS} active={tab} onChange={setTab} fr={fr} />

      {loading ? (
        <p className="py-12 text-center text-sm text-[#78716c]">…</p>
      ) : tab === "programs" ? (
        programs.length === 0 &&
        programEditions.length === 0 &&
        formationPosts.length === 0 ? (
          <CommunityEmptyState
            illustration={<EmptyTrainingIllustration />}
            title={fr ? "Aucun programme publié" : "No published programs"}
            body={
              fr
                ? "Les parcours Academy publiés apparaîtront ici."
                : "Published Academy programs will appear here."
            }
          />
        ) : (
          <ul className="mt-3 space-y-4">
            {programs.map((p) => (
              <li key={p.slug} className="fd-card p-4">
                <span className="rounded-full bg-[#eaf5ee] px-2 py-0.5 text-[9px] font-bold uppercase text-[#305f33]">
                  {p.level}
                </span>
                <p className="mt-1 text-sm font-bold text-[#0c0a09]">{p.title}</p>
                {p.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[#78716c]">{p.summary}</p>
                ) : null}
                <Link
                  href={`/app/academy?program=${encodeURIComponent(p.slug)}`}
                  className="mt-3 inline-flex rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
                >
                  {fr ? "Voir le programme" : "View program"}
                </Link>
              </li>
            ))}
            {programEditions.map((e) => (
              <li key={e.slug} className="fd-card p-4">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#eaf5ee] px-2 py-0.5 text-[9px] font-bold uppercase text-[#305f33]">
                    {e.programTitle ?? e.programSlug}
                  </span>
                  {e.status && e.status !== "open" && e.status !== "active" ? (
                    <span className="rounded-full bg-[#f5f5f4] px-2 py-0.5 text-[9px] font-bold text-[#78716c]">
                      {e.status}
                    </span>
                  ) : null}
                  {e.enrolled ? (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-800">
                      {fr ? "Inscrit" : "Enrolled"}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-bold text-[#0c0a09]">{e.title}</p>
                {e.startsAt ? (
                  <p className="mt-1 text-xs text-[#78716c]">
                    {formatUpcomingSessionDate(e.startsAt, fr)}
                  </p>
                ) : null}
                <Link
                  href={academyCohortHref(e.slug, e.programSlug)}
                  className="mt-3 inline-flex rounded-xl border border-[#dce8e0] bg-white px-4 py-2 text-xs font-bold text-[#305f33]"
                >
                  {fr ? "Ouvrir l'édition" : "Open edition"}
                </Link>
              </li>
            ))}
            {formationPosts.map((p) =>
              p.formationMeta ? (
                <li key={p.id}>
                  <CommunityFormationCard
                    meta={p.formationMeta}
                    fr={fr}
                    isLive={p.formationMeta.eventStatus === "LIVE"}
                  />
                </li>
              ) : null,
            )}
          </ul>
        )
      ) : tab === "live" ? (
        liveSessions.length === 0 ? (
          <CommunityEmptyState
            illustration={<EmptyTrainingIllustration />}
            title={fr ? "Aucun live en cours" : "No live session now"}
            body={fr ? "Consultez l'onglet À venir." : "Check the Upcoming tab."}
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {liveSessions.map((s) => (
              <li key={`${s.editionSlug}-${s.sessionSlug}`}>
                <Link
                  href={academySessionContinueHref(s)}
                  className="fd-card block border-l-4 border-[#305f33] px-4 py-3"
                >
                  <span className="text-[10px] font-bold uppercase text-[#305f33]">LIVE</span>
                  <p className="text-sm font-bold text-[#0c0a09]">{s.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : tab === "upcoming" ? (
        upcomingEvents.length === 0 &&
        sessions.filter((s) => !s.isLiveNow).length === 0 &&
        extraEditions.length === 0 ? (
          <CommunityEmptyState
            illustration={<EmptyTrainingIllustration />}
            title={fr ? "Aucun événement à venir" : "No upcoming events"}
            body={fr ? "Revenez bientôt." : "Check back soon."}
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {upcomingEvents.map((ev) => (
              <CommunityUpcomingEventCard
                key={ev.eventSlug}
                event={ev}
                fr={fr}
                onChanged={load}
              />
            ))}
            {sessions
              .filter((s) => !s.isLiveNow)
              .filter((s) => !eventSlugs.has(s.sessionSlug))
              .map((s) => (
                <li key={`${s.editionSlug}-${s.sessionSlug}`} className="fd-card p-4">
                  <span className="rounded-full bg-[#eaf5ee] px-2 py-0.5 text-[9px] font-bold text-[#305f33]">
                    {fr ? "Inscrit" : "Enrolled"}
                  </span>
                  <p className="mt-1 text-sm font-bold text-[#0c0a09]">{s.title}</p>
                  <p className="text-xs text-[#78716c]">
                    {formatUpcomingSessionDate(s.startsAt, fr)}
                  </p>
                  <Link
                    href={academySessionContinueHref(s)}
                    className="mt-3 inline-flex rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
                  >
                    {fr ? "Ouvrir" : "Open"}
                  </Link>
                </li>
              ))}
            {extraEditions.map((e) => (
              <CommunityUpcomingEventCard
                key={e.slug}
                event={{
                  eventSlug: e.slug,
                  title: e.title,
                  startsAt: e.startsAt ?? new Date().toISOString(),
                  editionSlug: e.slug,
                  programSlug: e.programSlug,
                  editionTitle: e.title,
                  enrolled: e.enrolled,
                  priceUsdt: e.priceUsdt ?? null,
                  requiresKyc: e.requiresKyc ?? false,
                }}
                fr={fr}
                onChanged={load}
              />
            ))}
          </ul>
        )
      ) : (
        replays.length === 0 ? (
          <CommunityEmptyState
            illustration={<EmptyTrainingIllustration />}
            title={fr ? "Aucun replay disponible" : "No replays available"}
            body={
              fr
                ? "Inscrivez-vous à une formation pour accéder aux replays de vos sessions."
                : "Enroll in a program to access replays from your sessions."
            }
            action={
              <Link
                href="/app/academy"
                className="inline-block rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
              >
                {fr ? "Academy →" : "Academy →"}
              </Link>
            }
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {replays.map((r) => (
              <li key={`${r.editionSlug}-${r.sessionSlug}`}>
                <a
                  href={r.replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fd-card block px-4 py-3"
                >
                  <span className="text-[10px] font-bold uppercase text-[#78716c]">
                    {fr ? "Replay" : "Replay"}
                  </span>
                  <p className="text-sm font-bold text-[#0c0a09]">{r.title}</p>
                  {r.endedAt ? (
                    <p className="text-xs text-[#78716c]">
                      {formatUpcomingSessionDate(r.endedAt, fr)}
                    </p>
                  ) : null}
                  <span className="mt-2 inline-flex text-xs font-bold text-[#305f33]">
                    {fr ? "Regarder →" : "Watch →"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
