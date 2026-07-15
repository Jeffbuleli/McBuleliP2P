"use client";

import { useEffect, useMemo, useState } from "react";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";

export { loginHrefFor, registerHrefFor };

/** Resolves to `appPath` when session is valid, otherwise login with `next`. */
export function useSessionAppHref(appPath: string): string {
  const fallback = useMemo(() => loginHrefFor(appPath), [appPath]);
  const [href, setHref] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    setHref(fallback);
    void fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
        if (!cancelled) setHref(data.ok ? appPath : fallback);
      })
      .catch(() => {
        if (!cancelled) setHref(fallback);
      });
    return () => {
      cancelled = true;
    };
  }, [appPath, fallback]);

  return href;
}

/** Entry CTA: app home when signed in, register otherwise. */
export function useSessionEntryHref(appPath = "/app/wallet"): string {
  const registerFallback = registerHrefFor(appPath);
  const [href, setHref] = useState(registerFallback);

  useEffect(() => {
    let cancelled = false;
    setHref(registerFallback);
    void fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
        if (!cancelled) setHref(data.ok ? appPath : registerFallback);
      })
      .catch(() => {
        if (!cancelled) setHref(registerFallback);
      });
    return () => {
      cancelled = true;
    };
  }, [appPath, registerFallback]);

  return href;
}
