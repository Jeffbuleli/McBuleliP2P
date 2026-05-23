"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  KycIllustrationError,
  KycIllustrationFace,
  KycIllustrationId,
  KycIllustrationReview,
  KycIllustrationShield,
  KycProgressBar,
  type KycProgressStep,
} from "@/components/kyc/kyc-progress";
import { MetamapVerifyButton } from "@/components/kyc/metamap-verify-button";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";

async function syncKyc(
  event: "started" | "finished" | "exited",
  detail?: { identityId?: string; verificationId?: string },
) {
  await fetch("/api/kyc/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      identityId: detail?.identityId,
      verificationId: detail?.verificationId,
    }),
  });
}

function stepState(
  idx: number,
  activeIdx: number,
  status: string,
): KycProgressStep["state"] {
  if (status === "approved" && idx <= 3) return "done";
  if (idx < activeIdx) return "done";
  if (idx === activeIdx) return "active";
  return "upcoming";
}

function heroIllustration(status: string, activeIdx: number, sdkError: boolean) {
  if (sdkError) {
    return <KycIllustrationError className="h-16 w-16 text-rose-600" />;
  }
  if (status === "approved") {
    return <KycIllustrationShield className="h-16 w-16 text-emerald-700" />;
  }
  if (status === "pending" || status === "manual_review") {
    return <KycIllustrationReview className="h-16 w-16 text-amber-800" />;
  }
  if (status === "rejected") {
    return <KycIllustrationId className="h-16 w-16 text-rose-700" />;
  }
  if (activeIdx >= 3) {
    return <KycIllustrationReview className="h-16 w-16 text-[color:var(--fd-primary)]" />;
  }
  if (activeIdx >= 2) {
    return <KycIllustrationFace className="h-16 w-16 text-[color:var(--fd-primary)]" />;
  }
  if (activeIdx >= 1) {
    return <KycIllustrationId className="h-16 w-16 text-[color:var(--fd-primary)]" />;
  }
  return <KycIllustrationShield className="h-16 w-16 text-[color:var(--fd-primary)]" />;
}

function StatusBox({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "ok" | "pending" | "reject";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "pending"
        ? "border-amber-200 bg-amber-50"
        : "border-rose-200 bg-rose-50";
  return (
    <div className={`mt-5 flex justify-center rounded-2xl border px-4 py-4 ${cls}`}>
      {children}
    </div>
  );
}

export function KycFlowPanel({
  userId,
  initialData,
}: {
  userId: string;
  initialData?: KycStatusPayload | null;
}) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<KycStatusPayload | null>(initialData ?? null);
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadErr(false);
    const res = await fetch("/api/kyc/status", {
      cache: "no-store",
      credentials: "include",
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setData(j as KycStatusPayload);
      return;
    }
    setLoadErr(true);
  }, []);

  useEffect(() => {
    if (!initialData) void load();
  }, [initialData, load]);

  const status = data?.kycStatus ?? "none";
  const activeIdx =
    status === "approved"
      ? 4
      : status === "pending" || status === "manual_review"
        ? 3
        : status === "rejected"
          ? 1
          : 1;

  const steps: KycProgressStep[] = useMemo(
    () => [
      {
        id: "prep",
        label: t("kyc_step_prep"),
        icon: <KycIllustrationShield className="h-7 w-7" />,
        state: stepState(0, activeIdx, status),
      },
      {
        id: "id",
        label: t("kyc_step_id"),
        icon: <KycIllustrationId className="h-7 w-7" />,
        state: stepState(1, activeIdx, status),
      },
      {
        id: "face",
        label: t("kyc_step_face"),
        icon: <KycIllustrationFace className="h-7 w-7" />,
        state: stepState(2, activeIdx, status),
      },
      {
        id: "review",
        label: t("kyc_step_review"),
        icon: <KycIllustrationReview className="h-7 w-7" />,
        state: stepState(3, activeIdx, status),
      },
    ],
    [activeIdx, status, t],
  );

  const canVerify =
    data?.inCorridorCountry &&
    data.metamap.configured &&
    data.metamap.clientId &&
    data.metamap.flowId &&
    !data.approved &&
    status !== "pending" &&
    status !== "manual_review";

  const lang = locale === "fr" ? "fr" : "en";
  const metadata = useMemo(() => ({ userId, fixedLanguage: lang }), [userId, lang]);

  if (!data) {
    return (
      <div className="fd-card p-5 text-center">
        {loadErr ? (
          <>
            <KycIllustrationError className="mx-auto h-12 w-12 text-rose-500" />
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-full bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-bold text-white"
            >
              {t("kyc_retry")}
            </button>
          </>
        ) : (
          <p className="text-sm text-[color:var(--fd-muted)]">…</p>
        )}
      </div>
    );
  }

  if (!data.enabled) {
    return (
      <div className="fd-card p-5 text-center">
        <KycIllustrationShield className="mx-auto h-16 w-16 text-[color:var(--fd-muted)]" />
      </div>
    );
  }

  if (!data.inCorridorCountry) {
    return (
      <div className="fd-card p-5 text-center">
        <KycIllustrationShield className="mx-auto h-16 w-16 text-[color:var(--fd-muted)]" />
        <Link
          href="/app/profile/settings"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-[color:var(--fd-mint)] px-3 py-1.5 text-[10px] font-bold text-[color:var(--fd-primary)]"
        >
          {t("kyc_set_country")}
        </Link>
      </div>
    );
  }

  return (
    <div className="fd-card overflow-hidden p-5">
      <div className="mb-4 flex justify-center">
        <span className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-[color:var(--fd-mint)]/50">
          {heroIllustration(status, activeIdx, Boolean(sdkError))}
        </span>
      </div>

      <KycProgressBar steps={steps} hideLabels />

      {data.approved ? (
        <StatusBox tone="ok">
          <KycIllustrationShield className="h-14 w-14 text-emerald-700" />
        </StatusBox>
      ) : status === "pending" || status === "manual_review" ? (
        <StatusBox tone="pending">
          <KycIllustrationReview className="h-14 w-14 text-amber-800" />
        </StatusBox>
      ) : status === "rejected" ? (
        <StatusBox tone="reject">
          <KycIllustrationId className="h-14 w-14 text-rose-700" />
        </StatusBox>
      ) : canVerify ? (
        <div className="mt-5 space-y-3">
          {sdkError ? (
            <StatusBox tone="reject">
              <KycIllustrationError className="h-12 w-12 text-rose-600" />
            </StatusBox>
          ) : null}
          <MetamapVerifyButton
            clientId={data.metamap.clientId!}
            flowId={data.metamap.flowId!}
            metadata={metadata}
            language={lang}
            onStarted={async (d) => {
              setSdkError(null);
              setBusy(true);
              await syncKyc("started", d);
              await load();
              setBusy(false);
            }}
            onFinished={async (d) => {
              setSdkError(null);
              setBusy(true);
              await syncKyc("finished", d);
              await load();
              setBusy(false);
            }}
            onExited={() => void syncKyc("exited")}
            onError={(screen) => setSdkError(screen ?? "commonError")}
          />
          {sdkError === "ipRestrictions" ? (
            <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
              {t("kyc_sdk_domain_hint")}
            </p>
          ) : sdkError ? (
            <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
              {t("kyc_sdk_error")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-center text-[10px] text-rose-700">
          {t("kyc_metamap_not_configured")}
        </p>
      )}

      {busy ? (
        <p className="mt-3 text-center text-[10px] text-[color:var(--fd-muted)]">…</p>
      ) : null}
    </div>
  );
}
