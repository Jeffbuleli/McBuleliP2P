/** Log provider/technical errors server-side — never expose `detail` to end users. */
export function logFiatApiError(scope: string, detail: string | null | undefined): void {
  if (detail?.trim()) {
    console.error(`[fiat:${scope}]`, detail.trim());
  }
}

const SAFE_META_KEYS = new Set(["providerLabel", "rail", "networkDetected", "networkMatched"]);

export function sanitizeFiatTxForUser<T extends {
  failureCode?: string | null;
  failureMessage?: string | null;
  meta?: Record<string, unknown> | null;
}>(tx: T): T {
  const meta: Record<string, unknown> = {};
  if (tx.meta) {
    for (const key of SAFE_META_KEYS) {
      const v = tx.meta[key];
      if (typeof v === "string" && v.trim()) meta[key] = v.trim();
      if (typeof v === "boolean") meta[key] = v;
    }
  }
  return {
    ...tx,
    failureCode: null,
    failureMessage: tx.failureMessage ? "wallet_fiat_status_failed" : null,
    meta: Object.keys(meta).length ? meta : null,
  };
}
