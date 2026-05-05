"use client";

import { useEffect } from "react";

/** Registers root SW in production so Chromium can treat the site as installable (with manifest). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Non-fatal: install banner still works on Safari (no SW required for “Add to Home Screen”).
    });
  }, []);

  return null;
}
