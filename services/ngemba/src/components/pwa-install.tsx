"use client";

import { useEffect, useState } from "react";
import { IconDownload } from "@/components/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallButton({
  label,
  iosHint,
}: {
  label: string;
  iosHint: string;
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
      // iOS Safari
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

  if (installed) return null;

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
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ng-primary hover:underline"
      >
        <IconDownload className="size-3.5" />
        {label}
      </button>
    );
  }

  if (showIos) {
    return (
      <p className="max-w-[16rem] text-center text-[10px] leading-snug text-ng-muted">
        {iosHint}
      </p>
    );
  }

  return null;
}
