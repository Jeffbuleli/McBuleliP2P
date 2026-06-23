"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { DepositStatus } from "@/lib/status";
import { depositProgressSteps } from "@/lib/transaction-steps";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import {
  StatusOutcomeBanner,
  TransactionStepper,
} from "@/components/wallet/transaction-progress";
import { FlowHubLink, FlowPrimaryBtn } from "@/components/wallet/wallet-flow-shell";
import { TransactionDetailRows } from "@/components/wallet/transaction-detail-rows";
import { formatSignedWalletAmount } from "@/lib/wallet-history-labels";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import { cryptoDepositDetailHref } from "@/lib/wallet-money-routes";
import type { Locale } from "@/i18n/locale";

type Deposit = {
  id: string;
  asset: string;
  networkCanonical: string;
  addressShown: string;
  status: string;
  failureReason: string | null;
  txid: string | null;
  amount: string | null;
  declaredAmountUsdt: string | null;
  userNote: string | null;
  provider: string;
  createdAt: string;
};

function depositStatusLabel(
  t: (k: keyof import("@/i18n/messages").Messages) => string,
  status: string,
  autoDetect: boolean,
): string {
  if (status === DepositStatus.AWAITING_TRANSFER) {
    return autoDetect ? t("deposit_status_scanning") : t("deposit_status_awaiting_transfer");
  }
  if (status === DepositStatus.AWAITING_TXID) return t("deposit_status_awaiting_txid");
  if (status === DepositStatus.PENDING_VALIDATION) return t("deposit_status_pending_validation");
  if (status === DepositStatus.EXPIRED_PENDING_SCAN) return t("deposit_status_expired_pending_scan");
  if (status === DepositStatus.CONFIRMED) return t("deposit_status_confirmed");
  if (status === DepositStatus.FAILED) return t("deposit_status_failed");
  return status;
}

export default function DepositActivityDetailPage() {
  const { t, locale } = useI18n();
  const loc = locale as Locale;
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [txid, setTxid] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deposits/${params.id}`);
    const data = await res.json();
    if (res.ok) setDeposit(data.deposit);
    else setDeposit(null);
  }, [params.id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!deposit) return;
    if (deposit.status === DepositStatus.CONFIRMED || deposit.status === DepositStatus.FAILED) {
      return;
    }
    const tmr = window.setInterval(() => void load(), 12_000);
    return () => window.clearInterval(tmr);
  }, [deposit, load]);

  async function submitTxid() {
    if (!deposit) return;
    setMsg(null);
    const res = await fetch(`/api/deposits/${deposit.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txid }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.status === "confirmed" || data.status === "failed" || data.status === "pending") {
      await load();
      setTxid("");
      return;
    }
    setMsg(data.message ?? data.error ?? "—");
  }

  if (loading) {
    return (
      <div className="pb-8">
        <WalletSubpageHeader title={t("wallet_tx_details")} backHref="/app/wallet/history" />
        <p className="text-center text-[color:var(--fd-muted)]">…</p>
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="pb-8">
        <WalletSubpageHeader title={t("wallet_tx_details")} backHref="/app/wallet/history" />
        <p className="text-rose-800">—</p>
        <FlowHubLink label={t("wallet_history_title")} href="/app/wallet/history" />
      </div>
    );
  }

  const autoDetect =
    deposit.provider === "binance" &&
    deposit.asset === "USDT" &&
    deposit.status === DepositStatus.AWAITING_TRANSFER;
  const steps = depositProgressSteps(deposit.status, { autoDetect });
  const displayAmount =
    deposit.amount?.toString() ||
    deposit.declaredAmountUsdt?.toString() ||
    "0";
  const variant =
    deposit.status === DepositStatus.CONFIRMED
      ? "success"
      : deposit.status === DepositStatus.FAILED
        ? "failed"
        : "pending";
  const network = activityNetworkLabel(loc, deposit.networkCanonical);
  const needsAddress =
    deposit.status === DepositStatus.AWAITING_TRANSFER ||
    deposit.status === DepositStatus.EXPIRED_PENDING_SCAN;
  const showTxid = deposit.status === DepositStatus.AWAITING_TXID;

  return (
    <div className="pb-8">
      <WalletSubpageHeader
        title={t("wallet_tx_details")}
        subtitle={`${deposit.asset} · ${deposit.id.slice(0, 8)}`}
        backHref="/app/wallet/history"
      />

      <TransactionStepper steps={steps} />

      {variant !== "pending" ? (
        <div className="mt-3">
          <StatusOutcomeBanner
            variant={variant}
            title={
              variant === "success"
                ? t("deposit_confirmed")
                : t("deposit_failed")
            }
            detail={`${formatSignedWalletAmount(deposit.asset, displayAmount, { kind: "deposit" })} ${deposit.asset}`}
          />
        </div>
      ) : (
        <p className="mt-3 text-center text-sm font-semibold text-[color:var(--fd-primary)]">
          {depositStatusLabel(t, deposit.status, autoDetect)}
        </p>
      )}

      <TransactionDetailRows
        rows={[
          { label: t("wallet_tx_asset"), value: deposit.asset },
          { label: t("wallet_tx_type"), value: t("wallet_activity_deposit") },
          { label: t("wallet_tx_network"), value: network },
          {
            label: t("wallet_tx_amount"),
            value: `${formatSignedWalletAmount(deposit.asset, displayAmount, { kind: "deposit" })} ${deposit.asset}`,
          },
          { label: t("wallet_tx_destination"), value: deposit.addressShown, mono: true },
          ...(deposit.txid
            ? [{ label: t("wallet_tx_txid"), value: deposit.txid, mono: true }]
            : []),
          ...(deposit.userNote
            ? [{ label: t("deposit_pi_memo_label"), value: deposit.userNote }]
            : []),
          ...(deposit.failureReason
            ? [{ label: t("status_ui_failed"), value: deposit.failureReason }]
            : []),
        ]}
      />

      {needsAddress ? (
        <div className="mt-4">
          <FlowPrimaryBtn onClick={() => router.push(cryptoDepositDetailHref(deposit.id))}>
            {t("deposit_show_addr")}
          </FlowPrimaryBtn>
        </div>
      ) : null}

      {showTxid ? (
        <div className="fd-card mt-4 space-y-3 p-4">
          <label className="block text-sm font-semibold text-[color:var(--fd-text)]">
            {t("deposit_txid")}
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
            />
          </label>
          <FlowPrimaryBtn
            disabled={txid.trim().length < 8}
            onClick={() => void submitTxid()}
          >
            {t("deposit_submit")}
          </FlowPrimaryBtn>
        </div>
      ) : null}

      {msg ? (
        <p className="mt-2 text-center text-sm font-semibold text-rose-800">{msg}</p>
      ) : null}

      <FlowHubLink label={t("wallet_history_title")} href="/app/wallet/history" />
    </div>
  );
}
