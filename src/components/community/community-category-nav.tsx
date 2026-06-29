"use client";

import Link from "next/link";
import {
  COMMUNITY_CATEGORY_NAV,
  type CommunityCategoryId,
} from "@/lib/community/nav-config";
import { COMMUNITY_CHIP, COMMUNITY_CHIP_ACTIVE, COMMUNITY_CHIP_LIVE } from "@/lib/community/community-ui";
import { useAcademyLiveBadge } from "@/hooks/use-academy-live-badge";

export function CommunityCategoryNav({
  active,
  onChange,
  fr,
}: {
  active: CommunityCategoryId;
  onChange: (id: CommunityCategoryId) => void;
  fr: boolean;
}) {
  const liveBadge = useAcademyLiveBadge();

  return (
    <nav
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none"
      aria-label={fr ? "Catégories communauté" : "Community categories"}
    >
      {COMMUNITY_CATEGORY_NAV.map((item) => {
        const label = fr ? item.labelFr : item.labelEn;
        const isActive = active === item.id;

        if (item.href) {
          const isLiveTraining =
            item.id === "training" && liveBadge.live;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={isLiveTraining ? COMMUNITY_CHIP_LIVE : COMMUNITY_CHIP}
            >
              {isLiveTraining ? (
                <span
                  className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-rose-400 align-middle shadow-[0_0_8px_rgba(251,113,133,0.8)]"
                  aria-hidden
                />
              ) : null}
              {label}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={isActive ? COMMUNITY_CHIP_ACTIVE : COMMUNITY_CHIP}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
