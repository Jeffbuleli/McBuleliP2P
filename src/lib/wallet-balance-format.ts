import type { Locale } from "@/i18n/locale";
import type { WalletAsset } from "@/lib/wallet-types";

/** Same formatting as Wallet asset rows (Home / Profile must stay consistent). */
export function formatWalletAssetBalance(
  n: number,
  asset: WalletAsset,
  locale: Locale,
): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  if (asset === "CDF") {
    return n.toLocaleString(loc, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  }
  return n.toLocaleString(loc, {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  });
}
