"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { DiditVerifyButton } from "@/components/kyc/didit-verify-button";
import {
  KycHeroScene,
  KycIconFace,
  KycIconId,
  KycIconProfile,
  KycIconReview,
  kycUiPhase,
  type KycUiPhase,
} from "@/components/kyc/kyc-illustrations";
import { KycIllustrationError, KycProgressBar, type KycProgressStep } from "@/components/kyc/kyc-progress";
import { KYC_STATUS_CHANGED_EVENT } from "@/components/kyc/kyc-status-poller";
import {
  diditKycActiveStepIndex,
  diditKycStepState,
  normalizeDiditSessionStatus,
} from "@/lib/didit/session-status";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";
import {
  fetchKycStatus,
  refreshKycFromDidit,
  syncKycEvent,
} from "@/lib/kyc-client-sync";
import type { Messages } from "@/i18n/messages";

function statusHeadline(
  t: (k: keyof Messages) => string,
  phase: KycUiPhase,
  activeStepLabel: string | null,
): string | null {
  if (phase === "in_sdk" && activeStepLabel) return activeStepLabel;
  if (phase === "success") return t("kyc_state_verified");
  if (phase === "waiting" || phase === "review") return t("kyc_state_pending");
  if (phase === "blocked") return t("kyc_state_blocked");
  if (phase === "error") return t("kyc_state_error");
  if (phase === "start") return t("kyc_state_start");
  return null;
}

