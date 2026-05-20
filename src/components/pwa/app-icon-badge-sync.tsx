"use client";

import { useEffect } from "react";
import { syncAppIconBadge } from "@/lib/app-icon-badge";
import { useUnreadCountsContext } from "@/components/mobile/unread-counts-provider";

/** Updates the installed PWA / home-screen icon badge (like WhatsApp). */
export function AppIconBadgeSync() {
  const { totalUnread } = useUnreadCountsContext();

  useEffect(() => {
    void syncAppIconBadge(totalUnread);
  }, [totalUnread]);

  useEffect(() => {
    const onHide = () => void syncAppIconBadge(totalUnread);
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [totalUnread]);

  return null;
}
