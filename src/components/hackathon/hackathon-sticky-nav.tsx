"use client";

import { useEffect, useState } from "react";
import type { EventNavItem } from "@/lib/hackathon/event-content";

export function HackathonStickyNav({
  items,
  isFr,
}: {
  items: EventNavItem[];
  isFr: boolean;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const ids = items.map((i) => i.id);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={isFr ? "Navigation hackathon" : "Hackathon navigation"}
      className="sticky top-0 z-30 border-b border-[color:var(--fd-border)] bg-white/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const label = isFr ? item.labelFr : item.labelEn;
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                isActive
                  ? "bg-[color:var(--fd-primary)] text-white"
                  : "text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-primary)]"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
