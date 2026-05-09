"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import { WALLET_ASSETS, formatWalletHistoryAmount } from "@/lib/wallet-types";
import { piSandboxFromMeta } from "@/lib/pi-network-env";

type Entry = {
  id: string;
  batchId: string;
  entryType: string;
  asset: string;
  amount: string;
  feeUsdEquivalent: string;
  createdAt: string;
};

type PiPayment = {
  id: string;
  kind: string;
  amount: string;
  memo: string;
  action: string;
  status: string;
  txid: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  fulfilledAt: string | null;
};

const TYPES = ["", "swap_", "transfer_", "fiat_"] as const;

function typeFilterLabel(t: (k: keyof Messages) => string, prefix: string): string {
  if (prefix === "swap_") return t("wallet_history_cat_swap");
  if (prefix === "transfer_") return t("wallet_history_cat_transfer");
  if (prefix === "fiat_") return t("wallet_history_cat_fiat");
  return t("wallet_history_all");
}

function entryLabel(t: (k: keyof Messages) => string, entryType: string): string {
  const map: Record<string, keyof Messages> = {
    swap_in: "wallet_entry_swap_in",
    swap_out: "wallet_entry_swap_out",
    swap_fee: "wallet_entry_swap_fee",
    transfer_in: "wallet_entry_transfer_in",
    transfer_out: "wallet_entry_transfer_out",
    fiat_deposit: "wallet_entry_fiat_deposit",
    fiat_withdraw: "wallet_entry_fiat_withdraw",
    fiat_withdraw_refund: "wallet_entry_fiat_withdraw_refund",
    stake_lock: "wallet_entry_stake_lock",
    stake_principal_return: "wallet_entry_stake_principal_return",
    stake_interest_payment: "wallet_entry_stake_interest_payment",
    p2p_escrow_lock: "wallet_entry_p2p_escrow_lock",
    p2p_release: "wallet_entry_p2p_release",
    p2p_escrow_refund: "wallet_entry_p2p_escrow_refund",
    p2p_platform_fee: "wallet_entry_p2p_platform_fee",
    p2p_ad_reserve_lock: "wallet_entry_p2p_ad_reserve_lock",
    p2p_ad_reserve_unlock: "wallet_entry_p2p_ad_reserve_unlock",
    p2p_quote_out: "wallet_entry_p2p_quote_out",
    p2p_quote_in: "wallet_entry_p2p_quote_in",
    trade_futures_open: "wallet_entry_trade_futures_open",
    trade_futures_close: "wallet_entry_trade_futures_close",
    trade_futures_liquidated: "wallet_entry_trade_futures_liquidated",
    trade_options_open: "wallet_entry_trade_options_open",
    trade_options_settle: "wallet_entry_trade_options_settle",
    lp_pool_lock: "wallet_entry_lp_pool_lock",
    lp_pool_reward_payout: "wallet_entry_lp_pool_reward_payout",
    loan_disburse: "wallet_entry_loan_disburse",
    loan_repay: "wallet_entry_loan_repay",
    group_contribution_in: "wallet_entry_group_contribution_in",
    group_contribution_out: "wallet_entry_group_contribution_out",
    group_payout_out: "wallet_entry_group_payout_out",
    group_payout_in: "wallet_entry_group_payout_in",
    group_subscription_fee: "wallet_entry_group_subscription_fee",
  };
  const k = map[entryType];
  if (k) return t(k);
  return entryType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function piPaymentActionLabel(t: (k: keyof Messages) => string, action: string): string {
  if (action === "wallet_test") return t("pi_payment_action_wallet_test");
  if (action === "p2p_ad_boost") return t("pi_payment_action_p2p_ad_boost");
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function piPaymentStatusLabel(t: (k: keyof Messages) => string, status: string): string {
  const u = status.trim().toUpperCase();
  if (u === "COMPLETED") return t("pi_payment_status_completed");
  if (u === "APPROVED") return t("pi_payment_status_approved");
  if (u === "PENDING") return t("status_ui_pending");
  return status;
}

export default function WalletHistoryPage() {
  const { t, locale } = useI18n();
  const [typePrefix, setTypePrefix] = useState("");
  const [asset, setAsset] = useState("");
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [piRows, setPiRows] = useState<PiPayment[] | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (typePrefix) q.set("type", typePrefix);
    if (asset) q.set("asset", asset);
    const res = await fetch(`/api/wallet/history?${q.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRows([]);
      return;
    }
    setRows(Array.isArray(data.entries) ? data.entries : []);
  }, [typePrefix, asset]);

  const loadPi = useCallback(async () => {
    if (asset && asset !== "PI" && asset !== "PI_TEST") {
      setPiRows([]);
      return;
    }
    const res = await fetch("/api/payments/pi/history?limit=50", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      setPiRows([]);
      return;
    }
    setPiRows(Array.isArray(data.payments) ? data.payments : []);
  }, [asset]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadPi();
  }, [loadPi]);

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-2">
      <Link href="/app/wallet" className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400">
        ← {t("wallet_title")}
      </Link>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        {t("wallet_history_title")}
      </h1>

      <div className="flex flex-wrap gap-2">
        <select
          value={typePrefix}
          onChange={(e) => setTypePrefix(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          <option value="">{t("wallet_history_type")}: {t("wallet_history_all")}</option>
          {TYPES.filter(Boolean).map((p) => (
            <option key={p} value={p}>
              {typeFilterLabel(t, p)}
            </option>
          ))}
        </select>
        <select
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          <option value="">{t("wallet_history_asset")}: {t("wallet_history_all")}</option>
          {WALLET_ASSETS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {rows === null ? (
        <p className="text-stone-500">…</p>
      ) : rows.length === 0 ? (
        <p className="text-stone-500">{t("wallet_history_empty")}</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white dark:divide-stone-700 dark:border-stone-700 dark:bg-stone-900">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-stone-900 dark:text-stone-50">
                  {entryLabel(t, r.entryType)}
                </span>
                <span className="text-xs text-stone-500">
                  {new Date(r.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
                </span>
              </div>
              <p className="tabular-nums text-stone-800 dark:text-stone-200">
                {formatWalletHistoryAmount(r.asset, r.amount)} {r.asset}
                {Number(r.feeUsdEquivalent) > 0 ? (
                  <span className="ml-2 text-xs text-stone-500">
                    · {t("wallet_history_fee_equiv")}{" "}
                    {formatWalletHistoryAmount("USD", r.feeUsdEquivalent)}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}

      {piRows === null ? null : piRows.length === 0 ? null : (
        <div className="pt-2">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
            {t("wallet_history_pi_platform")}
          </h2>
          <ul className="mt-2 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white dark:divide-stone-700 dark:border-stone-700 dark:bg-stone-900">
            {piRows.map((p) => {
              const isTest = piSandboxFromMeta(p.meta);
              const assetLabel = isTest ? "PI_TEST" : "PI";
              const assetName = isTest ? "Pi Test" : "PI";
              return (
              <li key={p.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-stone-900 dark:text-stone-50">
                    {piPaymentActionLabel(t, p.action)} · {piPaymentStatusLabel(t, p.status)}
                  </span>
                  <span className="text-xs text-stone-500">
                    {new Date(p.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
                  </span>
                </div>
                <p className="tabular-nums text-stone-800 dark:text-stone-200">
                  {formatWalletHistoryAmount(assetLabel, p.amount)} {assetName}
                </p>
                <p className="text-xs text-stone-500">{p.memo}</p>
                {p.txid ? (
                  <p className="break-all font-mono text-[11px] text-stone-500">
                    txid: {p.txid}
                  </p>
                ) : null}
              </li>
            );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
