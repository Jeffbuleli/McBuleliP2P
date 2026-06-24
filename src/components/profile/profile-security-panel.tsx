"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  ProfileIconChevronRight,
  ProfileIconGear,
  ProfileIconLogout,
  ProfileIconShield,
} from "@/components/icons/profile-icons";
import { ProfileActionSheet } from "@/components/profile/profile-action-sheet";
import { profileChipClass, type ProfileChipTone } from "@/components/profile/profile-vibrant-styles";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type SecurityStatus = {
  email: string;
  emailVerified: boolean;
  pendingEmail: string | null;
  totpEnabled: boolean;
  passkeyCount: number;
  whatsAppVerified: boolean;
  recoveryWaPhone: string | null;
  kycApproved: boolean;
  openWaConfigured: boolean;
  openWaNumber: string | null;
};

type WaVerifyState = {
  challengeId: string;
  code: string;
  message: string;
  waLink: string | null;
} | null;

type SheetId = "email" | "totp" | "passkey" | "whatsapp" | "password" | "email-change" | null;

function SecurityRow({
  icon,
  tone,
  title,
  subtitle,
  badge,
  badgeTone = "muted",
  onClick,
  href,
}: {
  icon: ReactNode;
  tone: ProfileChipTone;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "ok" | "warn" | "muted";
  onClick?: () => void;
  href?: string;
}) {
  const badgeCls =
    badgeTone === "ok"
      ? "fd-pill-ok"
      : badgeTone === "warn"
        ? "fd-pill-warn"
        : "fd-pill-muted";

  const inner = (
    <>
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
    </>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          className="flex w-full items-center gap-3.5 px-4 py-3.5 active:bg-[rgba(74,103,79,0.06)]"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3.5 px-4 py-3.5 active:bg-[rgba(74,103,79,0.06)]"
      >
        {inner}
      </button>
    </li>
  );
}

