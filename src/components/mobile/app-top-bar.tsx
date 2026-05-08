"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { NotificationDrawer } from "@/components/mobile/notification-drawer";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";

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
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-stone-700/60 bg-stone-950/70 shadow-lg shadow-black/30 backdrop-blur-md">
            <Image
              src="/brand/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
          </span>
          <span className="font-bold tracking-tight text-emerald-100">
            {t("brand")}
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-emerald-700/30 bg-emerald-950/40 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200"
            title={t("security_trusted")}
          >
            <ShieldIcon />
            <span className="max-[380px]:hidden">{t("security_badge")}</span>
          </span>

          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-stone-200 transition hover:bg-stone-900/50 active:scale-95"
            aria-label={t("notifications_title")}
            onClick={() => setNotifOpen(true)}
          >
            <BellIcon />
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

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
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

function ShieldIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
    </svg>
  );
}
