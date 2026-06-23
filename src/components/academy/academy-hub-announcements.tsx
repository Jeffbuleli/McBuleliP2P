"use client";

import Link from "next/link";
import { CommunityFormationCard } from "@/components/community/community-formation-card";
import type { FormationPostMeta } from "@/lib/community/formation-post-meta";

type Announcement = {
  id: string;
  formationMeta: FormationPostMeta;
};

export function AcademyHubAnnouncements({
  items,
  fr,
  viewAllHref,
  viewAllLabel,
  title,
}: {
  items: Announcement[];
  fr: boolean;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-[10px] font-bold text-[#305f33] underline"
        >
          {viewAllLabel}
        </Link>
      </div>
      <ul className="space-y-3">
        {items.slice(0, 2).map((item) => (
          <li key={item.id}>
            <CommunityFormationCard
              meta={item.formationMeta}
              fr={fr}
              isLive={item.formationMeta.eventStatus === "LIVE"}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
