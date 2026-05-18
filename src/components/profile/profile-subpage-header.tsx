"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

export function ProfileSubpageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { t } = useI18n();

  return (
    <header className="mb-5 flex items-start gap-3">
      <Link
        href="/app/profile"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--fd-primary)] text-white shadow-sm active:scale-95"
        aria-label={t("profile_back")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <div className="min-w-0 pt-0.5">
        <h1 className="text-lg font-bold text-[var(--fd-text)]">{title}</h1>
        {subtitle ? (
          <p className="text-xs text-[var(--fd-muted)]">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
