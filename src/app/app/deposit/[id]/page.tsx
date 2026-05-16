"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";
import { USDT_NETWORKS, parseNetwork } from "@/lib/networks";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";
import { DepositStatus } from "@/lib/status";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

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
    return <p className="text-stone-400">…</p>;
  }
  if (!deposit) {
    return (
      <p className="text-rose-200">
        {msg ?? "—"}{" "}
        <Link href="/app" className="underline text-emerald-300">
          {t("dashboard")}
        </Link>
      </p>
    );
  }

  const isPiMain = deposit.networkCanonical === PI_MAIN_NETWORK_ID;
  const nid = parseNetwork(deposit.networkCanonical);
  const net = nid ? USDT_NETWORKS[nid] : null;
  const badge = isPiMain
    ? "bg-violet-700 text-white"
    : (net?.badgeClass ?? "bg-stone-700 text-white");
  const networkLabel = isPiMain
    ? t("deposit_network_pi_main")
    : (net?.label ?? deposit.networkCanonical);

  const showTxid = deposit.status === DepositStatus.AWAITING_TXID;
  const isPendingReview =
    deposit.status === DepositStatus.PENDING_VALIDATION;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMsg("✓");
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div className="space-y-6 pb-10 pt-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-50">
          {t("deposit_detail_title")}
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          {depositStatusLine(t, deposit.status)}
        </p>
      </div>

      {deposit.asset === "USDT" &&
      (deposit.declaredAmountUsdt != null || (deposit.userNote && deposit.userNote.length > 0)) ? (
        <div className="rounded-xl border border-stone-600/50 bg-stone-900/50 p-4 text-sm text-stone-200">
          {deposit.declaredAmountUsdt != null ? (
            <p>
              <span className="text-stone-500">{t("deposit_summary_declared")}: </span>
              <strong className="tabular-nums text-stone-100">
                {deposit.declaredAmountUsdt} USDT
              </strong>
            </p>
          ) : null}
          {deposit.userNote ? (
            <p className={deposit.declaredAmountUsdt != null ? "mt-2" : ""}>
              <span className="text-stone-500">{t("deposit_summary_note")}: </span>
              {deposit.userNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-3 text-sm text-amber-100">
        {t("deposit_warn_body")}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-4 py-2 text-sm font-bold uppercase ${badge}`}
        >
          {networkLabel}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {t("deposit_detail_route")}
        </span>
      </div>

      <div className="rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase text-stone-400">
          {deposit.asset} · {networkLabel}
        </p>
        <p className="mt-2 break-all font-mono text-sm text-stone-50">
          {deposit.addressShown}
        </p>
        <button
          type="button"
          onClick={() => void copy(deposit.addressShown)}
          className="mt-3 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-black/20 active:scale-[0.99]"
        >
          📋 {t("deposit_copy")}
        </button>
      </div>

      {deposit.memoShown ? (
        <div className="rounded-2xl border-2 border-rose-900/30 bg-rose-50 p-4 dark:border-rose-800/50 dark:bg-rose-950/30">
          <p className="text-xs font-bold uppercase text-rose-900 dark:text-rose-100">
            {t("deposit_memo_title")}
          </p>
          <p className="mt-2 font-mono text-sm">{deposit.memoShown}</p>
          <button
            type="button"
            onClick={() => void copy(deposit.memoShown!)}
            className="mt-2 text-sm font-semibold text-rose-900 underline"
          >
            📋 {t("deposit_copy")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2 rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="relative">
          <QRCode value={deposit.addressShown} size={220} />
          {isPiMain ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-white p-2 shadow">
                <img src="/assets/crypto/pi.png" alt="Pi" className="h-10 w-10" />
              </div>
            </div>
          ) : null}
        </div>
        <p className="text-xs text-stone-400">
          {isPiMain ? t("asset_pi_network") : t("deposit_detail_scan")}
        </p>
      </div>

      <p className="text-sm text-stone-400">
        {t("deposit_expected_conf")}{" "}
        <strong>{deposit.minConfirmations}</strong>
      </p>

      {deposit.status === DepositStatus.AWAITING_TRANSFER ? (
        <button
          type="button"
          onClick={() => void markSent()}
          className="w-full rounded-xl bg-emerald-700 py-3 text-lg font-semibold text-white"
        >
          {t("deposit_sent")}
        </button>
      ) : null}

      {isPendingReview ? (
        <div className="rounded-xl border-2 border-amber-600/60 bg-amber-950/40 p-4 text-amber-50">
          <p className="font-bold">{t("deposit_status_pending_validation")}</p>
          <p className="mt-2 text-sm text-amber-100/90">
            {t("deposit_pending_review_body")}
          </p>
          {deposit.txid ? (
            <p className="mt-3 break-all font-mono text-xs text-stone-300">
              {deposit.txid}
            </p>
          ) : null}
        </div>
      ) : null}

      {showTxid ? (
        <div className="space-y-3 rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <label className="block text-sm font-medium text-stone-200">
            {t("deposit_txid")}
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-900/70 px-3 py-2.5 font-mono text-sm text-stone-100 outline-none ring-emerald-500/40 placeholder:text-stone-500 focus:ring-2"
            />
          </label>
          <button
            type="button"
            disabled={txid.trim().length < 8}
            onClick={() => void submitTxid()}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm shadow-black/20 disabled:opacity-40 active:scale-[0.99]"
          >
            {t("deposit_submit")}
          </button>
        </div>
      ) : null}

      {deposit.status === DepositStatus.CONFIRMED ? (
        <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 text-emerald-950">
          <p className="font-bold">{t("deposit_confirmed")}</p>
          <p className="mt-1 text-sm">
            {deposit.amount ?? ""} {deposit.asset} · {deposit.txid}
          </p>
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="mt-4 w-full rounded-lg bg-emerald-700 py-2 font-semibold text-white"
          >
            {t("dashboard")}
          </button>
        </div>
      ) : null}

      {deposit.status === DepositStatus.FAILED ? (
        <div className="rounded-xl border-2 border-rose-700 bg-rose-50 p-4 text-rose-950">
          <p className="font-bold">{t("deposit_failed")}</p>
          <p className="mt-1 text-sm">{deposit.failureReason}</p>
        </div>
      ) : null}

      {msg ? (
        <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-800">
          {msg}
        </p>
      ) : null}

      <Link href="/app" className="inline-block text-sm font-medium text-emerald-900 underline">
        {t("dashboard")}
      </Link>
    </div>
  );
}
