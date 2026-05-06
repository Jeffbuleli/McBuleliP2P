"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export function LogoutButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            signal: AbortSignal.timeout(20_000),
          });
          window.location.assign("/");
        } catch {
          setLoading(false);
        }
      }}
      className={
        className ??
        "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 disabled:opacity-60"
      }
    >
      {loading ? t("signing_out") : t("log_out")}
    </button>
  );
}
