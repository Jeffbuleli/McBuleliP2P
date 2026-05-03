/** Congolese francs per 1 USD (configure for your desk rate). */
export function cdfPerOneUsd(): number {
  const v = Number(process.env.FX_CDF_PER_USD ?? "2850");
  return Number.isFinite(v) && v > 0 ? v : 2850;
}

export function formatMoneyLocale(
  n: number,
  locale: string,
  maxFrac = 2,
): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  });
}
