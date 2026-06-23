"use client";

import Link from "next/link";
import {
  COMMUNITY_CATEGORY_NAV,
  type CommunityCategoryId,
} from "@/lib/community/nav-config";
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
              className={`relative shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
                isLiveTraining
                  ? "border border-rose-200 bg-rose-50 text-rose-700"
                  : "border border-[#e8f3ee] bg-white text-[#57534e]"
              }`}
            >
              {isLiveTraining ? (
                <span
                  className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 align-middle"
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
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
              isActive
                ? "bg-[#305f33] text-white"
                : "border border-[#e8f3ee] bg-white text-[#57534e]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
