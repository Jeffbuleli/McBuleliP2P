"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";
import type { KycLegalIdentity } from "@/lib/kyc-identity";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";

const inputCls =
  "w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[#1c1917]";

export function KycIdentityCorrectionPanel({
  data,
  onUpdated,
}: {
  data: KycStatusPayload;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [identity, setIdentity] = useState<KycLegalIdentity | null>(data.legalIdentity);
  const [firstName, setFirstName] = useState(data.legalIdentity?.legalFirstName ?? "");
  const [lastName, setLastName] = useState(data.legalIdentity?.legalLastName ?? "");
  const [birthDate, setBirthDate] = useState(data.legalIdentity?.birthDate ?? "");
  const [documentNumber, setDocumentNumber] = useState(
    data.legalIdentity?.documentNumber ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setIdentity(data.legalIdentity);
    setFirstName(data.legalIdentity?.legalFirstName ?? "");
    setLastName(data.legalIdentity?.legalLastName ?? "");
    setBirthDate(data.legalIdentity?.birthDate ?? "");
    setDocumentNumber(data.legalIdentity?.documentNumber ?? "");
  }, [data.legalIdentity]);

  const showPanel =
    data.approved || data.canResubmitKyc || Boolean(identity?.legalFirstName || identity?.legalLastName);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile/kyc-identity");
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.identity) {
      setIdentity(body.identity as KycLegalIdentity);
    }
  }, []);

  useEffect(() => {
    if (!data.legalIdentity) void load();
  }, [data.legalIdentity, load]);

  if (!showPanel) return null;

  async function save() {
    setBusy(true);
    setErr(null);
    setOk(false);
    const res = await fetch("/api/profile/kyc-identity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalFirstName: firstName.trim(),
        legalLastName: lastName.trim(),
        birthDate: birthDate.trim() || null,
        documentNumber: documentNumber.trim() || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(clientErrorText(t, body.error ?? "profile_invalid_input"));
      return;
    }
    setIdentity(body.identity as KycLegalIdentity);
    setOk(true);
    onUpdated();
  }

  async function resubmit() {
    setBusy(true);
    setErr(null);
    setOk(false);
    const res = await fetch("/api/profile/kyc-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalFirstName: firstName.trim(),
        legalLastName: lastName.trim(),
        birthDate: birthDate.trim() || null,
        documentNumber: documentNumber.trim() || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(clientErrorText(t, body.error ?? "profile_invalid_input"));
      return;
    }
    router.push("/app/profile/kyc?start=1");
    router.refresh();
  }

  return (
    <section className="fd-card mt-3 space-y-3 p-4">
      <div>
        <p className="text-sm font-bold text-[#1c1917]">{t("kyc_identity_heading")}</p>
        <p className="mt-1 text-xs text-[var(--fd-muted)]">{t("kyc_identity_hint")}</p>
      </div>

      {err ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>
      ) : null}
      {ok ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{t("profile_saved")}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
            {t("kyc_identity_first")}
          </span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`${inputCls} mt-1`}
            maxLength={128}
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
            {t("kyc_identity_last")}
          </span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`${inputCls} mt-1`}
            maxLength={128}
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
            {t("kyc_identity_birth")}
          </span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
            {t("kyc_identity_document")}
          </span>
          <input
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            className={`${inputCls} mt-1`}
            maxLength={64}
          />
        </label>
      </div>

      {identity?.documentType ? (
        <p className="text-[11px] text-[var(--fd-muted)]">
          {t("kyc_identity_doc_type")}: {identity.documentType}
          {identity.documentCountry ? ` · ${identity.documentCountry}` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-xl border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold text-[#1c1917] disabled:opacity-60"
        >
          {busy ? t("profile_avatar_uploading") : t("profile_save")}
        </button>
        {data.canResubmitKyc || data.approved ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void resubmit()}
            className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {t("kyc_identity_resubmit")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
