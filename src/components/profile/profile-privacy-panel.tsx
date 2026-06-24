"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

export function ProfilePrivacyPanel() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function exportData() {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/profile/data-export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mcbuleli-profile-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      setOk(t("profile_privacy_export_ok"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <section className="fd-card p-4">
        <h2 className="text-sm font-bold text-[#1c1917]">{t("profile_privacy_export_title")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-[var(--fd-muted)]">
          {t("profile_privacy_export_sub")}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportData()}
          className="mt-4 w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? t("sec_loading") : t("profile_privacy_export_btn")}
        </button>
      </section>

      <section className="fd-card p-4">
        <h2 className="text-sm font-bold text-[#1c1917]">{t("profile_privacy_delete_title")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-[var(--fd-muted)]">
          {t("profile_privacy_delete_sub")}
        </p>
      </section>

      {err ? <p className="text-sm text-rose-700">{err}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
    </div>
  );
}
