"use client";

import { useCallback, useEffect, useState } from "react";
import { TurnstileWidget, preloadTurnstileScript } from "@/components/auth/turnstile-widget";

export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

/** Turnstile widget only - no extra labels (prod). */
export function AuthTurnstileField({
  onToken,
  onExpire,
  className,
}: {
  onToken: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}) {
  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <TurnstileWidget
      siteKey={TURNSTILE_SITE_KEY}
      variant="dark"
      onToken={onToken}
      onExpire={onExpire}
      className={className ?? "flex justify-center"}
    />
  );
}

export function useAuthTurnstile() {
  const turnstileRequired = Boolean(TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
  const onTurnstileExpire = useCallback(() => setTurnstileToken(null), []);
  const turnstileReady = !turnstileRequired || Boolean(turnstileToken);

  useEffect(() => {
    if (TURNSTILE_SITE_KEY) preloadTurnstileScript();
  }, []);

  return {
    turnstileRequired,
    turnstileToken,
    turnstileReady,
    onTurnstileToken,
    onTurnstileExpire,
  };
}
