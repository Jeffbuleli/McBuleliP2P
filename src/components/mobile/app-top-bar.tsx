"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { NotificationDrawer } from "@/components/mobile/notification-drawer";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import { SupportAgentIcon } from "@/components/icons/support-agent-icon";
import { useUnreadCountsContext } from "@/components/mobile/unread-counts-provider";
import { McBuleliLogoMark } from "@/components/brand/mcbuleli-logo-mark";
import { supportInboxHref } from "@/lib/support-nav";

function TopBarCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#050810]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function TopBarActionButton({
  children,
  badge,
  className,
  ...props
}: {
  children: React.ReactNode;
  badge: number;
  className: string;
} & (
  | React.ComponentPropsWithoutRef<"button">
  | React.ComponentPropsWithoutRef<typeof Link>
)) {
  const inner = (
    <>
      {children}
      <TopBarCountBadge count={badge} />
    </>
  );
  const cls = `relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition active:scale-95 ${className}`;

  if ("href" in props) {
    return (
      <Link {...props} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" {...props} className={cls}>
      {inner}
    </button>
  );
}

export function AppTopBar({
  email,
  avatarUrl,
  scrolled: scrolledProp,
  isSupportStaff = false,
}: {
  email: string;
  avatarUrl: string | null;
  scrolled?: boolean;
  isSupportStaff?: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const onWalletHome = pathname === "/app/wallet";
  const [innerScroll, setInnerScroll] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadNotif, unreadSupport, refresh } = useUnreadCountsContext();

  useEffect(() => {
    const onScroll = () => setInnerScroll(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrolled = scrolledProp ?? innerScroll;
  const supportHref = supportInboxHref({ isStaff: isSupportStaff });

  return (
    <>
      <header
        className={`relative flex min-h-[48px] items-center justify-between gap-2 px-0.5 py-1 transition-[box-shadow] duration-200 ${
          scrolled ? "shadow-sm shadow-[color:var(--fd-primary)]/10" : ""
        }`}
      >
        <Link
          href="/app"
          className="flex min-h-[44px] min-w-0 flex-shrink-0 items-center gap-2 rounded-xl px-1 active:scale-[0.98]"
          aria-label={t("brand")}
        >
          <McBuleliLogoMark size={onWalletHome ? 42 : 38} />
          <span className="truncate font-bold tracking-tight text-[color:var(--fd-text)]">
            {t("brand")}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <TopBarActionButton
            href={supportHref}
            badge={unreadSupport}
            className="border border-cyan-400/35 bg-cyan-500/15 text-cyan-200 shadow-md shadow-cyan-500/10 hover:bg-cyan-500/25"
            aria-label={t("support_open_chat")}
            title={t("support_title")}
          >
            <SupportAgentIcon className="h-5 w-5" />
          </TopBarActionButton>

          <TopBarActionButton
            badge={unreadNotif}
            className="border border-fuchsia-400/25 bg-[color:var(--fd-card)] text-fuchsia-300 shadow-sm hover:bg-fuchsia-500/10"
            aria-label={t("notifications_title")}
            onClick={() => setNotifOpen(true)}
          >
            <BellIcon />
          </TopBarActionButton>

          <Link
            href="/app/profile"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full active:scale-95"
            aria-label={t("nav_profile")}
          >
            <UserAvatarMark email={email} avatarUrl={avatarUrl} />
          </Link>
        </div>
      </header>

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        isSupportStaff={isSupportStaff}
        onDidClose={() => {
          refresh();
        }}
      />
    </>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a5 5 0 00-5 5v2.59l-1.3 1.3A1 1 0 006 13h12a1 1 0 00.7-1.71L18 10.59V8a5 5 0 00-5-5zM12 21a2 2 0 01-2-2h4a2 2 0 01-2 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
