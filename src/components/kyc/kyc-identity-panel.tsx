"use client";

import { useI18n } from "@/components/i18n-provider";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";

/** Read-only legal identity from Didit OCR — no local name editing. */
export function KycIdentityPanel({ data }: { data: KycStatusPayload }) {
  const { t } = useI18n();
  const identity = data.legalIdentity;
  if (!identity?.legalFirstName && !identity?.legalLastName) return null;

  return (
    <section className="fd-card mt-3 space-y-3 p-4">
      <div>
        <p className="text-sm font-bold text-[#1c1917]">{t("kyc_identity_heading")}</p>
        <p className="mt-1 text-xs text-[var(--fd-muted)]">
          {t("kyc_identity_readonly_hint")}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <p className="text-sm">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
            {t("kyc_identity_first")}
          </span>
          <br />
          {identity.legalFirstName ?? "—"}
        </p>
        <p className="text-sm">
          <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
            {t("kyc_identity_last")}
          </span>
          <br />
          {identity.legalLastName ?? "—"}
        </p>
        {identity.birthDate ? (
          <p className="text-sm">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("kyc_identity_birth")}
            </span>
            <br />
            {identity.birthDate}
          </p>
        ) : null}
        {identity.documentNumber ? (
          <p className="text-sm">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("kyc_identity_document")}
            </span>
            <br />
            {identity.documentNumber}
          </p>
        ) : null}
      </div>

      {identity.documentType ? (
        <p className="text-[11px] text-[var(--fd-muted)]">
          {t("kyc_identity_doc_type")}: {identity.documentType}
          {identity.documentCountry ? ` · ${identity.documentCountry}` : ""}
        </p>
      ) : null}
    </section>
  );
}
