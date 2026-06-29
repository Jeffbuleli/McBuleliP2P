/** Haircut on large live futures wins - protects custodial reserve (B-book). */

export function tradeHouseWinHaircutThresholdUsdt(): number {
  const n = Number(process.env.TRADE_HOUSE_WIN_HAIRCUT_THRESHOLD_USDT ?? "250");
  return Number.isFinite(n) && n >= 0 ? n : 250;
}

export function tradeHouseWinHaircutRate(): number {
  const n = Number(process.env.TRADE_HOUSE_WIN_HAIRCUT_RATE ?? "0.15");
  return Number.isFinite(n) && n >= 0 && n <= 0.5 ? n : 0.15;
}

/** Apply haircut to net win (after close fee, before returning margin). */
export function applyLiveWinHaircut(netWinUsdt: number): {
  netWinAfterHaircut: number;
  haircutUsdt: number;
} {
  if (!Number.isFinite(netWinUsdt) || netWinUsdt <= 0) {
    return { netWinAfterHaircut: 0, haircutUsdt: 0 };
  }
  const threshold = tradeHouseWinHaircutThresholdUsdt();
  const rate = tradeHouseWinHaircutRate();
  const excess = Math.max(0, netWinUsdt - threshold);
  const haircutUsdt = excess * rate;
  return {
    netWinAfterHaircut: netWinUsdt - haircutUsdt,
    haircutUsdt,
  };
}
