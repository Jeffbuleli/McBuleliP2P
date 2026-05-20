"use client";

import { useCallback, useEffect, useState } from "react";

export function useUnreadCounts(pollMs = 20_000) {
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadSupport, setUnreadSupport] = useState(0);

  const refresh = useCallback(() => {
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
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, pollMs);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pollMs, refresh]);

  const totalUnread = unreadNotif + unreadSupport;

  return { unreadNotif, unreadSupport, totalUnread, refresh };
}
