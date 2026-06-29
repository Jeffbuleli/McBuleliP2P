"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { HistoryVisualIcon } from "@/components/icons/flow-icons";
import { StatusPill } from "@/components/wallet/transaction-progress";
import { FiatChannelIcon, resolveFiatChannelId } from "@/components/wallet/fiat-channel-icon";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import {
  activityChannelLabel,
  activityShortTitle,
  formatSignedWalletAmount,
  historyVisualKind,
} from "@/lib/wallet-history-labels";
import { CRYPTO_ASSET_ICON, type WalletCryptoAsset } from "@/lib/wallet-crypto-assets";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";

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
      return "wallet-hist-icon wallet-hist-icon-receive";
    case "send":
      return "wallet-hist-icon wallet-hist-icon-send";
    case "withdraw":
      return "wallet-hist-icon wallet-hist-icon-withdraw";
    case "p2p":
      return "wallet-hist-icon wallet-hist-icon-p2p";
    case "swap":
      return "wallet-hist-icon wallet-hist-icon-swap";
    default:
      return "wallet-hist-icon wallet-hist-icon-other";
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
  const lang = locale === "fr" ? "fr" : "en";
  const when = new Date(item.createdAt).toLocaleString(loc, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const href =
    item.status === "processing" && item.resumeHref ? item.resumeHref : item.detailHref;
  const visual = historyVisualKind(item);
  const signed = formatSignedWalletAmount(item.asset, item.amount, item);
  const pillLabel =
    item.status === "completed" ? "✓" : item.status === "failed" ? "✕" : "…";
  const channel = activityChannelLabel(item, lang);
  const isFiat = item.kind === "fiat_tx";
  const assetIcon =
    !isFiat && item.asset in CRYPTO_ASSET_ICON
      ? CRYPTO_ASSET_ICON[item.asset as WalletCryptoAsset]
      : null;

  return (
    <li>
      <Link
        href={href}
        className="wallet-hist-row flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a1018]/85 p-3 transition active:scale-[0.99] hover:border-cyan-400/20"
      >
        <span
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconTone(visual)}`}
        >
          {isFiat ? (
            <FiatChannelIcon
              channel={resolveFiatChannelId({
                provider: item.provider,
                rail: item.fiatRail,
              })}
              className="h-8 w-8"
            />
          ) : (
            <HistoryVisualIcon visual={visual} className="h-5 w-5" />
          )}
          {showAssetBadge && !isFiat && assetIcon ? (
            <Image
              src={assetIcon}
              alt=""
              width={14}
              height={14}
              className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-[#0a1018]"
            />
          ) : isFiat ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#0a1018]">
              <WalletAssetIcon asset={item.asset as "USD" | "CDF"} size={16} />
            </span>
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
            {activityShortTitle(t, item)}
          </p>
          <p className="truncate text-[10px] text-[color:var(--fd-muted)]">
            {channel ? `${channel} · ${when}` : when}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="font-mono text-sm font-bold tabular-nums text-[color:var(--fd-text)]">
            {signed} {item.asset}
          </p>
          <StatusPill variant={pillVariant(item.status)} label={pillLabel} />
        </div>
      </Link>
    </li>
  );
}
