"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ErrorBanner,
  FormCard,
  primaryBtnClass,
} from "@/components/forms/standard-form";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconBankCard, IconMobileMoney } from "@/components/wallet/fiat-icons";
import { StatusPill } from "@/components/wallet/transaction-progress";

type Tx = {
  reference: string;
  kind: "deposit" | "payout";
  status: "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED";
  currency: string;
  amount: string;
  provider: string | null;
  failureMessage: string | null;
  meta?: Record<string, unknown> | null;
};

const STEPS = [
  { id: "init", label: "Init" },
  { id: "wait", label: "Wait" },
  { id: "done", label: "Done" },
];

export default function WalletFiatTxStatusPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [tx, setTx] = useState<Tx | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  const rail = tx?.meta?.rail === "card" || tx?.provider === "card" ? "card" : "momo";
  const title =
    tx?.kind === "payout"
      ? t("wallet_fiat_withdraw_title")
      : rail === "card"
        ? t("wallet_fiat_card_deposit_title")
        : t("wallet_fiat_deposit_title");

  const stepIndex = useMemo(() => {
    if (!tx) return 0;
    if (tx.status === "COMPLETED" || tx.status === "FAILED") return 2;
    return 1;
  }, [tx]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function fetchOnce(refresh: boolean) {
      const url = `/api/wallet/fiat/tx/${encodeURIComponent(id!)}${refresh ? "?refresh=1" : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (!cancelled) {
          setErr(typeof data?.error === "string" ? data.error : "wallet_fiat_withdraw_failed");
          setPolling(false);
        }
        return;
      }
      if (!cancelled) {
        setTx(data.tx as Tx);
        setErr(null);
        const st = (data.tx as Tx).status;
        if (st === "COMPLETED" || st === "FAILED") setPolling(false);
      }
    }

    async function loop() {
      await fetchOnce(true);
      if (cancelled) return;
      timer = setTimeout(loop, 3000);
    }

    void loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const pill =
    tx?.status === "COMPLETED"
      ? { variant: "success" as const, label: t("wallet_fiat_status_completed") }
      : tx?.status === "FAILED"
        ? { variant: "failed" as const, label: t("wallet_fiat_status_failed") }
        : { variant: "processing" as const, label: t("wallet_fiat_status_pending_title") };

  return (
    <div className="wallet-theme pb-10">
      <WalletSubpageHeader title={title} backHref="/app/wallet/fiat" />

      <FormCard>
        <div className="mb-3 flex items-center gap-2 text-[color:var(--fd-primary)]">
          {rail === "card" ? <IconBankCard /> : <IconMobileMoney />}
          <StatusPill variant={pill.variant} label={pill.label} />
        </div>

        <FiatStepper
          steps={STEPS.map((s, i) => ({
            id: s.id,
            label: [t("wallet_fiat_step_init"), t("wallet_fiat_step_wait"), t("wallet_fiat_step_done")][i]!,
          }))}
          current={stepIndex}
        />

        {tx ? (
          <div className="rounded-2xl bg-[color:var(--fd-mint)]/40 p-3 text-sm tabular-nums">
            <p className="font-bold">
              {tx.amount} {tx.currency}
            </p>
            {typeof tx.meta?.providerLabel === "string" ? (
              <p className="text-[color:var(--fd-muted)]">{tx.meta.providerLabel}</p>
            ) : null}
          </div>
        ) : null}

        {tx?.status === "PROCESSING" || tx?.status === "INITIATED" ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("wallet_fiat_status_pending_body")}</p>
        ) : null}

        {err ? <ErrorBanner>{clientErrorText(t, err)}</ErrorBanner> : null}

        <div className="flex gap-2">
          <button
            type="button"
            className={primaryBtnClass}
            onClick={() => router.refresh()}
            disabled={!id}
          >
            {polling ? t("wallet_fiat_status_refreshing") : t("wallet_fiat_status_refresh")}
          </button>
          <Link className={primaryBtnClass} href="/app/wallet/history?category=fiat">
            {t("wallet_fiat_status_history")}
          </Link>
        </div>
      </FormCard>
    </div>
  );
}
