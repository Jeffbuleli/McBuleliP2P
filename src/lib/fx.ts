/** Congolese francs per 1 USD - live rate preferred; env override when APIs unavailable. */
export function cdfPerOneUsd(): number {
  const v = Number(process.env.FX_CDF_PER_USD ?? "2300");
  return Number.isFinite(v) && v > 0 ? v : 2300;
}

export function formatMoneyLocale(
  n: number,
  locale: string,
  maxFrac = 2,
): string {
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  });
}
