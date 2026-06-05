"use client";

import { useEffect } from "react";

const REFRESH_MS = 30 * 60 * 1000;

/** Keeps the httpOnly session cookie alive while the app is open. */
export function SessionRefresher() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async () => {
      if (cancelled) return;
      try {
        await fetch("/api/auth/session", { credentials: "same-origin" });
      } catch {
        /* offline — retry later */
      }
      if (!cancelled) {
        timer = setTimeout(refresh, REFRESH_MS);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    void refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
