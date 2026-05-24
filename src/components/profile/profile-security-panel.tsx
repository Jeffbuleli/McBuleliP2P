"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
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

export function ProfileSecurityPanel() {
  const { t } = useI18n();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

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
        setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
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
        {err ?? t("profile_invalid_input")}
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

      <section className="fd-card p-4">
        <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("sec_email_title")}</h3>
        <p className="mt-1 truncate text-xs text-[color:var(--fd-muted)]">{status.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span
            className={
              status.emailVerified ? "fd-pill-ok text-[10px]" : "fd-pill-warn text-[10px]"
            }
          >
            {status.emailVerified ? t("sec_email_verified") : t("sec_email_unverified")}
          </span>
          {status.pendingEmail ? (
            <span className="fd-pill-warn text-[10px]">
              {t("sec_email_pending")}: {status.pendingEmail}
            </span>
          ) : null}
        </div>
        {!status.emailVerified ? (
          <button
            type="button"
            onClick={() => void resendVerification()}
            className="mt-3 rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            {t("sec_resend_verify")}
          </button>
        ) : null}
      </section>

      <section className="fd-card p-4">
        <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("sec_totp_title")}</h3>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{t("sec_totp_hint")}</p>
        {status.totpEnabled ? (
          <div className="mt-3 space-y-2">
            <span className="fd-pill-ok text-[10px]">{t("sec_totp_on")}</span>
            <input
              value={stepUpCode}
              onChange={(e) => setStepUpCode(e.target.value)}
              placeholder={t("sec_totp_code_ph")}
              className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void disableTotp()}
              className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700"
            >
              {t("sec_totp_disable")}
            </button>
          </div>
        ) : totpSecret ? (
          <div className="mt-3 space-y-2">
            {totpUri ? (
              <p className="break-all text-[10px] text-[color:var(--fd-muted)]">{totpUri}</p>
            ) : null}
            <p className="font-mono text-xs">{totpSecret}</p>
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder={t("sec_totp_code_ph")}
              className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void confirmTotp()}
              className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-semibold text-white"
            >
              {t("sec_totp_confirm")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void startTotpSetup()}
            className="mt-3 rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            {t("sec_totp_setup")}
          </button>
        )}
        {backupCodes?.length ? (
          <div className="mt-3 rounded-xl bg-stone-50 p-3">
            <p className="text-xs font-semibold">{t("sec_backup_codes")}</p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="fd-card p-4">
        <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("sec_passkey_title")}</h3>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
          {t("sec_passkey_count").replace("{count}", String(status.passkeyCount))}
        </p>
        <button
          type="button"
          onClick={() => void addPasskey()}
          className="mt-3 rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-semibold text-white"
        >
          {t("sec_passkey_add")}
        </button>
      </section>

      <section className="fd-card p-4">
        <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("sec_wa_title")}</h3>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{t("sec_wa_hint")}</p>
        {status.whatsAppVerified ? (
          <p className="mt-2 text-xs">
            <span className="fd-pill-ok text-[10px]">{t("sec_wa_verified_badge")}</span>
            {status.recoveryWaPhone ? (
              <span className="ml-2 text-[color:var(--fd-muted)]">{status.recoveryWaPhone}</span>
            ) : null}
          </p>
        ) : status.openWaConfigured ? (
          <div className="mt-3 space-y-2">
            {waVerify ? (
              <>
                <p className="text-xs font-semibold">{waVerify.code}</p>
                <p className="rounded-xl bg-stone-50 p-2 text-xs">{waVerify.message}</p>
                {waVerify.waLink ? (
                  <a
                    href={waVerify.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-xl border border-[color:var(--fd-border)] px-4 py-2 text-xs font-semibold"
                  >
                    {t("sec_wa_open")}
                  </a>
                ) : null}
                <p className="text-[10px] text-[color:var(--fd-muted)]">
                  {waPolling ? t("sec_wa_waiting") : t("sec_wa_expired")}
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void startWaVerify()}
                className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-semibold text-white"
              >
                {t("sec_wa_start")}
              </button>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-[color:var(--fd-muted)]">{t("sec_wa_unconfigured")}</p>
        )}
      </section>

      <section className="fd-card p-4">
        <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("sec_password_title")}</h3>
        <form onSubmit={(e) => void changePassword(e)} className="mt-3 space-y-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("sec_current_password")}
            className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("sec_new_password")}
            className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            required
            minLength={8}
          />
          {status.totpEnabled ? (
            <input
              value={stepUpCode}
              onChange={(e) => setStepUpCode(e.target.value)}
              placeholder={t("sec_totp_code_ph")}
              className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            />
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            {t("sec_password_save")}
          </button>
        </form>
      </section>

      <section className="fd-card p-4">
        <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("sec_change_email_title")}</h3>
        <form onSubmit={(e) => void changeEmail(e)} className="mt-3 space-y-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("sec_new_email")}
            className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("sec_current_password")}
            className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            required
          />
          {status.totpEnabled ? (
            <input
              value={stepUpCode}
              onChange={(e) => setStepUpCode(e.target.value)}
              placeholder={t("sec_totp_code_ph")}
              className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2 text-sm"
            />
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            {t("sec_email_change_btn")}
          </button>
        </form>
      </section>

      <section className="fd-card p-4">
        <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("sec_recovery_title")}</h3>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{t("sec_recovery_hint")}</p>
        <Link
          href="/account/recovery"
          className="mt-3 inline-flex rounded-xl border border-[color:var(--fd-border)] px-4 py-2 text-xs font-semibold"
        >
          {t("sec_recovery_open")}
        </Link>
      </section>
    </div>
  );
}
