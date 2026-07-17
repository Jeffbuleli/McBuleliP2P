"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { useAcademyLiveBadge } from "@/hooks/use-academy-live-badge";
import { APP_NAV_ITEMS, isAppNavActive } from "@/lib/app-nav-items";
import type { Messages } from "@/i18n/messages";

export function AppBottomNav({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const liveBadge = useAcademyLiveBadge();

  const labelFor = (key: keyof Messages) => {
    if (key === "nav_trade") return "Trade";
    if (key === "nav_community") return "Community";
    if (key === "nav_profile") return "Profile";
    return t(key);
  };

  return (
    <nav
      className={`pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 transition-transform duration-300 ease-out md:px-6 ${
        hidden ? "translate-y-[calc(100%+0.5rem)]" : "translate-y-0"
      }`}
      aria-label="Main"
      aria-hidden={hidden}
    >
      <div className="fd-nav-glow pointer-events-auto flex w-full max-w-md items-stretch justify-around rounded-full px-1 py-1 backdrop-blur-md md:max-w-lg">
        {APP_NAV_ITEMS.map((p) => {
          const href = p.href;
          const Icon = iconFor(href);
          const active = isAppNavActive(pathname, href);
          const label = labelFor(p.key);
          const showLiveBadge = href === "/app/community" && liveBadge.live;

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 transition-transform active:scale-95 ${
                active ? "fd-nav-active" : "fd-nav-idle"
              }`}
            >
              <span className="relative">
                <Icon active={active} />
                {showLiveBadge ? (
                  <span
                    className="absolute -right-1 -top-0.5 flex h-2.5 w-2.5"
                    aria-hidden
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  </span>
                ) : null}
              </span>
              <span
                className={`max-w-[4.75rem] truncate text-[10px] leading-tight ${
                  active ? "font-bold text-[#0c0a09]" : "font-semibold"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function iconFor(href: string) {
  if (href === "/app") return HomeIcon;
  if (href === "/app/wallet") return WalletIcon;
  if (href === "/app/p2p") return P2PIcon;
  if (href === "/app/community") return CommunityIcon;
  return ProfileIcon;
}

function navIconColor(active: boolean): string {
  return active ? "fd-nav-active" : "fd-nav-idle";
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={navIconColor(active)} aria-hidden>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={navIconColor(active)} aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function P2PIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={navIconColor(active)} aria-hidden>
      <path d="M7 16V4L3 8m4-4 4 4M17 8v12l4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={navIconColor(active)} aria-hidden>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M13 19c0-1.8 1.5-3.2 3.5-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={navIconColor(active)} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
