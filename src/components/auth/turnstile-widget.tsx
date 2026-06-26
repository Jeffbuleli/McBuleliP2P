"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    window.onTurnstileLoad = () => resolve();
    const existing = document.querySelector(`script[src^="${TURNSTILE_SRC}"]`);
    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Start loading Turnstile early (e.g. on login mount) — do not await in render. */
export function preloadTurnstileScript(): void {
  void loadTurnstileScript();
}

export function TurnstileWidget({
  siteKey,
  onToken,
  onExpire,
  className,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  onTokenRef.current = onToken;
  onExpireRef.current = onExpire;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "auto",
          appearance: "always",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => setFailed(true),
        });
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (failed) {
    return (
      <p className="text-xs text-amber-700">
        Captcha could not load. Refresh the page or try again later.
      </p>
    );
  }

  return (
    <div className={className}>
      {loading ? (
        <p className="text-center text-xs text-stone-500" aria-live="polite">
          Loading security check…
        </p>
      ) : null}
      <div ref={containerRef} className={loading ? "min-h-[65px]" : undefined} />
    </div>
  );
}
