"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { P2P_COUNTRY_CODES } from "@/lib/p2p-config";
import { countryLabel } from "@/lib/country-label";

export function ProfilePersonalInfo({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [countryCode, setCountryCode] = useState("CD");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.displayName === "string") setDisplayName(d.displayName);
        if (typeof d.countryCode === "string") setCountryCode(d.countryCode);
        if (d.avatarUrl != null) setAvatarUrl(d.avatarUrl);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          countryCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "profile_invalid_input");
        return;
      }
      setOk(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="fd-card p-4">
      <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{t("profile_personal_heading")}</h2>
      <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">{t("profile_display_name_hint")}</p>

      <div className="mt-4 flex flex-col items-center">
        <ProfileAvatarEditor email={initialEmail} initialAvatarUrl={avatarUrl} variant="compact" />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold text-[color:var(--fd-text)]">{t("profile_display_name")}</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={64}
          placeholder={t("profile_display_name")}
          className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-semibold text-[color:var(--fd-text)]">{t("profile_country")}</span>
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm"
        >
          {P2P_COUNTRY_CODES.map((c) => (
            <option key={c} value={c}>
              {countryLabel(locale, c)}
            </option>
          ))}
        </select>
      </label>

      {err ? (
        <p className="mt-2 text-xs font-semibold text-rose-700">{err}</p>
      ) : ok ? (
        <p className="mt-2 text-xs font-semibold text-[color:var(--fd-primary)]">{t("profile_saved")}</p>
      ) : null}

      <button
        type="button"
        disabled={busy || displayName.trim().length < 2}
        onClick={() => void save()}
        className="mt-4 w-full rounded-xl bg-[color:var(--fd-primary)] py-2.5 text-sm font-bold text-white disabled:opacity-40"
      >
        {t("profile_save")}
      </button>
    </section>
  );
}
