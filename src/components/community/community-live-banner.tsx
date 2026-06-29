"use client";

import Link from "next/link";
import { useAcademyLiveBadge } from "@/hooks/use-academy-live-badge";

export function CommunityLiveBanner({ fr }: { fr: boolean }) {
  const { live, title, href } = useAcademyLiveBadge();

  if (!live || !href) return null;

  return (
    <Link
      href={href}
      className="mb-3 flex items-center gap-3 rounded-2xl border border-rose-500/35 bg-gradient-to-r from-rose-500/12 to-fuchsia-500/8 px-3.5 py-3 shadow-[0_0_24px_rgba(244,63,94,0.08)] transition active:scale-[0.99]"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/30 bg-[#0a1018]/80">
        <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-rose-500 opacity-60" aria-hidden />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-rose-400">
          {fr ? "En direct" : "Live now"}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-[color:var(--fd-text)]">
          {title ?? (fr ? "Session Academy" : "Academy session")}
        </span>
        <span className="mt-0.5 block text-xs font-semibold text-emerald-300/90">
          {fr ? "Rejoindre la salle →" : "Join classroom →"}
        </span>
      </span>
    </Link>
  );
}
