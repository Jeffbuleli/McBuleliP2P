"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

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
          await fetchWithDeadline(
            "/api/auth/logout",
            { method: "POST", credentials: "same-origin" },
            20_000,
          );
          window.location.replace("/");
        } catch {
          setLoading(false);
        }
      }}
      className={
        className ??
        "rounded-lg border border-stone-700/60 bg-stone-950/70 px-3 py-1.5 text-sm font-medium text-stone-100 shadow-lg shadow-black/25 backdrop-blur-md disabled:opacity-60 hover:bg-stone-900/60"
      }
    >
      {loading ? t("signing_out") : t("log_out")}
    </button>
  );
}
