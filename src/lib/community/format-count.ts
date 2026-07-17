/** Compact social counts: 999 → 999, 1200 → 1.2K, 100000 → 100K, 1e6 → 1M */
export function formatCompactCount(n: number): string {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m >= 10 ? Math.round(m) : Number(m.toFixed(1))}M`;
  }
  if (v >= 100_000) return `${Math.round(v / 1000)}K`;
  if (v >= 1000) {
    const k = v / 1000;
    return `${k >= 10 ? Math.round(k) : Number(k.toFixed(1))}K`;
  }
  return String(v);
}

/**
 * Wallet / community BP: locale under 1K, compact from 1K (1K, 1.1K, 2K, 1M).
 */
export function formatBp(n: number, locale: "en" | "fr" = "en"): string {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  if (v >= 1000) return formatCompactCount(v);
  return v.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");
}

/**
 * McB display (today tips / future balances): same compact thresholds as BP.
 * Keeps up to 2 decimals under 1K; compact integers from 1K.
 */
export function formatMcB(n: number, locale: "en" | "fr" = "en"): string {
  const v = Math.max(0, Number(n) || 0);
  if (v >= 1000) return formatCompactCount(Math.floor(v));
  if (Number.isInteger(v)) {
    return v.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");
  }
  const fixed = Number(v.toFixed(2));
  return fixed.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
