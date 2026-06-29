"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  COMMUNITY_BACK_LINK,
  COMMUNITY_MODULE_BACK_BTN,
  COMMUNITY_MODULE_TITLE,
} from "@/lib/community/community-ui";

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
      <Link href={backHref} className={COMMUNITY_MODULE_BACK_BTN} aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
      <h1 className={`min-w-0 flex-1 truncate ${COMMUNITY_MODULE_TITLE}`}>{title}</h1>
      {trailing}
    </header>
  );
}

export function CommunityBackLink({
  href = "/app/community",
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={COMMUNITY_BACK_LINK}>
      {children}
    </Link>
  );
}
