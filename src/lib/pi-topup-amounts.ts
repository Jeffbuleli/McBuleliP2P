/**
 * Pi Browser wallet top-up presets from `NEXT_PUBLIC_PI_TOPUP_AMOUNTS`.
 * Comma-separated numbers; each segment is one pay button (preserve order).
 * Use a dot for decimals (e.g. 10.5); commas only separate options.
 */
export function parsePiTopupAmountsCsv(raw: string | undefined): number[] {
  if (raw === undefined || !String(raw).trim()) return [];
  const out: number[] = [];
  for (const part of String(raw).split(",")) {
    const t = part.trim();
    if (!t) continue;
    const n = Number(t);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

/** Client/server: env is inlined at build for NEXT_PUBLIC_* on the browser. */
export function getConfiguredPiTopupAmounts(): number[] {
  const fromList = parsePiTopupAmountsCsv(process.env.NEXT_PUBLIC_PI_TOPUP_AMOUNTS);
  if (fromList.length > 0) return fromList;
  const fallback = Number(process.env.NEXT_PUBLIC_PI_TEST_PAYMENT_AMOUNT ?? "0.1");
  if (Number.isFinite(fallback) && fallback > 0) return [fallback];
  return [0.1];
}
