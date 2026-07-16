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
