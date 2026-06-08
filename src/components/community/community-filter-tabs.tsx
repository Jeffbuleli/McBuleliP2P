"use client";

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
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            active === tab.id
              ? "bg-[#305f33] text-white"
              : "bg-[#f5f5f4] text-[#57534e]"
          }`}
        >
          {fr ? tab.labelFr : tab.labelEn}
        </button>
      ))}
    </div>
  );
}
