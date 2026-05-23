"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { KYC_STATUS_CHANGED_EVENT } from "@/components/kyc/kyc-status-poller";
import { DiditVerifyButton } from "@/components/kyc/didit-verify-button";
import { KycIllustrationShield } from "@/components/kyc/kyc-progress";
import { profileKycBadgeText } from "@/lib/profile-kyc-label";
import {
  fetchKycStatus,
  refreshKycFromDidit,
  syncKycEvent,
} from "@/lib/kyc-client-sync";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";

function kycPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "approved") return "fd-pill-ok";
  if (s === "pending" || s === "manual_review") return "fd-pill-warn";
  return "fd-pill-muted";
}

export function ProfileSettingsKycPanel({
  initialStatus,
}: {
  userId: string;
  initialStatus: string | null | undefined;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<KycStatusPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const autoRefreshed = useRef(false);

  const load = useCallback(async () => {
    const payload = await fetchKycStatus();
    if (payload) setData(payload);
  }, []);

  const refreshStatus = useCallback(async () => {
    setBusy(true);
    try {
      const payload = await refreshKycFromDidit();
      if (payload) setData(payload);
      else await load();
    } finally {
      setBusy(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<KycStatusPayload>).detail;
      if (detail) setData(detail);
    };
    window.addEventListener(KYC_STATUS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(KYC_STATUS_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    if (!data?.canRefreshStatus || autoRefreshed.current) return;
    if (data.kycStatus !== "pending" && data.kycStatus !== "manual_review") return;
    autoRefreshed.current = true;
    void refreshStatus();
  }, [data?.canRefreshStatus, data?.kycStatus, refreshStatus]);

  const status = data?.kycStatus ?? initialStatus ?? "none";
  const label = profileKycBadgeText(t, status);

  const canShowVerify =
    Boolean(data?.canRetryKyc) && Boolean(data?.didit.configured);

  const verifyHandlers = {
    onStarted: async (d: { sessionId?: string }) => {
      setBusy(true);
      await syncKycEvent("started", d);
      await load();
      setBusy(false);
    },
    onFinished: async (d: { sessionId?: string }) => {
      setBusy(true);
      await syncKycEvent("finished", d);
      const refreshed = await refreshKycFromDidit();
      if (refreshed) setData(refreshed);
      else await load();
      setBusy(false);
    },
    onCancelled: () => void syncKycEvent("cancelled"),
  };

  return (
    <section className="fd-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
          <KycIllustrationShield className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-bold text-[color:var(--fd-text)]">
              {t("profile_settings_kyc")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={kycPillClass(status)}>{label}</span>
              <Link
                href="/app/profile/kyc"
                className="text-[10px] font-semibold text-[color:var(--fd-muted)] underline"
              >
                {t("kyc_full_page_link")}
              </Link>
            </div>
          </div>

          {status === "approved" ? null : canShowVerify ? (
            <div className="space-y-2">
              <p className="text-[10px] text-[color:var(--fd-muted)]">
                {t("profile_settings_kyc_verify_hint")}
              </p>
              <DiditVerifyButton {...verifyHandlers} />
            </div>
          ) : null}

          {status === "pending" || status === "manual_review" ? (
            data?.canRefreshStatus ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void refreshStatus()}
                className="rounded-full border border-[color:var(--fd-border)] bg-white px-3 py-2 text-[10px] font-bold text-[color:var(--fd-primary)] disabled:opacity-50"
              >
                {busy ? "…" : t("kyc_refresh_status")}
              </button>
            ) : null
          ) : null}
        </div>
      </div>
    </section>
  );
}
