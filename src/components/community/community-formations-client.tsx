"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import {
  CommunityEmptyState,
  EmptyTrainingIllustration,
} from "@/components/community/community-empty-illustrations";

type FormationTab = "upcoming" | "live" | "replays";

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

const TABS = [
  { id: "upcoming" as const, labelFr: "À venir", labelEn: "Upcoming" },
  { id: "live" as const, labelFr: "En direct", labelEn: "Live now" },
  { id: "replays" as const, labelFr: "Replays", labelEn: "Replays" },
];

export function CommunityFormationsClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [tab, setTab] = useState<FormationTab>("upcoming");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/community/formations")
      .then((r) => r.json())
      .then((d: { upcomingSessions?: Session[]; editions?: Edition[] }) => {
        setSessions(d.upcomingSessions ?? []);
        setEditions(d.editions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const liveSessions = sessions.filter((s) => s.isLiveNow);
  const upcomingSessions = sessions.filter((s) => !s.isLiveNow);

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <CommunityModuleHeader title={fr ? "Formations" : "Training"} />

      <CommunityFilterTabs tabs={TABS} active={tab} onChange={setTab} fr={fr} />

      {loading ? (
        <p className="py-12 text-center text-sm text-[#78716c]">…</p>
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
                  href={`/app/academy/${s.editionSlug}/live/${s.sessionSlug}`}
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
            title={fr ? "Aucune formation" : "No training scheduled"}
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
                  href={`/app/academy/${s.editionSlug}`}
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
                  href={`/app/academy/${e.slug}`}
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
                ? "Les replays sont disponibles dans vos cohortes Academy."
                : "Replays are available in your Academy cohorts."
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
