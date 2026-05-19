"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { StatusOutcomeBanner } from "@/components/wallet/transaction-progress";
import { FlowHubLink } from "@/components/wallet/wallet-flow-shell";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";

type Entry = {
  id: string;
  entryType: string;
  asset: string;
  amount: string;
  createdAt: string;
};

function entryLabel(t: (k: keyof Messages) => string, entryType: string): string {
  const map: Record<string, keyof Messages> = {
    swap_in: "wallet_entry_swap_in",
    swap_out: "wallet_entry_swap_out",
    transfer_in: "wallet_entry_transfer_in",
    transfer_out: "wallet_entry_transfer_out",
  };
  const k = map[entryType];
  if (k) return t(k);
  return entryType.replace(/_/g, " ");
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
      <div className="pb-8">
        <WalletSubpageHeader title={t("wallet_tx_details")} backHref="/app/wallet" />
        <p className="text-center text-[color:var(--fd-muted)]">…</p>
      </div>
    );
  }

  const when = new Date(entry.createdAt).toLocaleString(loc, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="pb-8">
      <WalletSubpageHeader
        title={t("wallet_tx_details")}
        subtitle={entryLabel(t, entry.entryType)}
        backHref={`/app/wallet/${entry.asset}`}
      />

      <StatusOutcomeBanner
        variant="success"
        title={t("status_ui_success")}
        detail={`${formatWalletHistoryAmount(entry.asset, entry.amount)} ${entry.asset}`}
      />

      <div className="fd-card mt-3 space-y-2 p-4 text-sm">
        <div className="flex justify-between gap-3 border-b border-[color:var(--fd-border)] py-2">
          <span className="text-[color:var(--fd-muted)]">{t("wallet_tx_asset")}</span>
          <span className="font-bold">{entry.asset}</span>
        </div>
        <div className="flex justify-between gap-3 border-b border-[color:var(--fd-border)] py-2">
          <span className="text-[color:var(--fd-muted)]">{t("wallet_tx_type")}</span>
          <span className="font-bold">{entryLabel(t, entry.entryType)}</span>
        </div>
        <div className="flex justify-between gap-3 border-b border-[color:var(--fd-border)] py-2">
          <span className="text-[color:var(--fd-muted)]">{t("wallet_tx_when")}</span>
          <span className="font-bold">{when}</span>
        </div>
        <div className="flex justify-between gap-3 py-2">
          <span className="text-[color:var(--fd-muted)]">{t("wallet_tx_amount")}</span>
          <span className="font-mono font-bold tabular-nums">
            {formatWalletHistoryAmount(entry.asset, entry.amount)} {entry.asset}
          </span>
        </div>
      </div>

      <FlowHubLink label={t("wallet_title")} />
    </div>
  );
}
