"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { StatusOutcomeBanner } from "@/components/wallet/transaction-progress";
import { TransactionDetailRows } from "@/components/wallet/transaction-detail-rows";
import { FlowHubLink } from "@/components/wallet/wallet-flow-shell";
import { formatSignedWalletAmount, walletEntryLabel } from "@/lib/wallet-history-labels";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import type { Locale } from "@/i18n/locale";

type Entry = {
  id: string;
  batchId: string;
  entryType: string;
  asset: string;
  amount: string;
  feeUsdEquivalent: string;
  counterpartyUserId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

function metaStr(meta: Record<string, unknown> | null, key: string): string | null {
  const v = meta?.[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

export default function LedgerActivityDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);

  useEffect(() => {
    void fetch(`/api/wallet/activity/ledger/${params.id}`)
      .then((r) => r.json())
      .then((j) => setEntry(j.entry ?? null))
      .catch(() => setEntry(null));
  }, [params.id]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  if (!entry) {
    return (
      <div className="wallet-theme pb-8">
        <WalletSubpageHeader title={t("wallet_tx_details")} backHref="/app/wallet/history" />
        <p className="text-center text-[color:var(--fd-muted)]">…</p>
      </div>
    );
  }

  const when = new Date(entry.createdAt).toLocaleString(loc, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const label = walletEntryLabel(t, entry.entryType);
  const signed = formatSignedWalletAmount(entry.asset, entry.amount, {
    kind: "ledger",
    entryType: entry.entryType,
  });
  const destination =
    metaStr(entry.meta, "toAddress") ??
    metaStr(entry.meta, "address") ??
    metaStr(entry.meta, "destination");
  const txid = metaStr(entry.meta, "txid") ?? metaStr(entry.meta, "txId");
  const orderId = metaStr(entry.meta, "orderId") ?? metaStr(entry.meta, "adId");
  const feeUsd = Number(entry.feeUsdEquivalent);
  const network = metaStr(entry.meta, "network") ?? metaStr(entry.meta, "networkCanonical");

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: t("wallet_tx_asset"), value: entry.asset },
    { label: t("wallet_tx_type"), value: label },
    { label: t("wallet_tx_when"), value: when },
    { label: t("wallet_tx_amount"), value: `${signed} ${entry.asset}` },
  ];
  if (Number.isFinite(feeUsd) && feeUsd !== 0) {
    rows.push({
      label: t("wallet_tx_est_usd"),
      value: `$${Math.abs(feeUsd).toFixed(2)}`,
    });
  }
  if (destination) {
    rows.push({ label: t("wallet_tx_destination"), value: destination, mono: true });
  }
  if (txid) {
    rows.push({ label: t("wallet_tx_txid"), value: txid, mono: true });
  }
  if (orderId) {
    rows.push({ label: t("wallet_tx_reference"), value: orderId, mono: true });
  }
  if (network) {
    rows.push({
      label: t("wallet_tx_network"),
      value: activityNetworkLabel(locale as Locale, network),
    });
  }
  rows.push({
    label: t("wallet_tx_batch"),
    value: entry.batchId.slice(0, 8) + "…",
    mono: true,
  });

  return (
    <div className="wallet-theme pb-8">
      <WalletSubpageHeader
        title={t("wallet_tx_details")}
        subtitle={label}
        backHref="/app/wallet/history"
      />

      <StatusOutcomeBanner
        variant="success"
        title={t("status_ui_success")}
        detail={`${formatWalletHistoryAmount(entry.asset, entry.amount)} ${entry.asset}`}
      />

      <TransactionDetailRows rows={rows} />

      <FlowHubLink label={t("wallet_history_title")} href="/app/wallet/history" />
    </div>
  );
}
