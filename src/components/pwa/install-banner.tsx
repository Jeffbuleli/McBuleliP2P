"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";

const STORAGE_UNTIL = "mb_pwa_install_dismiss_until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function dismissed(): boolean {
  try {
    const until = localStorage.getItem(STORAGE_UNTIL);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMobileUa(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent,
  );
}

export function PwaInstallBanner() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  /** True when showing generic “use browser menu” (no install prompt API). */
  const [fallback, setFallback] = useState(false);
  const bipReceived = useRef(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (dismissed()) return;

    setIos(isIos());

    const onBip = (e: Event) => {
      e.preventDefault();
      bipReceived.current = true;
      setDeferred(e as BeforeInstallPromptEvent);
      setFallback(false);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    // iOS Safari: no beforeinstallprompt — suggest Add to Home Screen after a short delay.
    let iosTmo: ReturnType<typeof setTimeout> | undefined;
    if (isIos() && isMobileUa()) {
      iosTmo = setTimeout(() => {
        if (isStandalone() || dismissed()) return;
        setFallback(true);
        setOpen(true);
      }, 2800);
    }

    // Chromium without prompt yet: gentle reminder (browser menu).
    let androidTmo: ReturnType<typeof setTimeout> | undefined;
    if (!isIos() && isMobileUa()) {
      androidTmo = setTimeout(() => {
        if (isStandalone() || dismissed()) return;
        if (bipReceived.current) return;
        setFallback(true);
        setOpen(true);
      }, 6500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      if (iosTmo) clearTimeout(iosTmo);
      if (androidTmo) clearTimeout(androidTmo);
    };
  }, []);

  async function onInstall() {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    setOpen(false);
  }

  function onDismiss() {
    try {
      localStorage.setItem(STORAGE_UNTIL, String(Date.now() + DISMISS_MS));
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  const body =
    ios || (fallback && !deferred)
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
      aria-label={t("pwa_install_title")}
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-800/40 bg-stone-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md">
        <p className="text-sm font-bold text-stone-50">{t("pwa_install_title")}</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-400">{body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!ios && deferred ? (
            <button
              type="button"
              onClick={onInstall}
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
