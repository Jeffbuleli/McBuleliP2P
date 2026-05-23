"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  KycIllustrationFace,
  KycIllustrationId,
  KycIllustrationReview,
  KycIllustrationShield,
  KycProgressBar,
  type KycProgressStep,
} from "@/components/kyc/kyc-progress";
import { MetamapVerifyButton } from "@/components/kyc/metamap-verify-button";

type KycStatusPayload = {
  enabled: boolean;
  corridor: boolean;
  kycStatus: string;
  approved: boolean;
  countryCode: string | null;
  rejectionNote: string | null;
  metamap: { configured: boolean; clientId: string | null; flowId: string | null };
};

async function syncKyc(
  event: "started" | "finished" | "exited",
  detail?: { identityId?: string; verificationId?: string },
) {
  await fetch("/api/kyc/sync", {
    method: "POST",
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

export function KycFlowPanel({ userId }: { userId: string }) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<KycStatusPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/kyc/status", { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setData(j as KycStatusPayload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        icon: <KycIllustrationShield className="h-5 w-5" />,
        state: stepState(0, activeIdx, status),
      },
      {
        id: "id",
        label: t("kyc_step_id"),
        icon: <KycIllustrationId className="h-5 w-5" />,
        state: stepState(1, activeIdx, status),
      },
      {
        id: "face",
        label: t("kyc_step_face"),
        icon: <KycIllustrationFace className="h-5 w-5" />,
        state: stepState(2, activeIdx, status),
      },
      {
        id: "review",
        label: t("kyc_step_review"),
        icon: <KycIllustrationReview className="h-5 w-5" />,
        state: stepState(3, activeIdx, status),
      },
    ],
    [activeIdx, status, t],
  );

  const canVerify =
    data?.corridor &&
    data.metamap.configured &&
    data.metamap.clientId &&
    data.metamap.flowId &&
    !data.approved &&
    status !== "pending" &&
    status !== "manual_review";

  const lang = locale === "fr" ? "fr" : "en";

  if (!data) {
    return <p className="text-sm text-[color:var(--fd-muted)]">…</p>;
  }

  if (!data.enabled) {
    return (
      <div className="fd-card p-4 text-center">
        <KycIllustrationShield className="mx-auto h-12 w-12 text-[color:var(--fd-muted)]" />
        <p className="mt-3 text-sm font-semibold text-[color:var(--fd-text)]">{t("kyc_off_title")}</p>
      </div>
    );
  }

  if (!data.corridor) {
    return (
      <div className="fd-card p-4 text-center">
        <KycIllustrationShield className="mx-auto h-12 w-12 text-[color:var(--fd-muted)]" />
        <p className="mt-3 text-sm font-semibold">{t("kyc_not_required_country")}</p>
        <Link
          href="/app/profile/settings"
          className="mt-2 inline-block text-xs font-bold text-[color:var(--fd-primary)] underline"
        >
          {t("kyc_set_country")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="fd-card overflow-hidden p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
            <KycIllustrationShield className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("kyc_page_title")}</p>
            <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">{t("kyc_page_sub")}</p>
          </div>
        </div>

        <KycProgressBar steps={steps} />

        {data.approved ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <KycIllustrationShield className="mx-auto h-10 w-10 text-emerald-700" />
            <p className="mt-2 text-sm font-bold text-emerald-900">{t("kyc_approved_banner")}</p>
          </div>
        ) : status === "pending" || status === "manual_review" ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <KycIllustrationReview className="mx-auto h-10 w-10 text-amber-800" />
            <p className="mt-2 text-sm font-bold text-amber-900">{t("kyc_pending_banner")}</p>
          </div>
        ) : status === "rejected" ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
            <p className="text-sm font-bold text-rose-900">{t("kyc_rejected_banner")}</p>
            {data.rejectionNote ? (
              <p className="mt-1 text-[10px] text-rose-800">{data.rejectionNote}</p>
            ) : null}
          </div>
        ) : canVerify ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            <MetamapVerifyButton
              clientId={data.metamap.clientId!}
              flowId={data.metamap.flowId!}
              metadata={{ userId, fixedLanguage: lang }}
              language={lang}
              onStarted={async (d) => {
                setBusy(true);
                await syncKyc("started", d);
                setInfo(t("kyc_started_toast"));
                await load();
                setBusy(false);
              }}
              onFinished={async (d) => {
                setBusy(true);
                await syncKyc("finished", d);
                setInfo(t("kyc_finished_toast"));
                await load();
                setBusy(false);
              }}
              onExited={() => void syncKyc("exited")}
            />
            <p className="text-[10px] text-[color:var(--fd-muted)]">{t("kyc_metamap_hint")}</p>
          </div>
        ) : (
          <p className="mt-4 text-center text-xs text-rose-700">{t("kyc_metamap_not_configured")}</p>
        )}

        {info ? (
          <p className="mt-3 text-center text-xs font-semibold text-emerald-800" role="status">
            {info}
          </p>
        ) : null}
        {busy ? (
          <p className="mt-2 text-center text-[10px] text-[color:var(--fd-muted)]">…</p>
        ) : null}
      </div>

      <div className="fd-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("kyc_gated_title")}
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-semibold text-[color:var(--fd-text)]">
          <li className="rounded-lg bg-stone-50 px-2 py-1.5">↗ {t("kyc_gate_withdraw")}</li>
          <li className="rounded-lg bg-stone-50 px-2 py-1.5">⇄ {t("kyc_gate_transfer")}</li>
          <li className="rounded-lg bg-stone-50 px-2 py-1.5">P2P {t("kyc_gate_p2p")}</li>
          <li className="rounded-lg bg-stone-50 px-2 py-1.5">₿ {t("kyc_gate_trade")}</li>
          <li className="rounded-lg bg-stone-50 px-2 py-1.5">👥 {t("kyc_gate_groups")}</li>
          <li className="rounded-lg bg-stone-50 px-2 py-1.5">📱 {t("kyc_gate_fiat")}</li>
        </ul>
      </div>
    </div>
  );
}
