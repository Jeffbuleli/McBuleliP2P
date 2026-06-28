"use client";

import Link from "next/link";
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
  const [proposedFirstName, setProposedFirstName] = useState(
    data.identityCorrection?.proposedFirstName ??
      data.legalIdentity?.legalFirstName ??
      "",
  );
  const [proposedLastName, setProposedLastName] = useState(
    data.identityCorrection?.proposedLastName ??
      data.legalIdentity?.legalLastName ??
      "",
  );
  const [correctionNote, setCorrectionNote] = useState(
    data.identityCorrection?.note ?? "",
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
    if (data.identityCorrection?.proposedFirstName) {
      setProposedFirstName(data.identityCorrection.proposedFirstName);
    }
    if (data.identityCorrection?.proposedLastName) {
      setProposedLastName(data.identityCorrection.proposedLastName);
    }
    if (data.identityCorrection?.note) {
      setCorrectionNote(data.identityCorrection.note);
    }
  }, [data.legalIdentity, data.identityCorrection]);

  const showPanel =
    data.approved ||
    data.canResubmitKyc ||
    Boolean(identity?.legalFirstName || identity?.legalLastName);

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

  const verificationInProgress =
    data.kycStatus === "pending" || data.kycStatus === "manual_review";
  const patchBlocked = data.approved || verificationInProgress;
  const canSaveDraft = !patchBlocked;
  const fieldsReadOnly = verificationInProgress || data.approved;
  const correction = data.identityCorrection;

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

  async function requestCorrection() {
    setBusy(true);
    setErr(null);
    setOk(false);
    const res = await fetch("/api/profile/kyc-identity/correction-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedFirstName: proposedFirstName.trim(),
        proposedLastName: proposedLastName.trim(),
        note: correctionNote.trim() || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(clientErrorText(t, body.error ?? "profile_invalid_input"));
      return;
    }
    setOk(true);
    onUpdated();
  }

  return (
    <section className="fd-card mt-3 space-y-3 p-4">
      <div>
        <p className="text-sm font-bold text-[#1c1917]">{t("kyc_identity_heading")}</p>
        <p className="mt-1 text-xs text-[var(--fd-muted)]">
          {data.approved
            ? t("kyc_identity_approved_ops_hint")
            : patchBlocked
              ? t("kyc_identity_locked_hint")
              : t("kyc_identity_hint")}
        </p>
      </div>

      {verificationInProgress ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("kyc_identity_locked")}
        </p>
      ) : null}

      {correction?.status === "requested" ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("kyc_identity_correction_pending")}
        </p>
      ) : null}

      {correction?.status === "reverification" || data.identityReverificationPending ? (
        <div className="space-y-2 rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-3 text-xs text-sky-950">
          <p className="font-semibold">{t("kyc_identity_reverification_heading")}</p>
          <p>{t("kyc_identity_reverification_hint")}</p>
          <Link
            href="/app/profile/kyc?start=1"
            className="inline-flex rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-xs font-semibold text-white"
          >
            {t("kyc_identity_reverification_cta")}
          </Link>
        </div>
      ) : null}

      {correction?.status === "corrected" ? (
        <p className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          {t("kyc_identity_correction_done")}
        </p>
      ) : null}

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
            readOnly={fieldsReadOnly}
            disabled={fieldsReadOnly}
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
            readOnly={fieldsReadOnly}
            disabled={fieldsReadOnly}
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
            readOnly={fieldsReadOnly}
            disabled={fieldsReadOnly}
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
            readOnly={fieldsReadOnly}
            disabled={fieldsReadOnly}
          />
        </label>
      </div>

      {identity?.documentType ? (
        <p className="text-[11px] text-[var(--fd-muted)]">
          {t("kyc_identity_doc_type")}: {identity.documentType}
          {identity.documentCountry ? ` · ${identity.documentCountry}` : ""}
        </p>
      ) : null}

      {data.approved && data.canRequestIdentityCorrection ? (
        <div className="space-y-3 rounded-xl border border-sky-200/80 bg-sky-50/60 p-3">
          <p className="text-xs font-semibold text-sky-950">
            {t("kyc_identity_correction_request_heading")}
          </p>
          <p className="text-[11px] text-sky-900">{t("kyc_identity_correction_request_hint")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
                {t("kyc_identity_correction_proposed_first")}
              </span>
              <input
                value={proposedFirstName}
                onChange={(e) => setProposedFirstName(e.target.value)}
                className={`${inputCls} mt-1`}
                maxLength={128}
                required
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
                {t("kyc_identity_correction_proposed_last")}
              </span>
              <input
                value={proposedLastName}
                onChange={(e) => setProposedLastName(e.target.value)}
                className={`${inputCls} mt-1`}
                maxLength={128}
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("kyc_identity_correction_note")}
            </span>
            <textarea
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              className={`${inputCls} mt-1 min-h-[4rem] resize-y`}
              maxLength={500}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void requestCorrection()}
            className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {t("kyc_identity_correction_request_btn")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canSaveDraft ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-xl border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold text-[#1c1917] disabled:opacity-60"
          >
            {busy ? t("profile_avatar_uploading") : t("profile_save")}
          </button>
        ) : null}
        {data.canResubmitKyc ? (
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
