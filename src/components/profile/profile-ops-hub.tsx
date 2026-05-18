"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { profileChipClass } from "@/components/profile/profile-vibrant-styles";
import type { OpsHubIcon, OpsHubItem } from "@/lib/profile-ops-items";

function OpsIcon({ icon }: { icon: OpsHubIcon }) {
  const cls = "h-6 w-6";
  switch (icon) {
    case "dashboard":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="13" y="13" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "withdraw":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3v14M8 13l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "p2p":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 16V4L3 8m4-4 4 4M17 8v12l4-4m-4 4-4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M3 20c0-3.3 2.7-6 6-6M16 11v6M13 14h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "finance":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 18V6M10 18V10M16 18v-8M22 18V4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bots":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="8" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="9" cy="13" r="1" fill="currentColor" />
          <circle cx="15" cy="13" r="1" fill="currentColor" />
          <path d="M9 5V8M15 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function ChevronRight() {
  return (
    <svg className="h-5 w-5 shrink-0 text-[var(--fd-muted)]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileOpsHub({
  items,
  totalPending,
}: {
  items: OpsHubItem[];
  totalPending: number;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <section className="fd-card overflow-hidden p-0">
        <div className="bg-gradient-to-br from-[#e6f0e7] via-[#f6faf7] to-white px-4 py-4">
          <div className="flex items-center gap-3">
            <span className={`${profileChipClass.forest} flex h-12 w-12 shrink-0 items-center justify-center`}>
              <OpsIcon icon="dashboard" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
                {t("profile_ops_summary_title")}
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-[#0c0a09]">
                {totalPending}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--fd-muted)]">
                {t("profile_ops_summary_sub")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <p className="px-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
        {t("profile_ops_shortcuts")}
      </p>

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="fd-card flex items-center gap-3.5 p-4 active:scale-[0.99]">
              <span
                className={`${profileChipClass[item.tone]} flex h-11 w-11 shrink-0 items-center justify-center`}
              >
                <OpsIcon icon={item.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="fd-label-vivid text-sm leading-tight">{t(item.labelKey)}</p>
                <p className="mt-1 text-[11px] leading-snug text-[var(--fd-muted)]">
                  {t(item.descKey)}
                </p>
              </div>
              {item.badge != null && item.badge > 0 ? (
                <span
                  className={`shrink-0 px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                    item.badgeKind === "growth" ? "fd-pill-ok" : "fd-pill-warn"
                  }`}
                >
                  {item.badgeKind === "growth"
                    ? `+${item.badge}`
                    : String(item.badge)}
                </span>
              ) : (
                <span className="fd-pill-muted shrink-0 px-2 py-0.5 text-[10px] font-semibold">
                  {t("profile_ops_badge_ok")}
                </span>
              )}
              <ChevronRight />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
