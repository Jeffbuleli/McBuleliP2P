"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { IconBell } from "@/components/icons/flow-icons";
import { NotificationDrawer } from "@/components/mobile/notification-drawer";
import { useUnreadCountsContext } from "@/components/mobile/unread-counts-provider";

export function AvecTopBar({
  groupName,
  groupLogoUrl,
}: {
  groupName: string;
  groupLogoUrl: string | null;
}) {
  const { t } = useI18n();
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadNotif } = useUnreadCountsContext();

  return (
    <>
      <header className="fd-app-topbar sticky top-0 z-20 mb-4 flex items-center justify-between gap-2 px-3 py-2">
        <Link
          href="/app"
          className="flex min-w-0 max-w-[38%] items-center gap-2 active:scale-[0.98]"
          aria-label={t("brand")}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]">
            <Image
              src="/brand/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              unoptimized
            />
          </span>
          <span className="truncate text-xs font-extrabold text-[color:var(--fd-text)]">
            {t("brand")}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-primary)] shadow-sm active:scale-95"
          aria-label={t("notifications_title")}
        >
          <IconBell className="h-5 w-5" />
          {unreadNotif > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {unreadNotif > 99 ? "99+" : unreadNotif}
            </span>
          ) : null}
        </button>

        <div className="flex min-w-0 max-w-[38%] flex-col items-end gap-0.5">
          {groupLogoUrl ? (
            <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-card)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={groupLogoUrl} alt="" className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[10px] font-black text-[color:var(--fd-primary)]">
              {groupName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="w-full truncate text-right text-[10px] font-bold text-[color:var(--fd-text)]">
            {groupName}
          </span>
        </div>
      </header>
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
