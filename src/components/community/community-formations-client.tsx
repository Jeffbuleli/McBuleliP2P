"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityFormationCard } from "@/components/community/community-formation-card";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import {
  CommunityEmptyState,
  EmptyTrainingIllustration,
} from "@/components/community/community-empty-illustrations";
import {
  academyCohortHref,
  academySessionContinueHref,
} from "@/lib/academy-route-paths";
import type { FormationPostMeta } from "@/lib/community/formation-post-meta";

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
  enrolled: boolean;
  programSlug: string;
};

type FormationPost = {
  id: string;
  formationMeta: FormationPostMeta | null;
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
  const [editions, setEditions] = useState<Edition[]>([]);
  const [formationPosts, setFormationPosts] = useState<FormationPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/community/formations")
      .then((r) => r.json())
      .then(
        (d: {
          upcomingSessions?: Session[];
          editions?: Edition[];
          formationPosts?: FormationPost[];
        }) => {
          setSessions(d.upcomingSessions ?? []);
          setEditions(d.editions ?? []);
          const posts = (d.formationPosts ?? []).filter((p) => p.formationMeta);
          setFormationPosts(posts);
          if (posts.length === 0) setTab("upcoming");
        },
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const liveSessions = sessions.filter((s) => s.isLiveNow);
  const upcomingSessions = sessions.filter((s) => !s.isLiveNow);

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <CommunityModuleHeader title={fr ? "Academy" : "Academy"} />
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#e8f3ee] px-3 py-2">
        <img src="/academy/event-live.svg" alt="" className="h-9 w-9" />
        <p className="text-xs text-[#305f33]">
          {fr
            ? "Formations et programmes publiés depuis Academy"
            : "Training programs published from Academy"}
        </p>
      </div>

      <CommunityFilterTabs tabs={TABS} active={tab} onChange={setTab} fr={fr} />

      {loading ? (
        <p className="py-12 text-center text-sm text-[#78716c]">…</p>
      ) : tab === "programs" ? (
        formationPosts.length === 0 ? (
          <CommunityEmptyState
            illustration={<EmptyTrainingIllustration />}
            title={fr ? "Aucun programme publié" : "No published programs"}
            body={
              fr
                ? "Les événements Academy publiés apparaîtront ici en cartes Formation."
                : "Published Academy events will appear here as training cards."
            }
            action={
              <Link
                href="/app/academy"
                className="inline-block rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
              >
                Academy →
              </Link>
            }
          />
        ) : (
          <ul className="mt-3 space-y-4">
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
            body={
              fr
                ? "Revenez plus tard ou consultez les sessions à venir."
                : "Check back later or see upcoming sessions."
            }
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {liveSessions.map((s) => (
              <li key={`${s.editionSlug}-${s.sessionSlug}`}>
                <Link
                  href={academySessionContinueHref(s)}
                  className="fd-card block border-l-4 border-[#305f33] px-4 py-3"
                >
                  <span className="text-[10px] font-bold uppercase text-[#305f33]">
                    LIVE
                  </span>
                  <p className="text-sm font-bold text-[#0c0a09]">{s.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : tab === "upcoming" ? (
        upcomingSessions.length === 0 && editions.length === 0 ? (
          <CommunityEmptyState
            illustration={<EmptyTrainingIllustration />}
            title={fr ? "Aucune session à venir" : "No upcoming sessions"}
            body={
              fr
                ? "Parcourez l'Academy McBuleli pour vous inscrire."
                : "Browse McBuleli Academy to enroll."
            }
            action={
              <Link
                href="/app/academy"
                className="inline-block rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
              >
                Academy →
              </Link>
            }
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {upcomingSessions.map((s) => (
              <li key={`${s.editionSlug}-${s.sessionSlug}`}>
                <Link
                  href={academySessionContinueHref(s)}
                  className="fd-card block px-4 py-3"
                >
                  <p className="text-sm font-bold text-[#0c0a09]">{s.title}</p>
                  <p className="text-xs text-[#78716c]">
                    {new Date(s.startsAt).toLocaleString(fr ? "fr-FR" : "en-US")}
                  </p>
                </Link>
              </li>
            ))}
            {editions.map((e) => (
              <li key={e.slug}>
                <Link
                  href={academyCohortHref(e.slug, e.programSlug)}
                  className="fd-card block px-4 py-3"
                >
                  <p className="text-sm font-bold text-[#0c0a09]">{e.title}</p>
                  <p className="text-xs text-[#78716c]">
                    {e.enrolled
                      ? fr
                        ? "Inscrit"
                        : "Enrolled"
                      : fr
                        ? "S'inscrire"
                        : "Enroll"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="mt-3">
          <CommunityEmptyState
            illustration={<EmptyTrainingIllustration />}
            title={fr ? "Replays Academy" : "Academy replays"}
            body={
              fr
                ? "Les replays sont disponibles dans vos classes Academy."
                : "Replays are available in your Academy classes."
            }
            action={
              <Link
                href="/app/academy"
                className="inline-block rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
              >
                {fr ? "Ouvrir Academy" : "Open Academy"}
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
