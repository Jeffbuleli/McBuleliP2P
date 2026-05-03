"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

const DISMISS_KEY = "mcbuleli-install-dismissed";

export function InstallAppBanner() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  async function onInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function onDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
  }

  if (!deferred) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[39] mx-auto max-w-lg rounded-2xl border border-emerald-600/30 bg-emerald-950 px-4 py-3 shadow-xl shadow-black/30 dark:bg-emerald-950">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="white"
            aria-hidden
          >
            <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{t("install_app")}</p>
          <p className="mt-0.5 text-xs text-emerald-100/90">{t("install_hint")}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="min-h-[44px] flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-950 active:scale-[0.98]"
              onClick={onInstall}
            >
              {t("install_cta")}
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-xl border border-white/25 px-3 py-2 text-sm font-medium text-white active:scale-[0.98]"
              onClick={onDismiss}
            >
              {t("install_later")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
