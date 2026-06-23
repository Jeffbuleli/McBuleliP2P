"use client";

import { useEffect, useState } from "react";

export type AcademyLiveBadge = {
  live: boolean;
  title: string | null;
  href: string | null;
};

const EMPTY: AcademyLiveBadge = { live: false, title: null, href: null };

const POLL_MS = 60_000;

let cached: AcademyLiveBadge = EMPTY;
let pollStarted = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function startPolling() {
  if (pollStarted || typeof window === "undefined") return;
  pollStarted = true;

  const load = () => {
    fetch("/api/academy/live-badge", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AcademyLiveBadge | null) => {
        if (!d) return;
        cached = {
          live: !!d.live,
          title: d.title ?? null,
          href: d.href ?? null,
        };
        notify();
      })
      .catch(() => {});
  };

  load();
  window.setInterval(load, POLL_MS);
}

export function useAcademyLiveBadge() {
  const [badge, setBadge] = useState(cached);

  useEffect(() => {
    startPolling();
    const sync = () => setBadge({ ...cached });
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return badge;
}
