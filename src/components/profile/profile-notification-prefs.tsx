"use client";

import { useCallback, useEffect, useState } from "react";
import { IconBell } from "@/components/icons/flow-icons";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";
import type { NotificationPrefs } from "@/lib/notification-prefs";

type PrefKey = keyof NotificationPrefs;

const PREF_ROWS: { key: PrefKey; labelKey: "profile_pref_email_security" | "profile_pref_email_p2p" | "profile_pref_email_marketing" | "profile_pref_inapp_p2p" | "profile_pref_inapp_community" | "profile_pref_inapp_academy"; section: "email" | "inapp" }[] = [
  { key: "emailSecurity", labelKey: "profile_pref_email_security", section: "email" },
  { key: "emailP2p", labelKey: "profile_pref_email_p2p", section: "email" },
  { key: "emailMarketing", labelKey: "profile_pref_email_marketing", section: "email" },
  { key: "inAppP2p", labelKey: "profile_pref_inapp_p2p", section: "inapp" },
  { key: "inAppCommunity", labelKey: "profile_pref_inapp_community", section: "inapp" },
  { key: "inAppAcademy", labelKey: "profile_pref_inapp_academy", section: "inapp" },
];

function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1c1917]">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-[var(--fd-muted)]">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[color:var(--fd-primary)]" : "bg-stone-300"
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </li>
  );
}

export function ProfileNotificationPrefs() {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/profile/notification-prefs");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      setPrefs(null);
      return;
    }
    setPrefs(data.prefs as NotificationPrefs);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(key: PrefKey, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setOk(false);
    setErr(null);
    const res = await fetch("/api/profile/notification-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      setPrefs(prefs);
      return;
    }
    setPrefs(data.prefs as NotificationPrefs);
    setOk(true);
    window.setTimeout(() => setOk(false), 2000);
  }

  if (loading) {
    return (
      <section className="fd-card p-4 text-sm text-[var(--fd-muted)]">{t("sec_loading")}</section>
    );
  }

  if (!prefs) {
    return (
      <section className="fd-card p-4 text-sm text-red-600">{err ?? t("profile_invalid_input")}</section>
    );
  }

  const emailRows = PREF_ROWS.filter((r) => r.section === "email");
  const inAppRows = PREF_ROWS.filter((r) => r.section === "inapp");

  return (
    <div className="space-y-3">
      {err ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>
      ) : null}
      {ok ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{t("profile_saved")}</p>
      ) : null}

      <section className="fd-card overflow-hidden p-0">
        <p className="flex items-center gap-2 border-b border-[var(--fd-border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
          <IconBell className="h-3.5 w-3.5" />
          {t("profile_pref_section_email")}
        </p>
        <ul className="divide-y divide-[var(--fd-border)]">
          {emailRows.map((row) => (
            <ToggleRow
              key={row.key}
              label={t(row.labelKey)}
              checked={prefs[row.key]}
              disabled={saving || row.key === "emailSecurity"}
              hint={row.key === "emailSecurity" ? t("profile_pref_email_security_hint") : undefined}
              onChange={(v) => void update(row.key, v)}
            />
          ))}
        </ul>
      </section>

      <section className="fd-card overflow-hidden p-0">
        <p className="border-b border-[var(--fd-border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
          {t("profile_pref_section_inapp")}
        </p>
        <ul className="divide-y divide-[var(--fd-border)]">
          {inAppRows.map((row) => (
            <ToggleRow
              key={row.key}
              label={t(row.labelKey)}
              checked={prefs[row.key]}
              disabled={saving}
              onChange={(v) => void update(row.key, v)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
