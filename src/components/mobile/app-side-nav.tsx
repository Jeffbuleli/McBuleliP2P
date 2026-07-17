"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { useAcademyLiveBadge } from "@/hooks/use-academy-live-badge";
import { APP_NAV_ITEMS, isAppNavActive } from "@/lib/app-nav-items";
import type { Messages } from "@/i18n/messages";

/** Desktop left rail - visible from lg breakpoint via parent `hidden lg:flex`. */
export function AppSideNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const liveBadge = useAcademyLiveBadge();

  const labelFor = (key: keyof Messages) => {
    if (key === "nav_community") return "Community";
    if (key === "nav_profile") return "Profile";
    return t(key);
  };

  return (
    <aside
      className="sticky top-0 flex h-dvh w-[13.5rem] shrink-0 flex-col border-r border-[color:var(--fd-border)] bg-[color:var(--fd-surface)]/90 px-3 py-4 backdrop-blur-md pt-[max(1rem,env(safe-area-inset-top))]"
      aria-label="Main"
    >
      <p className="mb-4 px-2 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("brand")}
      </p>
      <nav className="flex flex-1 flex-col gap-1">
        {APP_NAV_ITEMS.map((p) => {
          const active = isAppNavActive(pathname, p.href);
          const showLive =
            p.href === "/app/community" && liveBadge.live;
          return (
            <Link
              key={p.href}
              href={p.href}
              className={`relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                active
                  ? "bg-[color:var(--fd-mint)] font-bold text-[color:var(--fd-ink)]"
                  : "font-semibold text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]/50 hover:text-[color:var(--fd-ink)]"
              }`}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <NavGlyph href={p.href} active={active} />
                {showLive ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                ) : null}
              </span>
              {labelFor(p.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function NavGlyph({ href, active }: { href: string; active: boolean }) {
  const c = active ? "text-[color:var(--fd-ink)]" : "text-current";
  if (href === "/app") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={c} aria-hidden>
        <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (href === "/app/wallet") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={c} aria-hidden>
        <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (href === "/app/p2p") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={c} aria-hidden>
        <path d="M7 16V4L3 8m4-4 4 4M17 8v12l4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (href === "/app/community") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={c} aria-hidden>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M13 19c0-1.8 1.5-3.2 3.5-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={c} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
