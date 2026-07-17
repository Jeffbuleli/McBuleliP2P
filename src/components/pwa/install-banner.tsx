"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { useViewport } from "@/hooks/use-viewport";
import {
  dismissInstallPrompt,
  hasInstalledRelatedWebApp,
  installDismissed,
  isIosDevice,
  isStandaloneDisplay,
  markSessionPrompted,
  shouldRedirectToCanonical,
  wasPromptedThisSession,
} from "@/lib/pwa/install-state";

const PROMPT_DELAY_MS = 2200;
const NAV_PROMPT_DELAY_MS = 1200;

const AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/confirm-email-change",
  "/account/recovery",
]);

export function PwaInstallBanner() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { tier, isDesktop, isTablet } = useViewport();
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

        // Chromium install prompt available (phone, tablet, or desktop)
        if (deferred) {
          setOpen(true);
          markSessionPrompted();
          return;
        }

        // Manual instructions for any device without a native install sheet
        setFallback(true);
        setOpen(true);
        markSessionPrompted();
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
        } else if (!installDismissed() && (deferred || fallback || ios)) {
          setOpen(true);
        }
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [deferred, fallback, ios]);

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
  if (pathname && AUTH_PATHS.has(pathname)) return null;

  const showOpenInApp = installedRelated && !isStandaloneDisplay();
  const manual = !showOpenInApp && (ios || (fallback && !deferred));

  let body: string;
  if (showOpenInApp) {
    body = t("pwa_open_in_app_body");
  } else if (ios) {
    body = isTablet || isDesktop ? t("pwa_install_ios_tablet_body") : t("pwa_install_ios_body");
  } else if (manual && isDesktop) {
    body = t("pwa_install_desktop_body");
  } else if (manual && isTablet) {
    body = t("pwa_install_tablet_body");
  } else if (manual) {
    body = t("pwa_install_fallback_body");
  } else {
    body = isDesktop
      ? t("pwa_install_desktop_body")
      : isTablet
        ? t("pwa_install_tablet_body")
        : t("pwa_install_body");
  }

  const title = showOpenInApp
    ? t("pwa_open_in_app_title")
    : isDesktop
      ? t("pwa_install_desktop_title")
      : t("pwa_install_title");

  const onApp = pathname?.startsWith("/app") === true;
  const dockBottom = onApp
    ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] pb-2 lg:bottom-4 lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  return (
    <div
      className={`fixed inset-x-0 z-[60] px-3 pt-2 md:px-5 ${dockBottom}`}
      role="dialog"
      aria-label={title}
      data-viewport={tier}
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-800/40 bg-stone-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md md:max-w-xl lg:max-w-lg lg:ml-auto lg:mr-6">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/25 text-emerald-400"
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-stone-50">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-400">{body}</p>
          </div>
        </div>
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
          {!showOpenInApp && deferred ? (
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
