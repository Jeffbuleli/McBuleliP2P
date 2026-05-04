"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

const paths: (
  | { href: string; key: keyof Messages; icon: typeof HomeIcon }
  | { href: string; literalLabel: string; icon: typeof HomeIcon }
)[] = [
  { href: "/app", key: "nav_home", icon: HomeIcon },
  { href: "/app/wallet", key: "nav_wallet", icon: WalletIcon },
  { href: "/app/p2p", key: "nav_p2p", icon: P2PIcon },
  { href: "/app/trade", literalLabel: "Trade", icon: MarketIcon },
  { href: "/app/profile", key: "nav_profile", icon: ProfileIcon },
];

export function AppBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-white/10 dark:bg-stone-950/95"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {paths.map((p) => {
          const href = p.href;
          const Icon = p.icon;
          const active =
            href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(href);
          const label = "literalLabel" in p ? p.literalLabel : t(p.key);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 transition-transform active:scale-95 ${
                active
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              <Icon active={active} />
              <span className="max-w-[4.5rem] truncate text-[10px] font-semibold leading-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-emerald-600" : "text-current"}
      aria-hidden
    >
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-emerald-600" : "text-current"}
      aria-hidden
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 12h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function P2PIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-emerald-600" : "text-current"}
      aria-hidden
    >
      <path
        d="M8 7h13M8 12h13M8 17h13M3 7h.01M3 12h.01M3 17h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MarketIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-emerald-600" : "text-current"}
      aria-hidden
    >
      <path
        d="M4 18V6M10 18V10M16 18v-8M22 18V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-emerald-600" : "text-current"}
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
