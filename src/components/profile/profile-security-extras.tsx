"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ProfileIconChevronRight,
  ProfileIconShield,
} from "@/components/icons/profile-icons";
import { ProfileActionSheet } from "@/components/profile/profile-action-sheet";
import { profileChipClass, type ProfileChipTone } from "@/components/profile/profile-vibrant-styles";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type LoginEvent = {
  id: string;
  method: string;
  ipAddress: string | null;
  deviceLabel: string | null;
  success: boolean;
  createdAt: string;
};

type PasskeyRow = {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

type SheetId = "anti-phishing" | "sessions" | null;

const inputCls =
  "w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[#1c1917]";

function ExtraRow({
  icon,
  tone,
  title,
  subtitle,
  badge,
  badgeTone = "muted",
  onClick,
}: {
  icon: ReactNode;
  tone: ProfileChipTone;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "ok" | "warn" | "muted";
  onClick: () => void;
}) {
  const badgeCls =
    badgeTone === "ok"
      ? "fd-pill-ok"
      : badgeTone === "warn"
        ? "fd-pill-warn"
        : "fd-pill-muted";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3.5 px-4 py-3.5 active:bg-[rgba(74,103,79,0.06)]"
      >
        <span className={`${profileChipClass[tone]} flex h-10 w-10 shrink-0 items-center justify-center`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold leading-tight text-[#1c1917]">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] leading-snug text-[var(--fd-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {badge ? (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeCls}`}>
            {badge}
          </span>
        ) : null}
        <ProfileIconChevronRight />
      </button>
    </li>
  );
}

export function ProfileSecurityExtras() {
  const { t } = useI18n();
  const [antiPhishingSet, setAntiPhishingSet] = useState(false);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [stepUpCode, setStepUpCode] = useState("");
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const [histRes, pkRes] = await Promise.all([
        fetch("/api/profile/login-history"),
        fetch("/api/profile/passkeys"),
      ]);
      const hist = await histRes.json().catch(() => ({}));
      const pk = await pkRes.json().catch(() => ({}));
      if (histRes.ok) setEvents(hist.events ?? []);
      if (pkRes.ok) setPasskeys(pk.passkeys ?? []);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void fetch("/api/profile/anti-phishing")
      .then((r) => r.json())
      .then((d) => setAntiPhishingSet(Boolean(d.set)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sheet === "sessions") void loadSessions();
  }, [sheet, loadSessions]);

  function closeSheet() {
    setSheet(null);
    setCode("");
    setStepUpCode("");
    setErr(null);
  }

  async function saveAntiPhishing() {
    setErr(null);
    setOk(null);
    const res = await fetch("/api/profile/anti-phishing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, totpCode: stepUpCode || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setOk(t("profile_anti_phishing_saved"));
    setAntiPhishingSet(true);
    setCode("");
    setStepUpCode("");
    closeSheet();
  }

  async function clearAntiPhishing() {
    setErr(null);
    const res = await fetch("/api/profile/anti-phishing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totpCode: stepUpCode || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setOk(t("profile_anti_phishing_cleared"));
    setAntiPhishingSet(false);
    closeSheet();
  }

  async function revokeSessions() {
    setErr(null);
    setOk(null);
    const res = await fetch("/api/profile/security/revoke-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totpCode: stepUpCode || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setOk(t("profile_sessions_revoked"));
    setStepUpCode("");
  }

  async function removePasskey(id: string) {
    setErr(null);
    const res = await fetch("/api/profile/passkeys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkeyId: id, totpCode: stepUpCode || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    await loadSessions();
  }

  function formatWhen(iso: string) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <>
      <section className="fd-card overflow-hidden p-0">
        <p className="border-b border-[var(--fd-border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
          {t("profile_section_advanced_security")}
        </p>
        <ul className="divide-y divide-[var(--fd-border)]">
          <ExtraRow
            tone="amber"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
            title={t("profile_anti_phishing_title")}
            subtitle={t("profile_anti_phishing_sub")}
            badge={antiPhishingSet ? t("profile_status_on") : t("profile_status_off")}
            badgeTone={antiPhishingSet ? "ok" : "muted"}
            onClick={() => setSheet("anti-phishing")}
          />
          <ExtraRow
            tone="sky"
            icon={<ProfileIconShield />}
            title={t("profile_sessions_title")}
            subtitle={t("profile_sessions_sub")}
            onClick={() => setSheet("sessions")}
          />
        </ul>
      </section>

      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}

      <ProfileActionSheet
        open={sheet === "anti-phishing"}
        title={t("profile_anti_phishing_title")}
        subtitle={t("profile_anti_phishing_sheet_sub")}
        onClose={closeSheet}
      >
        <div className="space-y-3">
          <p className="text-xs text-[var(--fd-muted)]">{t("profile_anti_phishing_hint")}</p>
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("profile_anti_phishing_code")}
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={20}
              className={`${inputCls} mt-1`}
              placeholder="ABCD1234"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("sec_totp_code_ph")}
            </span>
            <input
              value={stepUpCode}
              onChange={(e) => setStepUpCode(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          {err ? <p className="text-xs text-rose-700">{err}</p> : null}
          <button
            type="button"
            onClick={() => void saveAntiPhishing()}
            className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("profile_anti_phishing_save")}
          </button>
          {antiPhishingSet ? (
            <button
              type="button"
              onClick={() => void clearAntiPhishing()}
              className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700"
            >
              {t("profile_anti_phishing_remove")}
            </button>
          ) : null}
        </div>
      </ProfileActionSheet>

      <ProfileActionSheet
        open={sheet === "sessions"}
        title={t("profile_sessions_title")}
        subtitle={t("profile_sessions_sheet_sub")}
        onClose={closeSheet}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#1c1917]">{t("profile_login_history")}</p>
            {loadingSessions ? (
              <p className="mt-2 text-xs text-[var(--fd-muted)]">{t("sec_loading")}</p>
            ) : events.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--fd-muted)]">{t("profile_login_history_empty")}</p>
            ) : (
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {events.map((e) => (
                  <li key={e.id} className="rounded-lg bg-stone-50 px-3 py-2 text-[11px]">
                    <p className="font-semibold text-[#1c1917]">
                      {e.deviceLabel ?? e.method} · {e.ipAddress ?? "—"}
                    </p>
                    <p className="text-[var(--fd-muted)]">{formatWhen(e.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {passkeys.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-[#1c1917]">{t("sec_passkey_title")}</p>
              <ul className="mt-2 space-y-2">
                {passkeys.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2"
                  >
                    <div className="min-w-0 text-[11px]">
                      <p className="truncate font-semibold">{p.deviceName ?? "Passkey"}</p>
                      <p className="text-[var(--fd-muted)]">{formatWhen(p.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removePasskey(p.id)}
                      className="shrink-0 text-[10px] font-bold text-rose-700"
                    >
                      {t("profile_passkey_remove")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("sec_totp_code_ph")}
            </span>
            <input
              value={stepUpCode}
              onChange={(e) => setStepUpCode(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          {err ? <p className="text-xs text-rose-700">{err}</p> : null}
          <button
            type="button"
            onClick={() => void revokeSessions()}
            className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700"
          >
            {t("profile_sessions_revoke_all")}
          </button>
        </div>
      </ProfileActionSheet>
    </>
  );
}
