"use client";

import Link from "next/link";
import {
  COMMUNITY_CATEGORY_NAV,
  type CommunityCategoryId,
} from "@/lib/community/nav-config";

export function CommunityCategoryNav({
  active,
  onChange,
  fr,
}: {
  active: CommunityCategoryId;
  onChange: (id: CommunityCategoryId) => void;
  fr: boolean;
}) {
  return (
    <nav
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none"
      aria-label={fr ? "Catégories communauté" : "Community categories"}
    >
      {COMMUNITY_CATEGORY_NAV.map((item) => {
        const label = fr ? item.labelFr : item.labelEn;
        const isActive = active === item.id;

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className="shrink-0 rounded-full border border-[#e8f3ee] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#57534e] transition active:scale-95"
            >
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
