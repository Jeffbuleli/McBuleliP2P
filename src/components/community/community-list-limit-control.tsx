"use client";

import { COMMUNITY_CHIP, COMMUNITY_CHIP_ACTIVE } from "@/lib/community/community-ui";

export const LIST_LIMITS = [10, 20, 30] as const;
export type ListLimit = (typeof LIST_LIMITS)[number];

export function parseListLimit(value: string | null | undefined): ListLimit {
  const n = Number(value);
  if (n === 10 || n === 20 || n === 30) return n;
  return 20;
}

export function CommunityListLimitControl({
  value,
  onChange,
  fr,
}: {
  value: ListLimit;
  onChange: (limit: ListLimit) => void;
  fr: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
        {fr ? "Afficher" : "Show"}
      </span>
      <div className="flex gap-1">
        {LIST_LIMITS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={value === n ? COMMUNITY_CHIP_ACTIVE : COMMUNITY_CHIP}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
