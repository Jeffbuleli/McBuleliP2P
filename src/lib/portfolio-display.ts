import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { cdfPerOneUsd, formatMoneyLocale } from "@/lib/fx";
import type { Locale } from "@/i18n/locale";
import { okxPublicTickerLast } from "@/lib/okx";

export type PortfolioSnapshot = {
  totalEquivUsdt: number;
  totalEquivDisplay: string;
  usdtDisplay: string;
  piDisplay: string;
  fiatUsdDisplay: string;
  fiatCdfDisplay: string;
};

function fmtLocale(n: number, locale: Locale, maxFrac: number): string {
  if (!Number.isFinite(n)) return "—";
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return n.toLocaleString(loc, {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  });
}

export async function getPortfolioSnapshotForUser(
  userId: string,
  locale: Locale,
): Promise<PortfolioSnapshot | null> {
  const db = getDb();
  const [u] = await db
    .select({
      balance: users.balance,
      piBalance: users.piBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) return null;

  const usdtNum = Number(u.balance ?? 0);
  const piNum = Number(u.piBalance ?? 0);

  let piLast: string | null = null;
  try {
    piLast = await okxPublicTickerLast("PI-USDT");
  } catch {
    piLast = null;
  }
  const piUsd = piLast != null ? Number(piLast) : NaN;
  const piInUsdt =
    Number.isFinite(piUsd) && piUsd > 0 ? piNum * piUsd : 0;
  const totalEquivUsdt = usdtNum + piInUsdt;
  const cdf = cdfPerOneUsd();

  const totalEquivDisplay = `≈ ${fmtLocale(totalEquivUsdt, locale, 4)} USDT`;
  const usdtDisplay = `${fmtLocale(usdtNum, locale, 4)} USDT`;
  const piDisplay =
    Number.isFinite(piUsd) && piUsd > 0
      ? `${fmtLocale(piNum, locale, 4)} Pi · ≈ ${fmtLocale(piInUsdt, locale, 2)} USDT`
      : `${fmtLocale(piNum, locale, 4)} Pi`;
  const fiatUsdDisplay = `≈ ${formatMoneyLocale(totalEquivUsdt, locale, 2)} USD`;
  const fiatCdfDisplay = `≈ ${formatMoneyLocale(totalEquivUsdt * cdf, locale, 0)} CDF`;

  return {
    totalEquivUsdt,
    totalEquivDisplay,
    usdtDisplay,
    piDisplay,
    fiatUsdDisplay,
    fiatCdfDisplay,
  };
}
