"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { profileChipClass } from "@/components/profile/profile-vibrant-styles";
import type { Messages } from "@/i18n/messages";

type OpsLink = {
  href: string;
  labelKey: keyof Messages;
  tone: keyof typeof profileChipClass;
  icon: "dashboard" | "withdraw" | "p2p" | "users" | "finance" | "bots";
};

const LINKS: OpsLink[] = [
  { href: "/admin", labelKey: "profile_ops_dashboard", tone: "forest", icon: "dashboard" },
  {
    href: "/admin/withdrawals",
    labelKey: "profile_ops_withdrawals",
    tone: "amber",
    icon: "withdraw",
  },
  { href: "/admin/p2p", labelKey: "profile_ops_p2p", tone: "copper", icon: "p2p" },
  { href: "/admin/users", labelKey: "profile_ops_users", tone: "sky", icon: "users" },
  { href: "/admin/finance", labelKey: "profile_ops_finance", tone: "mint", icon: "finance" },
  { href: "/admin/bots", labelKey: "profile_ops_bots", tone: "violet", icon: "bots" },
];

function OpsIcon({ icon }: { icon: OpsLink["icon"] }) {
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
          <path d="M3 20c0-3.3 2.7-6 6-6M16 11v6M13 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "finance":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 18V6M10 18V10M16 18v-8M22 18V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

export function ProfileOpsHub() {
  const { t } = useI18n();

  return (
    <section className="fd-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
        {t("profile_ops_shortcuts")}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="fd-tile flex items-center gap-2.5 px-3 py-3 text-left"
          >
            <span
              className={`${profileChipClass[link.tone]} flex h-10 w-10 shrink-0 items-center justify-center`}
            >
              <OpsIcon icon={link.icon} />
            </span>
            <span className="fd-label-vivid text-xs leading-tight">{t(link.labelKey)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
