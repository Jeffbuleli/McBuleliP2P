"use client";

import { useCallback, useEffect, useState } from "react";

export function useDmUnreadCount(pollMs = 12_000): number {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/community/dm/threads", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        threads?: { unreadCount?: number }[];
      };
      const total = (data.threads ?? []).reduce(
        (sum, t) => sum + Math.max(0, t.unreadCount ?? 0),
        0,
      );
      setCount(total);
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
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, pollMs]);

  return count;
}
