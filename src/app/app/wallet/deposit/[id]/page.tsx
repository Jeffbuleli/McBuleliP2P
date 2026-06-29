"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import type { Locale } from "@/i18n/locale";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";
import { DepositStatus } from "@/lib/status";
import { depositProgressSteps } from "@/lib/transaction-steps";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";
import { formatSignedWalletAmount } from "@/lib/wallet-history-labels";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import { IconCopy } from "@/components/icons/flow-icons";
import { DepositExactAmountCard } from "@/components/wallet/deposit-exact-amount-card";
import { DepositStatusChip } from "@/components/wallet/deposit-status-chip";
import { walletInputClass } from "@/components/wallet/wallet-form";
import {
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";
import {
  StatusOutcomeBanner,
  TransactionStepper,
} from "@/components/wallet/transaction-progress";

type Deposit = {
  id: string;
  asset: string;
  networkCanonical: string;
  addressShown: string;
  memoShown: string | null;
  minConfirmations: number;
  status: string;
  failureReason: string | null;
  txid: string | null;
  amount: string | null;
  declaredAmountUsdt: string | null;
  userNote: string | null;
  provider: string;
};

type DepositSession = {
  id: string;
  status: string;
  expectedAmount: string;
  expiresAt: string;
  graceUntil: string;
} | null;

function depositStatusLine(t: (k: keyof Messages) => string, status: string, autoDetect = false): string {
  if (status === DepositStatus.AWAITING_TRANSFER) {
    return autoDetect
      ? t("deposit_status_scanning")
      : t("deposit_status_awaiting_transfer");
  }
  if (status === DepositStatus.AWAITING_TXID) return t("deposit_status_awaiting_txid");
  if (status === DepositStatus.PENDING_VALIDATION) return t("deposit_status_pending_validation");
  if (status === DepositStatus.EXPIRED_PENDING_SCAN) {
    return t("deposit_status_expired_pending_scan");
  }
  if (status === DepositStatus.CONFIRMED) return t("deposit_status_confirmed");
  if (status === DepositStatus.FAILED) return t("deposit_status_failed");
  return status;
}

const COPY_BTN =
  "mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/10 text-sm font-bold text-cyan-300 active:scale-[0.98]";

export default function DepositDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [session, setSession] = useState<DepositSession>(null);
  const [txid, setTxid] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deposits/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "-");
      setDeposit(null);
      return;
    }
    setDeposit(data.deposit);
    setSession((data as { session?: DepositSession }).session ?? null);
  }, [id]);

  useEffect(() => {
    if (!session?.expiresAt) {
      setCountdown(0);
      return;
    }
    const tick = () => {
      const ms = new Date(session.expiresAt).getTime() - Date.now();
      setCountdown(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session?.expiresAt]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!deposit) return;
    if (
      deposit.status === DepositStatus.CONFIRMED ||
      deposit.status === DepositStatus.FAILED
    ) {
      return;
    }
    const tmr = window.setInterval(() => void load(), 12_000);
    return () => window.clearInterval(tmr);
  }, [deposit, load]);

  async function markSent() {
    setMsg(null);
    const res = await fetch(`/api/deposits/${id}/sent`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "-");
      return;
    }
    setDeposit(data.deposit);
    router.push(`/app/wallet/activity/deposit/${id}`);
  }

  async function submitTxid() {
    setMsg(null);
    const res = await fetch(`/api/deposits/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txid }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.status === "confirmed") {
      setDeposit(data.deposit);
      setTxid("");
      router.push(`/app/wallet/activity/deposit/${id}`);
      return;
    }
    if (data.status === "failed") {
      setDeposit(data.deposit);
      setMsg(data.reason ?? "-");
      router.push(`/app/wallet/activity/deposit/${id}`);
      return;
    }
    if (data.status === "pending") {
      await load();
      router.push(`/app/wallet/activity/deposit/${id}`);
      return;
    }
    setMsg(data.message ?? data.error ?? "-");
  }

  if (loading) {
    return (
      <WalletFlowShell title={t("deposit_detail_title")}>
        <p className="text-center text-[color:var(--fd-muted)]">…</p>
      </WalletFlowShell>
    );
  }

  if (!deposit) {
    return (
      <WalletFlowShell title={t("deposit_detail_title")}>
        <FlowCard className="border-rose-400/30 bg-rose-500/10">
          <p className="text-rose-300">{msg ?? "-"}</p>
        </FlowCard>
        <FlowHubLink label={t("wallet_title")} />
      </WalletFlowShell>
    );
  }

  const isPiMain = deposit.networkCanonical === PI_MAIN_NETWORK_ID;
  const networkLabel = activityNetworkLabel(locale as Locale, deposit.networkCanonical);
  const creditedAmount = deposit.amount
    ? formatWalletHistoryAmount(deposit.asset, deposit.amount)
    : null;
  const sessionAmbiguous = session?.status === "AMBIGUOUS";
  const autoDetect =
    session != null &&
    !sessionAmbiguous &&
    deposit.asset === "USDT" &&
    deposit.provider === "binance";
  const showTxid = !autoDetect && deposit.status === DepositStatus.AWAITING_TXID;
  const steps = depositProgressSteps(deposit.status, { autoDetect });
  const showExactAmount =
    Boolean(session?.expectedAmount) &&
    deposit.status === DepositStatus.AWAITING_TRANSFER &&
    !sessionAmbiguous;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMsg(t("copy_done"));
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <WalletFlowShell
      title={`${t("deposit_detail_title")} · ${deposit.asset}`}
      subtitle={depositStatusLine(t, deposit.status, autoDetect)}
    >
      <TransactionStepper steps={steps} />

      {showExactAmount && session ? (
        <DepositExactAmountCard
          expectedAmount={session.expectedAmount}
          asset={deposit.asset}
          countdownSec={countdown}
          onCopied={() => setMsg(t("copy_done"))}
        />
      ) : null}

      {autoDetect && deposit.status === DepositStatus.AWAITING_TRANSFER ? (
        <DepositStatusChip variant="auto" />
      ) : null}

      {sessionAmbiguous || deposit.failureReason === "deposit_amount_ambiguous" ? (
        <DepositStatusChip variant="ambiguous" />
      ) : null}

      {deposit.status === DepositStatus.EXPIRED_PENDING_SCAN ? (
        <DepositStatusChip variant="expired" />
      ) : null}

      {deposit.status === DepositStatus.CONFIRMED ? (
        <StatusOutcomeBanner
          variant="success"
          title={t("deposit_confirmed")}
          detail={
            creditedAmount
              ? `${formatSignedWalletAmount(deposit.asset, deposit.amount!, { kind: "deposit" })} ${deposit.asset}`
              : undefined
          }
        />
      ) : null}

      {deposit.status === DepositStatus.FAILED ? (
        <StatusOutcomeBanner
          variant="failed"
          title={t("deposit_failed")}
          detail={deposit.failureReason ?? undefined}
        />
      ) : null}

      <FlowCard className="mt-3 flex flex-col items-center gap-3">
        <div className="relative rounded-2xl border border-white/12 bg-white p-3">
          <QRCode value={deposit.addressShown} size={200} />
          {isPiMain ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/assets/crypto/pi.png" alt="" width={40} height={40} className="rounded-full" />
            </div>
          ) : null}
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            isPiMain
              ? "border-violet-400/35 bg-violet-500/15 text-violet-300"
              : "border-emerald-400/35 bg-emerald-500/15 text-emerald-300"
          }`}
        >
          {deposit.asset} · {networkLabel}
        </span>
      </FlowCard>

      <FlowCard className="mt-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
          {t("deposit_copy")}
        </p>
        <p className="mt-1 break-all font-mono text-sm text-[color:var(--fd-text)]">
          {deposit.addressShown}
        </p>
        <button type="button" onClick={() => void copy(deposit.addressShown)} className={COPY_BTN}>
          <IconCopy className="h-4 w-4" />
          {t("deposit_copy")}
        </button>
      </FlowCard>

      {deposit.declaredAmountUsdt && deposit.asset === "PI" ? (
        <FlowCard className="mt-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
            {t("deposit_declared_amount_pi_label")}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[color:var(--fd-text)]">
            {formatWalletHistoryAmount("PI", deposit.declaredAmountUsdt)} π
          </p>
          {deposit.userNote ? (
            <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
              {t("deposit_pi_memo_label")}: {deposit.userNote}
            </p>
          ) : null}
        </FlowCard>
      ) : null}

      {deposit.memoShown ? (
        <FlowCard className="mt-3 border-rose-400/30 bg-rose-500/10">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-rose-300">
            {t("deposit_memo_title")}
          </p>
          <p className="mt-1 font-mono text-sm text-rose-200">{deposit.memoShown}</p>
          <button
            type="button"
            onClick={() => void copy(deposit.memoShown!)}
            className="mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 text-sm font-bold text-rose-200 active:scale-[0.98]"
          >
            <IconCopy className="h-4 w-4" />
            {t("deposit_copy")}
          </button>
        </FlowCard>
      ) : null}

      {!autoDetect && deposit.status === DepositStatus.AWAITING_TRANSFER ? (
        <div className="mt-3">
          <FlowPrimaryBtn onClick={() => void markSent()}>
            {t("deposit_sent_btn", { asset: deposit.asset })}
          </FlowPrimaryBtn>
        </div>
      ) : null}

      {showTxid ? (
        <FlowCard className="mt-3 space-y-3">
          <label className="block text-sm font-semibold text-[color:var(--fd-text)]">
            {t("deposit_txid")}
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className={`${walletInputClass} mt-2 font-mono`}
            />
          </label>
          <FlowPrimaryBtn
            disabled={txid.trim().length < 8}
            onClick={() => void submitTxid()}
          >
            {t("deposit_submit")}
          </FlowPrimaryBtn>
        </FlowCard>
      ) : null}

      {msg ? (
        <p className="mt-2 text-center text-sm font-semibold text-emerald-300">{msg}</p>
      ) : null}

      {deposit.status === DepositStatus.CONFIRMED ? (
        <div className="mt-3">
          <FlowPrimaryBtn onClick={() => router.push("/app/wallet/history")}>
            {t("wallet_history_title")}
          </FlowPrimaryBtn>
        </div>
      ) : (
        <FlowHubLink label={t("wallet_title")} />
      )}
    </WalletFlowShell>
  );
}
