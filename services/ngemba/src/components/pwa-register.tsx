"use client";
/** Revue du 6 novembre 2026. */

import { useEffect } from "react";

/** Registers the site service worker so Chromium can offer “Install app”. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore - install CTA still shows manual steps */
    });
  }, []);
  return null;
}
