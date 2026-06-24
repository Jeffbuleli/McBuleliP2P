"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfileIconCommunity } from "@/components/icons/profile-icons";
import { profileChipClass } from "@/components/profile/profile-vibrant-styles";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type CommunityProfile = {
  handle: string;
  bio: string;
  showKycBadge: boolean;
  displayName: string;
};

const inputCls =
  "w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[#1c1917]";

export function ProfileCommunityInfo() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [showKycBadge, setShowKycBadge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/profile/community");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    const p = data.profile as CommunityProfile;
    setProfile(p);
    setHandle(p.handle);
    setBio(p.bio);
    setShowKycBadge(p.showKycBadge);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(false);
    const res = await fetch("/api/profile/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: handle.trim().toLowerCase(),
        bio,
        showKycBadge,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    const p = data.profile as CommunityProfile;
    setProfile(p);
    setHandle(p.handle);
    setBio(p.bio);
    setShowKycBadge(p.showKycBadge);
    setOk(true);
  }

  if (loading) {
    return (
      <section className="fd-card p-4 text-sm text-[var(--fd-muted)]">{t("sec_loading")}</section>
    );
  }

  return (
    <section className="fd-card p-4">
      <div className="flex items-start gap-3">
        <span className={`${profileChipClass.sky} flex h-10 w-10 shrink-0 items-center justify-center`}>
          <ProfileIconCommunity />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("profile_community_heading")}</p>
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{t("profile_community_hint")}</p>
        </div>
      </div>

      {err ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>
      ) : null}
      {ok ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{t("profile_saved")}</p>
      ) : null}

      <form onSubmit={(e) => void save(e)} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">{t("profile_community_handle")}</span>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sm text-[var(--fd-muted)]">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              className={inputCls}
              minLength={3}
              maxLength={32}
              pattern="[a-z][a-z0-9_]{2,31}"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">{t("profile_community_bio")}</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${inputCls} mt-1 min-h-[88px] resize-y`}
            maxLength={280}
            placeholder={t("profile_community_bio_ph")}
          />
          <p className="mt-1 text-right text-[10px] text-[var(--fd-muted)]">{bio.length}/280</p>
        </label>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--fd-border)] px-3 py-2.5">
          <span className="text-sm font-medium text-[#1c1917]">{t("profile_community_show_kyc")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={showKycBadge}
            onClick={() => setShowKycBadge((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              showKycBadge ? "bg-[color:var(--fd-primary)]" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                showKycBadge ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </label>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? t("profile_avatar_uploading") : t("profile_save")}
          </button>
          {profile ? (
            <Link
              href={`/app/community/u/${profile.handle}`}
              className="rounded-xl border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold text-[color:var(--fd-primary)]"
            >
              {t("profile_community_view")}
            </Link>
          ) : null}
        </div>
      </form>
    </section>
  );
}
