"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { NotificationDrawer } from "@/components/mobile/notification-drawer";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import { SupportHeadsetIcon } from "@/components/support/support-chatroom";

export function AppTopBar({
  email,
  avatarUrl,
  scrolled: scrolledProp,
}: {
  email: string;
  avatarUrl: string | null;
  scrolled?: boolean;
}) {
  const { t } = useI18n();
  const [innerScroll, setInnerScroll] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadSupport, setUnreadSupport] = useState(0);

  function refreshUnread() {
    void fetch("/api/notifications", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j: { unreadCount?: number }) => {
        const n = Number(j.unreadCount ?? 0);
        setUnreadNotif(Number.isFinite(n) ? n : 0);
      })
      .catch(() => {});
    void fetch("/api/support/unread", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j: { unreadCount?: number }) => {
        const n = Number(j.unreadCount ?? 0);
        setUnreadSupport(Number.isFinite(n) ? n : 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refreshUnread();
    const id = window.setInterval(refreshUnread, 20000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setInnerScroll(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrolled = scrolledProp ?? innerScroll;

  return (
    <>
      <header
        className={`relative flex min-h-[48px] items-center justify-between gap-2 px-0.5 py-1 transition-[box-shadow] duration-200 ${
          scrolled
            ? "shadow-sm shadow-emerald-900/10 dark:shadow-black/30"
            : ""
        }`}
      >
        <Link
          href="/app"
          className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center gap-2 rounded-xl px-1 active:scale-[0.98]"
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/75 bg-emerald-950/55 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] shadow-lg shadow-black/40 ring-2 ring-emerald-400/20 backdrop-blur-md">
            <Image
              src="/brand/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
              unoptimized
            />
          </span>
          <span className="font-bold tracking-tight text-emerald-100">
            {t("brand")}
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          <Link
            href="/app/support"
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-emerald-700 text-white shadow-md shadow-emerald-900/40 transition hover:bg-emerald-600 active:scale-95"
            aria-label={t("support_open_chat")}
            title={t("support_title")}
          >
            <SupportHeadsetIcon className="h-5 w-5" />
            {unreadSupport > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-stone-950">
                {unreadSupport > 99 ? "99+" : unreadSupport}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-stone-200 transition hover:bg-stone-900/50 active:scale-95"
            aria-label={t("notifications_title")}
            onClick={() => setNotifOpen(true)}
          >
            <BellIcon />
            {unreadNotif > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-stone-950">
                {unreadNotif > 99 ? "99+" : unreadNotif}
              </span>
            ) : null}
          </button>

          <Link
            href="/app/profile"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:scale-95"
            aria-label={t("nav_profile")}
          >
            <UserAvatarMark email={email} avatarUrl={avatarUrl} />
          </Link>
        </div>
      </header>

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onDidClose={() => {
          setUnreadNotif(0);
          refreshUnread();
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

