"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import {
  HistoryEntryIcon,
  IconArrowDown,
  IconArrowUp,
} from "@/components/icons/flow-icons";
import { StatusPill } from "@/components/wallet/transaction-progress";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import {
  CRYPTO_ASSET_ICON,
  type WalletCryptoAsset,
} from "@/lib/wallet-crypto-assets";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";

function activityTitle(
  t: (k: keyof Messages) => string,
  item: WalletActivityItem,
): string {
  if (item.kind === "deposit") return t("wallet_activity_deposit");
  if (item.kind === "withdrawal") return t("wallet_activity_withdraw");
  const map: Record<string, keyof Messages> = {
    transfer_in: "wallet_entry_transfer_in",
    transfer_out: "wallet_entry_transfer_out",
    swap_in: "wallet_entry_swap_in",
    swap_out: "wallet_entry_swap_out",
  };
  const k = item.entryType ? map[item.entryType] : undefined;
  if (k) return t(k);
  return item.entryType?.replace(/_/g, " ") ?? t("wallet_activity_ledger");
}

function pillVariant(
  status: WalletActivityItem["status"],
): "success" | "failed" | "pending" | "processing" {
  if (status === "completed") return "success";
  if (status === "failed") return "failed";
  return "processing";
}

export function WalletActivityRow({
  item,
  asset,
  locale,
}: {
  item: WalletActivityItem;
  asset: WalletCryptoAsset;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const when = new Date(item.createdAt).toLocaleString(loc, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const href =
    item.status === "processing" && item.resumeHref ? item.resumeHref : item.detailHref;
  const amt = formatWalletHistoryAmount(item.asset, item.amount);
  const signed =
    item.kind === "withdrawal" || item.entryType?.includes("out")
      ? `-${amt}`
      : item.kind === "deposit" || item.entryType?.includes("in")
        ? `+${amt}`
        : amt;
  const pillLabel =
    item.status === "completed"
      ? t("status_ui_success")
      : item.status === "failed"
        ? t("status_ui_failed")
        : t("status_ui_processing");

  return (
    <li>
      <Link
        href={href}
        className="fd-card flex items-center gap-3 p-3 transition active:scale-[0.99]"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
          {item.kind === "deposit" ? (
            <IconArrowDown className="h-5 w-5" />
          ) : item.kind === "withdrawal" ? (
            <IconArrowUp className="h-5 w-5" />
          ) : (
            <HistoryEntryIcon entryType={item.entryType ?? ""} className="h-5 w-5" />
          )}
          <Image
            src={CRYPTO_ASSET_ICON[asset]}
            alt=""
            width={16}
            height={16}
            className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
            {activityTitle(t, item)}
          </p>
          <p className="text-[11px] text-[color:var(--fd-muted)]">{when}</p>
          {item.status === "processing" && item.resumeHref ? (
            <p className="mt-0.5 text-[10px] font-semibold text-[color:var(--fd-primary)]">
              {t("wallet_activity_resume")}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="font-mono text-sm font-bold tabular-nums text-[color:var(--fd-text)]">
            {signed}
            <span className="ml-0.5 text-[10px] font-semibold text-[color:var(--fd-muted)]">
              {item.asset}
            </span>
          </p>
          <StatusPill variant={pillVariant(item.status)} label={pillLabel} />
        </div>
      </Link>
    </li>
  );
}
