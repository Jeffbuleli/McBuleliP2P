"use client";

import { useEffect, useState } from "react";
import { IconDownload } from "@/components/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ngemba_pwa_install_dismiss_until";
/** Soft dismiss — remind again after 3 days. */
const DISMISS_MS = 3 * 24 * 60 * 60 * 1000;
/** Let the browser show its own install UI first. */
const REMINDER_DELAY_MS = 8_000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isDismissed(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

function dismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
  } catch {
    /* ignore */
  }
}

/**
 * Soft install reminder — only if not already installed / dismissed.
 * Relies on the browser install prompt when available; no permanent footer CTA.
 */
export function PwaInstallReminder({
  reminder,
  installLabel,
  laterLabel,
  iosHint,
}: {
  reminder: string;
  installLabel: string;
  laterLabel: string;
  iosHint: string;
}) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || isDismissed()) return;

    const ua = navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua));

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setVisible(false);
      setDeferred(null);
      dismiss();
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => {
      if (isStandalone() || isDismissed()) return;
      setReady(true);
      setVisible(true);
    }, REMINDER_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!ready || !visible) return null;

  return (
    <div
      role="status"
      className="mx-auto w-full max-w-md rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-2.5 shadow-sm"
    >
      <p className="text-[12px] leading-snug text-ng-text">{reminder}</p>
      {ios && !deferred ? (
        <p className="mt-1 text-[11px] leading-snug text-ng-muted">{iosHint}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          className="text-[11px] font-medium text-ng-muted hover:text-ng-text"
          onClick={() => {
            dismiss();
            setVisible(false);
          }}
        >
          {laterLabel}
        </button>
        {deferred ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-ng-primary px-2.5 py-1.5 text-[11px] font-bold text-white"
            onClick={() => {
              void (async () => {
                await deferred.prompt();
                await deferred.userChoice;
                setDeferred(null);
                dismiss();
                setVisible(false);
              })();
            }}
          >
            <IconDownload className="size-3.5" />
            {installLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Full-page install helper (used on /telecharger only). */
export function PwaInstallButton({
  label,
  iosHint,
  manualHint,
}: {
  label: string;
  iosHint: string;
  manualHint?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) setShowIos(true);

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShowIos(false);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="mt-6 text-center text-sm font-semibold text-ng-primary">
        Application déjà installée
      </p>
    );
  }

  if (deferred) {
    return (
      <button
        type="button"
        onClick={() => {
          void (async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
          })();
        }}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ng-primary px-4 text-sm font-bold text-white"
      >
        <IconDownload className="size-5" />
        {label}
      </button>
    );
  }

  if (showIos) {
    return (
      <p className="mt-6 text-sm leading-relaxed text-ng-muted">{iosHint}</p>
    );
  }

  if (manualHint) {
    return (
      <p className="mt-6 text-sm leading-relaxed text-ng-muted">{manualHint}</p>
    );
  }

  return null;
}