export function KycFlowPanel({
  initialData,
  autoStartSdk = false,
}: {
  userId: string;
  initialData?: KycStatusPayload | null;
  autoStartSdk?: boolean;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<KycStatusPayload | null>(initialData ?? null);
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const autoRefreshed = useRef(false);

  const load = useCallback(async () => {
    setLoadErr(false);
    const payload = await fetchKycStatus();
    if (payload) {
      setData(payload);
      return;
    }
    setLoadErr(true);
  }, []);

  const refreshFromDidit = useCallback(async () => {
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
    if (!initialData) void load();
  }, [initialData, load]);

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
    void refreshFromDidit();
  }, [data?.canRefreshStatus, data?.kycStatus, refreshFromDidit]);

  const status = data?.kycStatus ?? "none";
  const diditStatus = normalizeDiditSessionStatus(data?.diditSessionStatus);
  const hasSession = Boolean(data?.diditSessionId?.trim());

  const phase = kycUiPhase({
    status,
    sdkError,
    sanctionsBlocked: Boolean(data?.sanctionsBlocked),
    diditSessionStatus: data?.diditSessionStatus,
    hasSession,
  });

  const activeIdx = Math.min(
    3,
    diditKycActiveStepIndex({
      kycStatus: status,
      diditSessionStatus: diditStatus,
      hasSession,
    }),
  );

  const steps: KycProgressStep[] = useMemo(
    () => [
      {
        id: "profile",
        label: t("kyc_step_profile"),
        icon: <KycIconProfile className="h-6 w-6" />,
        state: diditKycStepState(0, activeIdx, status, diditStatus),
      },
      {
        id: "id",
        label: t("kyc_step_id"),
        icon: <KycIconId className="h-6 w-6" />,
        state: diditKycStepState(1, activeIdx, status, diditStatus),
      },
      {
        id: "liveness",
        label: t("kyc_step_liveness"),
        icon: <KycIconFace className="h-6 w-6" />,
        state: diditKycStepState(2, activeIdx, status, diditStatus),
      },
      {
        id: "decision",
        label: t("kyc_step_decision"),
        icon: <KycIconReview className="h-6 w-6" />,
        state: diditKycStepState(3, activeIdx, status, diditStatus),
      },
    ],
    [activeIdx, diditStatus, status, t],
  );

  const activeStepLabel = steps.find((s) => s.state === "active")?.label ?? null;
  const headline = statusHeadline(t, phase, activeStepLabel);

  const canShowVerify = Boolean(data?.canRetryKyc) && Boolean(data?.didit.configured);
  const awaitingDecision =
    phase === "waiting" ||
    phase === "review" ||
    diditStatus === "In Review";

  const showVerify = canShowVerify && (phase === "start" || phase === "error");
  const showContinue =
    canShowVerify && !showVerify && !awaitingDecision && (phase === "in_sdk" || status === "pending");
  const showRefresh = Boolean(data?.canRefreshStatus) && awaitingDecision;

  const verifyHandlers = {
    onStarted: async (d: { sessionId?: string; sessionStatus?: string }) => {
      setSdkError(false);
      setBusy(true);
      await syncKycEvent("started", d);
      await load();
      setBusy(false);
    },
    onFinished: async (d: { sessionId?: string; sessionStatus?: string }) => {
      setSdkError(false);
      setBusy(true);
      await syncKycEvent("finished", d);
      const refreshed = await refreshKycFromDidit();
      if (refreshed) setData(refreshed);
      else await load();
      setBusy(false);
    },
    onCancelled: () => void syncKycEvent("cancelled"),
    onError: () => setSdkError(true),
  };

  if (!data) {
    return (
      <div className="fd-card flex min-h-[280px] flex-col items-center justify-center p-8">
        {loadErr ? (
          <>
            <KycIllustrationError className="h-16 w-16 text-rose-500" />
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-full bg-[color:var(--fd-primary)] px-5 py-2.5 text-xs font-bold text-white"
            >
              {t("kyc_retry")}
            </button>
          </>
        ) : (
          <div className="h-28 w-28 animate-pulse rounded-[2rem] bg-[color:var(--fd-mint)]/40" />
        )}
      </div>
    );
  }

  if (!data.enabled) {
    return (
      <div className="fd-card flex min-h-[240px] flex-col items-center justify-center p-8">
        <KycHeroScene phase="start" />
        <p className="mt-4 text-center text-xs text-[color:var(--fd-muted)]">{t("kyc_off_title")}</p>
      </div>
    );
  }

  if (!data.inCorridorCountry) {
    return (
      <div className="fd-card flex min-h-[240px] flex-col items-center justify-center p-8">
        <KycHeroScene phase="start" />
        <p className="mt-4 text-center text-xs text-[color:var(--fd-muted)]">
          {t("kyc_not_required_country")}
        </p>
        <Link
          href="/app/profile/settings"
          className="mt-3 rounded-full bg-[color:var(--fd-mint)] px-4 py-2 text-[10px] font-bold text-[color:var(--fd-primary)]"
        >
          {t("kyc_set_country")}
        </Link>
      </div>
    );
  }

  const heroBg =
    phase === "success"
      ? "from-emerald-50 to-white"
      : phase === "blocked" || phase === "error"
        ? "from-rose-50/80 to-white"
        : phase === "waiting" || phase === "review"
          ? "from-amber-50/70 to-white"
          : "from-[color:var(--fd-mint)]/35 to-white";

  return (
    <div className="fd-card overflow-hidden">
      <div className={`bg-gradient-to-b ${heroBg} px-6 pb-2 pt-8`}>
        <KycHeroScene phase={phase} activeStepIndex={activeIdx} className="mx-auto" />
        {headline ? (
          <p className="mt-4 text-center text-sm font-bold tracking-tight text-[color:var(--fd-text)]">
            {headline}
          </p>
        ) : (
          <div className="mt-4 h-5" aria-hidden />
        )}
        {phase === "blocked" && data.rejectionNote ? (
          <p className="mt-1 line-clamp-2 text-center text-[10px] text-rose-700/90">
            {data.rejectionNote}
          </p>
        ) : null}
      </div>

      <div className="px-5 pb-6 pt-2">
        <KycProgressBar steps={steps} labelActiveOnly />

        <div className="mt-6 flex flex-col items-center gap-3">
          {showVerify ? (
            <DiditVerifyButton autoStart={autoStartSdk && phase === "start"} {...verifyHandlers} />
          ) : null}

          {showContinue ? (
            <DiditVerifyButton variant="continue" {...verifyHandlers} />
          ) : null}

          {showRefresh ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void refreshFromDidit()}
              className="rounded-full border border-[color:var(--fd-border)] bg-white px-5 py-2.5 text-[11px] font-bold text-[color:var(--fd-primary)] disabled:opacity-50"
            >
              {busy ? "…" : t("kyc_refresh_status")}
            </button>
          ) : null}

          {!data.didit.configured && phase === "start" ? (
            <p className="text-center text-[10px] text-rose-700">{t("kyc_not_configured")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
