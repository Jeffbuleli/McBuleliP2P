"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { WithdrawalStatus } from "@/lib/status";
import { withdrawalProgressSteps } from "@/lib/transaction-steps";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import {
  StatusOutcomeBanner,
  TransactionStepper,
} from "@/components/wallet/transaction-progress";
import { FlowHubLink } from "@/components/wallet/wallet-flow-shell";
import { TransactionDetailRows } from "@/components/wallet/transaction-detail-rows";
import { formatSignedWalletAmount } from "@/lib/wallet-history-labels";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";
import { formatWalletFailureReason } from "@/lib/wallet-error-display";
import { totalDebitedFromRow } from "@/lib/withdraw-fees";

type Withdrawal = {
  id: string;
  asset: string;
  networkCanonical: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: string;
  failureReason: string | null;
  txid: string | null;
  createdAt: string;
};

export default function WithdrawActivityDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [w, setW] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/withdrawals/${params.id}`);
    const data = await res.json();
    if (res.ok) setW(data.withdrawal);
    else setW(null);
  }, [params.id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!w) return;
    if (w.status === WithdrawalStatus.COMPLETED || w.status === WithdrawalStatus.REJECTED) {
      return;
    }
    const tmr = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(tmr);
  }, [w, load]);

  if (loading) {
    return (
      <div className="pb-8">
        <WalletSubpageHeader title={t("withdraw_title")} backHref="/app/wallet" />
        <p className="text-center text-[color:var(--fd-muted)]">…</p>
      </div>
    );
  }

  if (!w) {
    return (
      <div className="pb-8">
        <WalletSubpageHeader title={t("withdraw_title")} backHref="/app/wallet" />
        <p className="text-rose-800">—</p>
        <FlowHubLink label={t("wallet_title")} />
      </div>
    );
  }

  const steps = withdrawalProgressSteps(w.status);
  const variant =
    w.status === WithdrawalStatus.COMPLETED
      ? "success"
      : w.status === WithdrawalStatus.REJECTED || w.status === WithdrawalStatus.FAILED
        ? "failed"
        : "pending";

  return (
    <div className="pb-8">
      <WalletSubpageHeader
        title={t("wallet_tx_details")}
        subtitle={`${w.asset} · ${w.id.slice(0, 8)}`}
        backHref={`/app/wallet/${w.asset}`}
      />

      <TransactionStepper steps={steps} />

      {variant !== "pending" ? (
        <div className="mt-3">
          <StatusOutcomeBanner
            variant={variant}
            title={
              variant === "success"
                ? t("status_ui_success")
                : t("status_ui_failed")
            }
            detail={`${formatWalletHistoryAmount(w.asset, w.amount)} ${w.asset}`}
          />
        </div>
      ) : null}

      <TransactionDetailRows
        rows={[
          { label: t("wallet_tx_asset"), value: w.asset },
          { label: t("wallet_tx_type"), value: t("wallet_activity_withdraw") },
          { label: t("deposit_step_usdt_network"), value: w.networkCanonical },
          { label: t("wallet_tx_destination"), value: w.toAddress, mono: true },
          {
            label: t("wallet_tx_amount_net"),
            value: `${formatSignedWalletAmount(w.asset, w.amount, { kind: "withdrawal" })} ${w.asset}`,
          },
          {
            label: t("wallet_tx_fee"),
            value: `${formatWalletHistoryAmount(w.asset, w.fee)} ${w.asset}`,
          },
          {
            label: t("wallet_tx_total_debited"),
            value: `${formatWalletHistoryAmount(w.asset, totalDebitedFromRow(w))} ${w.asset}`,
          },
          ...(w.txid
            ? [{ label: t("wallet_tx_txid"), value: w.txid, mono: true }]
            : []),
          ...(w.failureReason
            ? [
                {
                  label: t("status_ui_failed"),
                  value: formatWalletFailureReason(t, w.failureReason) ?? w.failureReason,
                },
              ]
            : []),
        ]}
      />

      <FlowHubLink label={t("wallet_history_title")} href="/app/wallet/history" />
    </div>
  );
}
