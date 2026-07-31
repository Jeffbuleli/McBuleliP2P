"use client";

import { useCallback, useEffect, useState } from "react";

/** Poll partner-chat unread for affiliated members / staff. Returns 0 if not allowed. */
export function usePartnerChatUnreadCount(pollMs = 15_000): number {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hackathon/chat/unread", {
        cache: "no-store",
      });
      if (!res.ok) {
        setCount(0);
        return;
      }
      const data = (await res.json()) as { unreadCount?: number };
      setCount(Math.max(0, Number(data.unreadCount ?? 0)));
    } catch {
      // keep last count
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), pollMs);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [load, pollMs]);

  return count;
}
