"use client";

import { useEffect, useState } from "react";
import { IconDownload } from "@/components/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Variant = "link" | "primary";

export function PwaInstallButton({
  label,
  iosHint,
  manualHint,
  variant = "link",
}: {
  label: string;
  iosHint: string;
  /** Shown when the browser has no native install prompt (desktop Safari, etc.). */
  manualHint?: string;
  variant?: Variant;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    if (isIos) setShowIos(true);

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
    if (variant === "primary") {
      return (
        <p className="mt-6 text-center text-sm font-semibold text-ng-primary">
          Application déjà installée
        </p>
      );
    }
    return null;
  }

  const primaryClass =
    "mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ng-primary px-4 text-sm font-bold text-white";
  const linkClass =
    "inline-flex items-center gap-1.5 text-[11px] font-semibold text-ng-primary hover:underline";

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
        className={variant === "primary" ? primaryClass : linkClass}
      >
        <IconDownload className={variant === "primary" ? "size-5" : "size-3.5"} />
        {label}
      </button>
    );
  }

  if (showIos) {
    return (
      <p
        className={
          variant === "primary"
            ? "mt-6 text-sm leading-relaxed text-ng-muted"
            : "max-w-[16rem] text-center text-[10px] leading-snug text-ng-muted"
        }
      >
        {iosHint}
      </p>
    );
  }

  if (variant === "primary" && manualHint) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm leading-relaxed text-ng-muted">{manualHint}</p>
        <p className={primaryClass + " pointer-events-none opacity-90"}>
          <IconDownload className="size-5" />
          {label}
        </p>
      </div>
    );
  }

  return null;
}
