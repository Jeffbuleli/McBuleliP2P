import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { formatMoneyLocale } from "@/lib/fx";
import type { Locale } from "@/i18n/locale";
import { assetAmountToUsd } from "@/lib/wallet-convert";
import { fetchReferenceRates } from "@/lib/reference-rates";
import { numFromNumeric, type WalletAsset } from "@/lib/wallet-types";

export type WalletAssetLine = {
  asset: WalletAsset;
  balance: string;
  balanceNum: number;
  valueUsd: number;
  valueUsdDisplay: string;
};

export async function getWalletUserState(
  userId: string,
  locale: Locale,
): Promise<{
  lines: WalletAssetLine[];
  totalUsd: number;
  totalUsdDisplay: string;
} | null> {
  const db = getDb();
  const [u] = await db
    .select({
      balance: users.balance,
      piBalance: users.piBalance,
      usdBalance: users.usdBalance,
      cdfBalance: users.cdfBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) return null;

  const rates = await fetchReferenceRates();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const raw: { asset: WalletAsset; bal: string }[] = [
    { asset: "USDT", bal: u.balance?.toString() ?? "0" },
    { asset: "PI", bal: u.piBalance?.toString() ?? "0" },
    { asset: "USD", bal: u.usdBalance?.toString() ?? "0" },
    { asset: "CDF", bal: u.cdfBalance?.toString() ?? "0" },
  ];

  let totalUsd = 0;
  const lines: WalletAssetLine[] = raw.map((r) => {
    const balanceNum = numFromNumeric(r.bal);
    const valueUsd = assetAmountToUsd(balanceNum, r.asset, rates);
    totalUsd += valueUsd;
    return {
      asset: r.asset,
      balance: r.bal,
      balanceNum,
      valueUsd,
      valueUsdDisplay: formatMoneyLocale(valueUsd, locale, 2),
    };
  });

  const totalUsdDisplay = totalUsd.toLocaleString(loc, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  return { lines, totalUsd, totalUsdDisplay };
}
