"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

type Tile = {
  href: string;
  labelKey: keyof Messages;
  tone: "mint" | "sky" | "amber" | "violet" | "rose" | "stone";
  icon: "wallet" | "payments" | "invite" | "settings" | "pi" | "admin";
};

const TILES: Tile[] = [
  { href: "/app/wallet", labelKey: "profile_tile_wallet", tone: "mint", icon: "wallet" },
  {
    href: "/app/profile/payments",
    labelKey: "profile_tile_payments",
    tone: "sky",
    icon: "payments",
  },
  {
    href: "/app/profile/referrals",
    labelKey: "profile_tile_invite",
    tone: "amber",
    icon: "invite",
  },
  {
    href: "/app/profile/settings",
    labelKey: "profile_tile_settings",
    tone: "stone",
    icon: "settings",
  },
  { href: "/app/profile/pi", labelKey: "profile_tile_pi", tone: "violet", icon: "pi" },
];

const toneBg: Record<Tile["tone"], string> = {
  mint: "bg-[#e8f3ee] text-[#4a674f]",
  sky: "bg-[#e0f2fe] text-[#0369a1]",
  amber: "bg-[#fef3c7] text-[#b45309]",
  violet: "bg-[#ede9fe] text-[#6d28d9]",
  rose: "bg-[#ffe4e6] text-[#be123c]",
  stone: "bg-[#f5f5f4] text-[#57534e]",
};

function TileIcon({ icon }: { icon: Tile["icon"] }) {
  const cls = "h-6 w-6";
  switch (icon) {
    case "wallet":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M16 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "payments":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "invite":
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
    case "settings":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pi":
      return (
        <span className="text-lg font-bold leading-none" aria-hidden>
          π
        </span>
      );
    case "admin":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l2.5 7.5H22l-6 4.5 2.5 7.5L12 18l-6.5 4.5 2.5-7.5-6-4.5h7.5L12 3z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function ProfileActionGrid({ showAdmin }: { showAdmin: boolean }) {
  const { t } = useI18n();
  const tiles = showAdmin
    ? [
        ...TILES,
        {
          href: "/admin",
          labelKey: "profile_tile_admin" as keyof Messages,
          tone: "rose" as const,
          icon: "admin" as const,
        },
      ]
    : TILES;

  return (
    <section className="fd-card p-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--fd-muted)]">
        {t("profile_quick_actions")}
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="fd-tile flex flex-col items-center gap-2 px-2 py-3.5 text-center"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneBg[tile.tone]}`}
            >
              <TileIcon icon={tile.icon} />
            </span>
            <span className="text-[11px] font-semibold leading-tight text-[var(--fd-text)]">
              {t(tile.labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