function SheetField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-[var(--fd-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[#1c1917]";

export function ProfileSecurityPanel() {
  const { t } = useI18n();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetId>(null);

  const [totpSecret, setTotpSecret] = useState<string>();
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [stepUpCode, setStepUpCode] = useState("");

  const [waVerify, setWaVerify] = useState<WaVerifyState>(null);
  const [waPolling, setWaPolling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/security");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.error ?? "profile_load_failed"));
        return;
      }
      setStatus(data as SecurityStatus);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function closeSheet() {
    setSheet(null);
    setTotpSecret(undefined);
    setTotpUri(null);
    setTotpCode("");
    setWaVerify(null);
    setWaPolling(false);
  }

  async function resendVerification() {
    setErr(null);
    setOk(null);
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setOk(t("sec_email_sent"));
  }

  async function startTotpSetup() {
    setErr(null);
    setOk(null);
    setBackupCodes(null);
    const res = await fetch("/api/auth/totp", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setTotpSecret(data.secret);
    setTotpUri(data.uri);
  }

  async function confirmTotp() {
    setErr(null);
    const res = await fetch("/api/auth/totp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: totpCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setBackupCodes(data.backupCodes ?? []);
    setTotpSecret(undefined);
    setTotpUri(null);
    setTotpCode("");
    setOk(t("sec_totp_enabled"));
    void load();
  }

  async function disableTotp() {
    setErr(null);
    const res = await fetch("/api/auth/totp", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: stepUpCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setStepUpCode("");
    setOk(t("sec_totp_disabled"));
    closeSheet();
    void load();
  }

  async function addPasskey() {
    setErr(null);
    setOk(null);
    const optRes = await fetch("/api/auth/passkey/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceName: navigator.userAgent.slice(0, 48) }),
    });
    const optData = await optRes.json().catch(() => ({}));
    if (!optRes.ok) {
      setErr(clientErrorText(t, optData.error ?? "profile_invalid_input"));
      return;
    }
    const attestation = await startRegistration({ optionsJSON: optData.options });
    const verifyRes = await fetch("/api/auth/passkey/register", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: optData.challengeId,
        response: attestation,
      }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      setErr(clientErrorText(t, verifyData.error ?? "profile_invalid_input"));
      return;
    }
    setOk(t("sec_passkey_added"));
    void load();
  }

  async function startWaVerify() {
    setErr(null);
    setOk(null);
    const res = await fetch("/api/account/whatsapp/verify", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setWaVerify({
      challengeId: data.challengeId,
      code: data.code,
      message: data.message,
      waLink: data.waLink ?? null,
    });
    setWaPolling(true);
  }

  useEffect(() => {
    if (!waPolling || !waVerify) return;
    const id = setInterval(async () => {
      const res = await fetch(
        `/api/account/whatsapp/verify?challengeId=${encodeURIComponent(waVerify.challengeId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (data.verified) {
        setWaPolling(false);
        setWaVerify(null);
        setOk(t("sec_wa_verified"));
        closeSheet();
        void load();
      } else if (data.expired) {
        setWaPolling(false);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [waPolling, waVerify, load, t]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    const res = await fetch("/api/account/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        totpCode: stepUpCode || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setStepUpCode("");
    setOk(t("sec_password_changed"));
    closeSheet();
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    const res = await fetch("/api/account/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newEmail,
        currentPassword,
        totpCode: stepUpCode || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
      return;
    }
    setNewEmail("");
    setOk(t("sec_email_change_sent"));
    closeSheet();
    void load();
  }

  if (loading) {
    return (
      <section className="fd-card p-4 text-sm text-[color:var(--fd-muted)]">
        {t("sec_loading")}
      </section>
    );
  }

  if (!status) {
    return (
      <section className="fd-card p-4 text-sm text-red-600">
        {err ?? t("profile_load_failed")}
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {err ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>
      ) : null}
      {ok ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{ok}</p>
      ) : null}

      <section className="fd-card overflow-hidden p-0">
        <ul className="divide-y divide-[var(--fd-border)]">
          <SecurityRow
            tone="sky"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 9l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            }
            title={t("sec_email_title")}
            subtitle={status.email}
            badge={
              status.emailVerified ? t("sec_email_verified") : t("sec_email_unverified")
            }
            badgeTone={status.emailVerified ? "ok" : "warn"}
            onClick={() => setSheet("email")}
          />
          <SecurityRow
            tone="forest"
            icon={<ProfileIconShield />}
            title={t("sec_totp_title")}
            subtitle={t("sec_totp_hint")}
            badge={status.totpEnabled ? t("profile_status_on") : t("profile_status_off")}
            badgeTone={status.totpEnabled ? "ok" : "muted"}
            onClick={() => setSheet("totp")}
          />
          <SecurityRow
            tone="mint"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="9" cy="15" r="1" fill="currentColor" />
                <path d="M9 10V7a3 3 0 016 0v3" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
            title={t("sec_passkey_title")}
            subtitle={t("sec_passkey_count", { count: status.passkeyCount })}
            badge={status.passkeyCount > 0 ? String(status.passkeyCount) : undefined}
            badgeTone={status.passkeyCount > 0 ? "ok" : "muted"}
            onClick={() => setSheet("passkey")}
          />
          <SecurityRow
            tone="amber"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M8 4h8l1 16H7L8 4zM10 2h4v2h-4V2z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title={t("sec_wa_title")}
            subtitle={
              status.whatsAppVerified
                ? status.recoveryWaPhone ?? t("sec_wa_verified_badge")
                : t("sec_wa_hint")
            }
            badge={
              status.whatsAppVerified ? t("profile_status_linked") : t("profile_status_not_linked")
            }
            badgeTone={status.whatsAppVerified ? "ok" : "muted"}
            onClick={() => setSheet("whatsapp")}
          />
          <SecurityRow
            tone="violet"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
            title={t("sec_password_title")}
            subtitle={t("profile_secure_cta")}
            onClick={() => setSheet("password")}
          />
          <SecurityRow
            tone="sky"
            icon={<ProfileIconGear />}
            title={t("sec_change_email_title")}
            subtitle={status.pendingEmail ?? status.email}
            badge={status.pendingEmail ? t("sec_email_pending") : undefined}
            badgeTone={status.pendingEmail ? "warn" : "muted"}
            onClick={() => setSheet("email-change")}
          />
          <SecurityRow
            tone="copper"
            icon={<ProfileIconLogout />}
            title={t("sec_recovery_title")}
            subtitle={t("sec_recovery_hint")}
            href="/account/recovery"
          />
        </ul>
      </section>

      <ProfileActionSheet
        open={sheet === "email"}
        title={t("sec_email_title")}
        subtitle={status.email}
        onClose={closeSheet}
      >
        <div className="space-y-3">
          <p className="text-xs text-[var(--fd-muted)]">
            {status.emailVerified ? t("sec_email_verified") : t("sec_email_unverified")}
          </p>
          {status.pendingEmail ? (
            <p className="text-xs text-amber-800">
              {t("sec_email_pending")}: {status.pendingEmail}
            </p>
          ) : null}
          {!status.emailVerified ? (
            <button
              type="button"
              onClick={() => void resendVerification()}
              className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {t("sec_resend_verify")}
            </button>
          ) : null}
        </div>
      </ProfileActionSheet>

      <ProfileActionSheet
        open={sheet === "totp"}
        title={t("sec_totp_title")}
        subtitle={t("sec_totp_hint")}
        onClose={closeSheet}
      >
        {status.totpEnabled ? (
          <div className="space-y-3">
            <span className="fd-pill-ok text-[10px]">{t("sec_totp_on")}</span>
            <SheetField label={t("sec_totp_code_ph")}>
              <input
                value={stepUpCode}
                onChange={(e) => setStepUpCode(e.target.value)}
                placeholder={t("sec_totp_code_ph")}
                className={inputCls}
              />
            </SheetField>
            <button
              type="button"
              onClick={() => void disableTotp()}
              className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700"
            >
              {t("sec_totp_disable")}
            </button>
          </div>
        ) : totpSecret ? (
          <div className="space-y-3">
            {totpUri ? (
              <p className="break-all text-[10px] text-[var(--fd-muted)]">{totpUri}</p>
            ) : null}
            <p className="font-mono text-xs">{totpSecret}</p>
            <SheetField label={t("sec_totp_code_ph")}>
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder={t("sec_totp_code_ph")}
                className={inputCls}
              />
            </SheetField>
            <button
              type="button"
              onClick={() => void confirmTotp()}
              className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {t("sec_totp_confirm")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void startTotpSetup()}
            className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("sec_totp_setup")}
          </button>
        )}
        {backupCodes?.length ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-3">
            <p className="text-xs font-semibold">{t("sec_backup_codes")}</p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </ProfileActionSheet>

      <ProfileActionSheet
        open={sheet === "passkey"}
        title={t("sec_passkey_title")}
        subtitle={t("sec_passkey_count", { count: status.passkeyCount })}
        onClose={closeSheet}
      >
        <button
          type="button"
          onClick={() => void addPasskey()}
          className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {t("sec_passkey_add")}
        </button>
      </ProfileActionSheet>

      <ProfileActionSheet
        open={sheet === "whatsapp"}
        title={t("sec_wa_title")}
        subtitle={t("sec_wa_hint")}
        onClose={closeSheet}
      >
        {status.whatsAppVerified ? (
          <p className="text-sm">
            <span className="fd-pill-ok text-[10px]">{t("sec_wa_verified_badge")}</span>
            {status.recoveryWaPhone ? (
              <span className="ml-2 text-[var(--fd-muted)]">{status.recoveryWaPhone}</span>
            ) : null}
          </p>
        ) : status.openWaConfigured ? (
          <div className="space-y-3">
            {waVerify ? (
              <>
                <p className="text-sm font-semibold">{waVerify.code}</p>
                <p className="rounded-xl bg-stone-50 p-2 text-xs">{waVerify.message}</p>
                {waVerify.waLink ? (
                  <a
                    href={waVerify.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full justify-center rounded-xl border border-[color:var(--fd-border)] px-4 py-2.5 text-sm font-semibold"
                  >
                    {t("sec_wa_open")}
                  </a>
                ) : null}
                <p className="text-[10px] text-[var(--fd-muted)]">
                  {waPolling ? t("sec_wa_waiting") : t("sec_wa_expired")}
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void startWaVerify()}
                className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {t("sec_wa_start")}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--fd-muted)]">{t("sec_wa_unconfigured")}</p>
        )}
      </ProfileActionSheet>

      <ProfileActionSheet
        open={sheet === "password"}
        title={t("sec_password_title")}
        onClose={closeSheet}
      >
        <form onSubmit={(e) => void changePassword(e)} className="space-y-3">
          <SheetField label={t("sec_current_password")}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              required
            />
          </SheetField>
          <SheetField label={t("sec_new_password")}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              required
              minLength={8}
            />
          </SheetField>
          {status.totpEnabled ? (
            <SheetField label={t("sec_totp_code_ph")}>
              <input
                value={stepUpCode}
                onChange={(e) => setStepUpCode(e.target.value)}
                className={inputCls}
              />
            </SheetField>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("sec_password_save")}
          </button>
        </form>
      </ProfileActionSheet>

      <ProfileActionSheet
        open={sheet === "email-change"}
        title={t("sec_change_email_title")}
        onClose={closeSheet}
      >
        <form onSubmit={(e) => void changeEmail(e)} className="space-y-3">
          <SheetField label={t("sec_new_email")}>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputCls}
              required
            />
          </SheetField>
          <SheetField label={t("sec_current_password")}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              required
            />
          </SheetField>
          {status.totpEnabled ? (
            <SheetField label={t("sec_totp_code_ph")}>
              <input
                value={stepUpCode}
                onChange={(e) => setStepUpCode(e.target.value)}
                className={inputCls}
              />
            </SheetField>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("sec_email_change_btn")}
          </button>
        </form>
      </ProfileActionSheet>
    </div>
  );
}
