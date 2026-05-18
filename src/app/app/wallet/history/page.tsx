"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import { WALLET_ASSETS, formatWalletHistoryAmount } from "@/lib/wallet-types";
import { piSandboxFromMeta } from "@/lib/pi-network-env";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";

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

const TYPE_CHIPS = [
  { prefix: "", icon: "📋", key: "wallet_history_all" as const },
  { prefix: "transfer_", icon: "✈️", key: "wallet_history_cat_transfer" as const },
  { prefix: "swap_", icon: "🔄", key: "wallet_history_cat_swap" as const },
] as const;

const HISTORY_ASSETS = WALLET_ASSETS.filter(
  (a) => a !== "USD" && a !== "CDF" && a !== "PI_TEST",
);

function entryIcon(entryType: string): string {
  if (entryType.includes("stake")) return "⛓";
  if (entryType.includes("pool") || entryType.includes("lp_")) return "💧";
  if (entryType.includes("loan")) return "🏦";
  if (entryType.includes("group")) return "🤝";
  if (entryType.includes("transfer")) return "✈️";
  if (entryType.includes("swap")) return "🔄";
  if (entryType.includes("p2p") || entryType.includes("trade")) return "📊";
  if (entryType.includes("deposit")) return "⬇️";
  if (entryType.includes("withdraw")) return "⬆️";
  return "•";
}

function entryLabel(t: (k: keyof Messages) => string, entryType: string): string {
  const map: Record<string, keyof Messages> = {
    swap_in: "wallet_entry_swap_in",
    swap_out: "wallet_entry_swap_out",
    swap_fee: "wallet_entry_swap_fee",
    transfer_in: "wallet_entry_transfer_in",
    transfer_out: "wallet_entry_transfer_out",
    stake_lock: "wallet_entry_stake_lock",
    stake_principal_return: "wallet_entry_stake_principal_return",
    stake_interest_payment: "wallet_entry_stake_interest_payment",
    lp_pool_lock: "wallet_entry_lp_pool_lock",
    lp_pool_reward_payout: "wallet_entry_lp_pool_reward_payout",
    loan_disburse: "wallet_entry_loan_disburse",
    loan_repay: "wallet_entry_loan_repay",
    group_contribution_in: "wallet_entry_group_contribution_in",
    group_contribution_out: "wallet_entry_group_contribution_out",
    group_payout_out: "wallet_entry_group_payout_out",
    group_payout_in: "wallet_entry_group_payout_in",
  };
  const k = map[entryType];
  if (k) return t(k);
  return entryType.replace(/_/g, " ");
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
    if (asset && asset !== "PI") {
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
    <div className="wallet-theme pb-10">
      <WalletSubpageHeader title={t("wallet_history_title")} />

      <div className="mb-3 flex flex-wrap gap-2">
        {TYPE_CHIPS.map((c) => (
          <button
            key={c.prefix || "all"}
            type="button"
            onClick={() => setTypePrefix(c.prefix)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${
              typePrefix === c.prefix
                ? "bg-[color:var(--fd-primary)] text-white"
                : "bg-[color:var(--fd-card)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]"
            }`}
          >
            <span aria-hidden>{c.icon}</span>
            {t(c.key)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAsset("")}
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            !asset
              ? "bg-emerald-100 text-[color:var(--fd-primary)]"
              : "bg-stone-100 text-[color:var(--fd-muted)]"
          }`}
        >
          {t("wallet_history_all")}
        </button>
        {HISTORY_ASSETS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAsset(a)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              asset === a
                ? "bg-emerald-100 text-[color:var(--fd-primary)]"
                : "bg-stone-100 text-[color:var(--fd-muted)]"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {rows === null ? (
        <p className="text-center text-[color:var(--fd-muted)]">…</p>
      ) : rows.length === 0 ? (
        <div className="fd-card p-8 text-center">
          <p className="text-3xl" aria-hidden>
            📭
          </p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--fd-muted)]">
            {t("wallet_history_empty")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="fd-card flex items-center gap-3 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 text-lg">
                {entryIcon(r.entryType)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
                  {entryLabel(t, r.entryType)}
                </p>
                <p className="text-[11px] text-[color:var(--fd-muted)]">
                  {new Date(r.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <p className="shrink-0 text-right font-mono text-sm font-bold tabular-nums text-[color:var(--fd-text)]">
                {formatWalletHistoryAmount(r.asset, r.amount)}
                <span className="ml-1 text-[10px] font-semibold text-[color:var(--fd-muted)]">
                  {r.asset}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}

      {piRows && piRows.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {piRows.map((p) => (
            <li key={p.id} className="fd-card flex items-center gap-3 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-lg">
                🟣
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[color:var(--fd-text)]">Pi</p>
                <p className="text-[11px] text-[color:var(--fd-muted)]">
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="font-mono text-sm font-bold tabular-nums">
                {formatWalletHistoryAmount(
                  piSandboxFromMeta(p.meta) ? "PI_TEST" : "PI",
                  p.amount,
                )}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

