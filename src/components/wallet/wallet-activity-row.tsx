"use client";

import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import type { WalletCryptoAsset } from "@/lib/wallet-crypto-assets";
import { WalletHistoryRow } from "@/components/wallet/wallet-history-row";

export function WalletActivityRow({
  item,
  asset,
  locale,
}: {
  item: WalletActivityItem;
  asset: WalletCryptoAsset;
  locale: string;
}) {
  return (
    <WalletHistoryRow
      item={{ ...item, asset: item.asset || asset }}
      locale={locale}
      showAssetBadge
    />
  );
}
