"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";
import { USDT_NETWORKS, parseNetwork } from "@/lib/networks";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";
import { DepositStatus } from "@/lib/status";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import {
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";

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

function depositStatusLine(t: (k: keyof Messages) => string, status: string): string {
  if (status === DepositStatus.AWAITING_TRANSFER) return t("deposit_status_awaiting_transfer");
  if (status === DepositStatus.AWAITING_TXID) return t("deposit_status_awaiting_txid");
  if (status === DepositStatus.PENDING_VALIDATION) return t("deposit_status_pending_validation");
  if (status === DepositStatus.CONFIRMED) return t("deposit_status_confirmed");
  if (status === DepositStatus.FAILED) return t("deposit_status_failed");
  return status;
}

export default function DepositDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [txid, setTxid] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deposits/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "—");
      setDeposit(null);
      return;
    }
    setDeposit(data.deposit);
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function markSent() {
    setMsg(null);
    const res = await fetch(`/api/deposits/${id}/sent`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "—");
      return;
    }
    setDeposit(data.deposit);
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
      return;
    }
    if (data.status === "failed") {
      setDeposit(data.deposit);
      setMsg(data.reason ?? "—");
      return;
    }
    if (data.status === "pending") {
      setMsg(data.message ?? "…");
      await load();
      return;
    }
    setMsg(data.message ?? data.error ?? "—");
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
        <p className="text-rose-800">{msg ?? "—"}</p>
        <FlowHubLink label={t("wallet_title")} />
      </WalletFlowShell>
    );
  }

  const isPiMain = deposit.networkCanonical === PI_MAIN_NETWORK_ID;
  const nid = parseNetwork(deposit.networkCanonical);
  const net = nid ? USDT_NETWORKS[nid] : null;
  const networkLabel = isPiMain
    ? "Pi"
    : (net?.label ?? deposit.networkCanonical);

  const showTxid = deposit.status === DepositStatus.AWAITING_TXID;
  const isPendingReview = deposit.status === DepositStatus.PENDING_VALIDATION;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMsg("✓");
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <WalletFlowShell
      title={t("deposit_detail_title")}
      subtitle={depositStatusLine(t, deposit.status)}
    >
      <FlowCard className="flex flex-col items-center gap-3">
        <div className="relative rounded-2xl bg-white p-3 shadow-inner">
          <QRCode value={deposit.addressShown} size={200} />
          {isPiMain ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/assets/crypto/pi.png" alt="" width={40} height={40} className="rounded-full" />
            </div>
          ) : null}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isPiMain ? "bg-violet-100 text-violet-900" : "bg-emerald-100 text-[color:var(--fd-primary)]"
          }`}
        >
          {deposit.asset} · {networkLabel}
        </span>
      </FlowCard>

      <FlowCard className="mt-3">
        <p className="break-all font-mono text-sm text-[color:var(--fd-text)]">
          {deposit.addressShown}
        </p>
        <button
          type="button"
          onClick={() => void copy(deposit.addressShown)}
          className="mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[color:var(--fd-primary)] text-sm font-bold text-white active:scale-[0.98]"
        >
          📋 {t("deposit_copy")}
        </button>
      </FlowCard>

      {deposit.memoShown ? (
        <FlowCard className="mt-3 border-rose-200 bg-rose-50/50">
          <p className="text-xs font-bold text-rose-900">{t("deposit_memo_title")}</p>
          <p className="mt-1 font-mono text-sm">{deposit.memoShown}</p>
          <button
            type="button"
            onClick={() => void copy(deposit.memoShown!)}
            className="mt-2 text-sm font-semibold text-rose-800 underline"
          >
            📋 {t("deposit_copy")}
          </button>
        </FlowCard>
      ) : null}

      {deposit.status === DepositStatus.AWAITING_TRANSFER ? (
        <FlowPrimaryBtn onClick={() => void markSent()}>{t("deposit_sent")}</FlowPrimaryBtn>
      ) : null}

      {isPendingReview ? (
        <FlowCard className="mt-3 flex items-center gap-3 bg-amber-50">
          <span className="text-2xl" aria-hidden>
            ⏳
          </span>
          <p className="text-sm font-semibold text-amber-950">
            {t("deposit_status_pending_validation")}
          </p>
        </FlowCard>
      ) : null}

      {showTxid ? (
        <FlowCard className="mt-3 space-y-3">
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
        </FlowCard>
      ) : null}

      {deposit.status === DepositStatus.CONFIRMED ? (
        <FlowCard className="mt-3 flex items-center gap-3 bg-emerald-50">
          <span className="text-2xl" aria-hidden>
            ✅
          </span>
          <div>
            <p className="font-bold text-emerald-950">{t("deposit_confirmed")}</p>
            <p className="text-sm tabular-nums text-emerald-900">
              {deposit.amount ?? ""} {deposit.asset}
            </p>
          </div>
        </FlowCard>
      ) : null}

      {deposit.status === DepositStatus.FAILED ? (
        <FlowCard className="mt-3 bg-rose-50">
          <p className="font-bold text-rose-900">{t("deposit_failed")}</p>
          <p className="text-sm text-rose-800">{deposit.failureReason}</p>
        </FlowCard>
      ) : null}

      {msg ? (
        <p className="mt-2 text-center text-sm font-semibold text-[color:var(--fd-primary)]">{msg}</p>
      ) : null}

      {deposit.status === DepositStatus.CONFIRMED ? (
        <FlowPrimaryBtn onClick={() => router.push("/app/wallet")}>
          {t("wallet_title")}
        </FlowPrimaryBtn>
      ) : (
        <FlowHubLink label={t("wallet_title")} />
      )}
    </WalletFlowShell>
  );
}
