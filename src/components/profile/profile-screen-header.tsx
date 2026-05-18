"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { NotificationDrawer } from "@/components/mobile/notification-drawer";

export function ProfileScreenHeader({ title }: { title: string }) {
  const { t } = useI18n();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);

  function refreshUnread() {
    void fetch("/api/notifications", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j: { unreadCount?: number }) => {
        const n = Number(j.unreadCount ?? 0);
        setUnreadNotif(Number.isFinite(n) ? n : 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refreshUnread();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-2 border-b border-[rgba(74,103,79,0.12)] bg-[var(--fd-bg)] px-4 pb-3 pt-0 backdrop-blur-md">
        <div className="flex min-h-[44px] items-center justify-between gap-3">
          <h1 className="text-lg font-bold tracking-tight text-[var(--fd-text)]">
            {title}
          </h1>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--fd-border)] bg-white text-[var(--fd-primary)] shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-95"
            aria-label={t("notifications_title")}
            onClick={() => setNotifOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3a5 5 0 00-5 5v2.59l-1.3 1.3A1 1 0 006 13h12a1 1 0 00.7-1.71L18 10.59V8a5 5 0 00-5-5zM12 21a2 2 0 01-2-2h4a2 2 0 01-2 2z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {unreadNotif > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                {unreadNotif > 99 ? "99+" : unreadNotif}
              </span>
            ) : null}
          </button>
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
