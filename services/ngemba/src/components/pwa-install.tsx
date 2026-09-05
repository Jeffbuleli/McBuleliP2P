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
const REMINDER_DELAY_MS = 2_000;

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
 * Soft install reminder — McBuleli-style fixed bottom dock.
 * Only if not already installed / dismissed.
 */
export function PwaInstallReminder({
  title,
  reminder,
  installLabel,
  laterLabel,
  iosHint,
}: {
  title: string;
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      role="dialog"
      aria-label={title}
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-ng-primary/30 bg-ng-surface p-4 shadow-lg shadow-black/10">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ng-primary-muted"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={40}
              height={40}
              className="size-10 object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ng-primary">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ng-muted">
              {reminder}
            </p>
            {ios && !deferred ? (
              <p className="mt-1.5 text-[11px] leading-snug text-ng-muted">
                {iosHint}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {deferred ? (
            <button
              type="button"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ng-primary px-4 text-sm font-semibold text-white active:scale-[0.99]"
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
              <IconDownload className="size-4" />
              {installLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={`min-h-11 rounded-xl border border-[var(--ng-border)] bg-ng-bg px-4 text-sm font-semibold text-ng-text active:scale-[0.99] ${
              deferred ? "sm:min-w-[7.5rem]" : "flex-1"
            }`}
            onClick={() => {
              dismiss();
              setVisible(false);
            }}
          >
            {laterLabel}
          </button>
        </div>
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
