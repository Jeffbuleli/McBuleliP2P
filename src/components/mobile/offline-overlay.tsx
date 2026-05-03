"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export function OfflineOverlay() {
  const { t } = useI18n();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3 bg-stone-950/95 px-6 text-center backdrop-blur-sm"
      role="alert"
    >
      <WifiOffIcon />
      <p className="text-lg font-semibold text-white">{t("offline_title")}</p>
      <p className="max-w-xs text-sm text-stone-400">{t("offline_hint")}</p>
    </div>
  );
}

function WifiOffIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      className="text-rose-400"
      aria-hidden
    >
      <path
        d="M2 2l20 20M8.5 8.5a5 5 0 017 7M3 10a13 13 0 0117 0M6 14a9 9 0 0111 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
