"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { HistoryVisualIcon } from "@/components/icons/flow-icons";
import { StatusPill } from "@/components/wallet/transaction-progress";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import {
  activityTitle,
  formatSignedWalletAmount,
  historyVisualKind,
} from "@/lib/wallet-history-labels";
import { CRYPTO_ASSET_ICON, type WalletCryptoAsset } from "@/lib/wallet-crypto-assets";

function pillVariant(
  status: WalletActivityItem["status"],
): "success" | "failed" | "pending" | "processing" {
  if (status === "completed") return "success";
  if (status === "failed") return "failed";
  return "processing";
}

function iconTone(visual: ReturnType<typeof historyVisualKind>): string {
  switch (visual) {
    case "receive":
      return "bg-amber-100 text-amber-800";
    case "send":
      return "bg-stone-100 text-[color:var(--fd-primary-dark)]";
    case "withdraw":
      return "bg-emerald-100 text-[color:var(--fd-primary)]";
    case "p2p":
      return "bg-violet-100 text-violet-800";
    case "swap":
      return "bg-cyan-100 text-cyan-800";
    default:
      return "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]";
  }
}

export function WalletHistoryRow({
  item,
  locale,
  showAssetBadge = true,
}: {
  item: WalletActivityItem;
  locale: string;
  showAssetBadge?: boolean;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const when = new Date(item.createdAt).toLocaleString(loc, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const href =
    item.status === "processing" && item.resumeHref ? item.resumeHref : item.detailHref;
  const visual = historyVisualKind(item);
  const signed = formatSignedWalletAmount(item.asset, item.amount, item);
  const pillLabel =
    item.status === "completed"
      ? t("status_ui_success")
      : item.status === "failed"
        ? t("status_ui_failed")
        : t("status_ui_processing");
  const assetIcon =
    item.asset in CRYPTO_ASSET_ICON
      ? CRYPTO_ASSET_ICON[item.asset as WalletCryptoAsset]
      : null;
  return (
    <li>
      <Link
        href={href}
        className="fd-card flex items-center gap-3 p-3 transition active:scale-[0.99]"
      >
        <span
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconTone(visual)}`}
        >
          <HistoryVisualIcon visual={visual} className="h-5 w-5" />
          {showAssetBadge && assetIcon ? (
            <Image
              src={assetIcon}
              alt=""
              width={16}
              height={16}
              className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white"
            />
          ) : null}
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
