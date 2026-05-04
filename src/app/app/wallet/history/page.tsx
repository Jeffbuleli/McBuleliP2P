"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import { WALLET_ASSETS, type WalletAsset } from "@/lib/wallet-types";

type Entry = {
  id: string;
  batchId: string;
  entryType: string;
  asset: string;
  amount: string;
  feeUsdEquivalent: string;
  createdAt: string;
};

const TYPES = ["", "swap_", "transfer_", "fiat_"] as const;

function entryLabel(t: (k: keyof Messages) => string, entryType: string): string {
  const map: Record<string, keyof Messages> = {
    swap_in: "wallet_entry_swap_in",
    swap_out: "wallet_entry_swap_out",
    swap_fee: "wallet_entry_swap_fee",
    transfer_in: "wallet_entry_transfer_in",
    transfer_out: "wallet_entry_transfer_out",
    fiat_deposit: "wallet_entry_fiat_deposit",
    fiat_withdraw: "wallet_entry_fiat_withdraw",
    stake_lock: "wallet_entry_stake_lock",
    stake_principal_return: "wallet_entry_stake_principal_return",
    stake_interest_payment: "wallet_entry_stake_interest_payment",
    p2p_escrow_lock: "wallet_entry_p2p_escrow_lock",
    p2p_release: "wallet_entry_p2p_release",
    p2p_escrow_refund: "wallet_entry_p2p_escrow_refund",
    p2p_platform_fee: "wallet_entry_p2p_platform_fee",
  };
  const k = map[entryType];
  return k ? t(k) : entryType;
}

export default function WalletHistoryPage() {
  const { t, locale } = useI18n();
  const [typePrefix, setTypePrefix] = useState("");
  const [asset, setAsset] = useState("");
  const [rows, setRows] = useState<Entry[] | null>(null);

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

  useEffect(() => {
    void load();
  }, [load]);

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
              {p.replace(/_$/, "")}
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
                {r.amount} {r.asset}
                {Number(r.feeUsdEquivalent) > 0 ? (
                  <span className="ml-2 text-xs text-stone-500">
                    · fee USD eq. {r.feeUsdEquivalent}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
