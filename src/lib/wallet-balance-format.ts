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

/** Compact balances on Home hero (fewer decimals). */
export function formatHomeAssetBalance(
  n: number,
  asset: WalletAsset,
  locale: Locale,
): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const maxFrac = asset === "USDT" ? 4 : asset === "PI" ? 4 : 2;
  return n.toLocaleString(loc, {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  });
}
