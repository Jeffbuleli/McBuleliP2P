"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function CommunityModuleHeader({
  title,
  backHref = "/app/community",
  trailing,
}: {
  title: string;
  backHref?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="mb-3 flex items-center gap-2">
      <Link
        href={backHref}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e7e5e4] text-[#305f33] active:scale-95"
        aria-label="Back"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-[#0c0a09]">{title}</h1>
      {trailing}
    </header>
  );
}
