"use client";

import { COMMUNITY_CHIP, COMMUNITY_CHIP_ACTIVE } from "@/lib/community/community-ui";

export type FilterTab<T extends string> = { id: T; labelFr: string; labelEn: string };

export function CommunityFilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  fr,
}: {
  tabs: FilterTab<T>[];
  active: T;
  onChange: (id: T) => void;
  fr: boolean;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={active === tab.id ? COMMUNITY_CHIP_ACTIVE : COMMUNITY_CHIP}
        >
          {fr ? tab.labelFr : tab.labelEn}
        </button>
      ))}
    </div>
  );
}
