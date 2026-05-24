"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import {
  dismissInstallPrompt,
  hasInstalledRelatedWebApp,
  installDismissed,
  isIosDevice,
  isMobileUa,
  isStandaloneDisplay,
  markSessionPrompted,
  shouldRedirectToCanonical,
  wasPromptedThisSession,
} from "@/lib/pwa/install-state";

const PROMPT_DELAY_MS = 2200;
const NAV_PROMPT_DELAY_MS = 1200;

export function PwaInstallBanner() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [fallback, setFallback] = useState(false);
  const [installedRelated, setInstalledRelated] = useState(false);
  const bipReceived = useRef(false);
  const navCount = useRef(0);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const redirect = shouldRedirectToCanonical();
    if (redirect) {
      window.location.replace(redirect);
      return;
    }

    setIos(isIosDevice());
    void hasInstalledRelatedWebApp().then(setInstalledRelated);

    const onBip = (e: Event) => {
      e.preventDefault();
      bipReceived.current = true;
      setDeferred(e as BeforeInstallPromptEvent);
      setFallback(false);
      if (!installDismissed()) setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setOpen(false);
      return;
    }

    navCount.current += 1;
    const delay =
      navCount.current === 1 && !wasPromptedThisSession()
        ? PROMPT_DELAY_MS
        : NAV_PROMPT_DELAY_MS;

    const id = window.setTimeout(() => {
      if (isStandaloneDisplay()) return;

      void hasInstalledRelatedWebApp().then((installed) => {
        setInstalledRelated(installed);
        if (installed) {
          setOpen(true);
          return;
        }
        if (installDismissed()) return;

        if (deferred) {
          setOpen(true);
          markSessionPrompted();
          return;
        }
        if (isIosDevice() && isMobileUa()) {
          setFallback(true);
          setOpen(true);
          markSessionPrompted();
          return;
        }
        if (!isIosDevice() && isMobileUa() && !bipReceived.current) {
          setFallback(true);
          setOpen(true);
          markSessionPrompted();
        }
      });
    }, delay);

    return () => window.clearTimeout(id);
  }, [pathname, deferred]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || isStandaloneDisplay()) return;
      void hasInstalledRelatedWebApp().then((installed) => {
        setInstalledRelated(installed);
        if (installed) {
          setOpen(true);
        } else if (!installDismissed() && (deferred || (isIosDevice() && isMobileUa()))) {
          setOpen(true);
        }
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [deferred]);

  async function onInstall() {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    setOpen(false);
  }

  function onDismiss() {
    dismissInstallPrompt();
    setOpen(false);
  }

  function onOpenInApp() {
    window.location.href = `${window.location.pathname}${window.location.search}`;
  }

  if (!open) return null;

  const showOpenInApp = installedRelated && !isStandaloneDisplay();
  const body = showOpenInApp
    ? t("pwa_open_in_app_body")
    : ios || (fallback && !deferred)
      ? ios
        ? t("pwa_install_ios_body")
        : t("pwa_install_fallback_body")
      : t("pwa_install_body");

  const dockBottom =
    pathname?.startsWith("/app") === true
      ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] pb-2"
      : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  return (
    <div
      className={`fixed inset-x-0 z-[60] px-3 pt-2 ${dockBottom}`}
      role="dialog"
      aria-label={showOpenInApp ? t("pwa_open_in_app_title") : t("pwa_install_title")}
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-800/40 bg-stone-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md">
        <p className="text-sm font-bold text-stone-50">
          {showOpenInApp ? t("pwa_open_in_app_title") : t("pwa_install_title")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-stone-400">{body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {showOpenInApp ? (
            <button
              type="button"
              onClick={onOpenInApp}
              className="min-h-[44px] flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-sm font-semibold text-white active:scale-[0.99]"
            >
              {t("pwa_open_in_app_cta")}
            </button>
          ) : null}
          {!showOpenInApp && !ios && deferred ? (
            <button
              type="button"
              onClick={() => void onInstall()}
              className="min-h-[44px] flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-sm font-semibold text-white active:scale-[0.99]"
            >
              {t("pwa_install_cta")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[44px] rounded-xl border border-stone-600 bg-stone-900/80 px-4 text-sm font-semibold text-stone-200 active:scale-[0.99] sm:min-w-[120px]"
          >
            {t("pwa_install_later")}
          </button>
        </div>
      </div>
    </div>
  );
}
